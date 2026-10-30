#!/usr/bin/env bash
# Jalankan satu tugas revamp: OpenCode mengerjakan, Claude headless mereview, OpenCode memperbaiki bila ditolak.
# Pakai: scripts/revamp/task.sh <N>      (maks 2 putaran perbaikan)
set -uo pipefail
N="${1:?nomor tugas}"; MAX_FIX="${MAX_FIX:-2}"; EXTRA="${EXTRA:-}"; SKIP_WORK="${SKIP_WORK:-0}"  # SKIP_WORK=1: tugas sudah di-commit, langsung review
WORKER="${WORKER:-opencode}"   # opencode | agy  (agy = Antigravity CLI, dipakai saat provider gratis OpenCode habis kuota)
AGY_MODEL="${AGY_MODEL:-gemini-3.8-flash-high}"
OC_MODEL="${OC_MODEL:-}"       # opsional: provider/model untuk OpenCode, mis. "9router/cx/gpt-6-luna[1m]" saat combo default rusak
OC_FLAGS=(); [ -n "$OC_MODEL" ] && OC_FLAGS=(--model "$OC_MODEL")
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"; cd "$ROOT"
REV_DIR="docs/handoff/reviews"; mkdir -p "$REV_DIR"
LOG="docs/handoff/revamp-ui.md"

[ -f .env.local ] || { echo "ABORT: .env.local tidak ada (app akan mengarah ke hosted)."; exit 2; }
grep -q "127.0.0.1:55321" .env.local || { echo "ABORT: .env.local tidak mengarah ke 127.0.0.1:55321."; exit 2; }

STARTED_DEV=0
if ! lsof -nP -iTCP:5173 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "[task $N] memulai dev server :5173"
  (npm run dev -- --port 5173 --strictPort >"$REV_DIR/dev-server.log" 2>&1 &) ; STARTED_DEV=1
  for _ in $(seq 1 30); do lsof -nP -iTCP:5173 -sTCP:LISTEN >/dev/null 2>&1 && break; sleep 1; done
fi


# Jalankan agen pekerja. new = sesi baru, continue = lanjutkan sesi tugas ini.
run_worker() {
  local mode="$1" msg="$2"
  if [ "$WORKER" = agy ]; then
    if [ "$mode" = new ]; then
      agy -p "$msg" --sandbox --settings scripts/revamp/agy-settings.json --model "$AGY_MODEL" --output-format text 2>&1
    else
      agy --continue -p "$msg" --sandbox --settings scripts/revamp/agy-settings.json --model "$AGY_MODEL" --output-format text 2>&1
    fi
  else
    if [ "$mode" = new ]; then
      opencode run "${OC_FLAGS[@]}" --title "Revamp Tugas $N" --session "$OC_SESSION" --auto "$msg" 2>&1
    else
      opencode run "${OC_FLAGS[@]}" --session "$OC_SESSION" --auto "$msg" 2>&1
    fi
  fi
}

render() { sed -e "s/{N}/$N/g" -e "s|{EXTRA}|$2|" "$1"; }
ts() { date '+%Y-%m-%d %H:%M'; }

OC_SESSION="ses_revamp_task${N}_$(date +%s)"  # OpenCode mewajibkan awalan "ses"
if [ "$SKIP_WORK" = 1 ]; then
  echo "[task $N] SKIP_WORK=1 — lewati pengerjaan, langsung review HEAD"
else
  echo "[task $N] $WORKER mengerjakan…"
  AGY_NOTE=""
  if [ "$WORKER" = agy ]; then
    AGY_NOTE="PENTING untuk sesi headless ini: perintah shell yang TIDAK ada di daftar izin akan MEMBATALKAN seluruh sesi tanpa peringatan. Hanya pakai: git status/diff/log/show/add/commit/rm/mv, npm run check|build|test:ui, npx tsx <file>.check.ts, node scripts/make-icons.mjs, psql … -f supabase/*.sql, ls/cat/head/tail/grep/rg/wc/sed -n/find/echo/mkdir. Satu perintah per panggilan, tanpa &&/;/|. Untuk membaca/mengubah file pakai tool read/edit_file/write_file, bukan shell."
  fi
  HEAD_BEFORE="$(git rev-parse HEAD)"
  run_worker new "$(render scripts/revamp/task-prompt.md "$EXTRA $AGY_NOTE")" \
    | tee "$REV_DIR/task-$N-opencode-r0.log"
  OC_EXIT="${PIPESTATUS[0]}"
  # Sesi bisa putus (provider gratis error) atau dibatalkan (agy: perintah di luar izin). Lanjutkan sesi yang sama, maks 2 kali.
  for RETRY in 1 2; do
    if [ "$OC_EXIT" = 0 ] && [ "$(git rev-parse HEAD)" != "$HEAD_BEFORE" ]; then break; fi
    echo "[task $N] belum ada commit (exit $OC_EXIT); tunggu 20 detik lalu lanjutkan sesi (percobaan $RETRY/2)…"
    sleep 20
    run_worker continue "Sesi sebelumnya terputus atau dibatalkan (kemungkinan error penyedia model, atau perintah shell di luar daftar izin). Lanjutkan Tugas $N persis dari tempat berhenti: jalankan git status --short, lihat file yang sudah berubah, jangan ulangi dari nol, selesaikan sampai commit dan Log, lalu BERHENTI. $AGY_NOTE" \
      | tee -a "$REV_DIR/task-$N-opencode-r0.log"
    OC_EXIT="${PIPESTATUS[0]}"
  done
  if [ "$(git rev-parse HEAD)" = "$HEAD_BEFORE" ]; then echo "[task $N] ABORT: $WORKER tidak menghasilkan commit baru setelah 2 percobaan lanjut (lihat log)."; exit 3; fi
fi

for ROUND in $(seq 0 "$MAX_FIX"); do
  OUT="$REV_DIR/task-$N-review-r$ROUND.md"
  echo "[task $N] Claude mereview (putaran $ROUND)…"
  claude -p "$(render scripts/revamp/review-prompt.md "")" \
    --output-format text --max-turns 40 --permission-mode default \
    --allowedTools "Read" "Glob" "Grep" "Bash(git log *)" "Bash(git show *)" "Bash(git diff *)" "Bash(git status *)" "Bash(npm run check)" "Bash(npm run build)" "Bash(npm run test:ui)" \
    >"$OUT" 2>"$REV_DIR/task-$N-review-r$ROUND.err" || true
  VERDICT="$(head -1 "$OUT" | tr -d '\r')"
  echo "[task $N] $VERDICT → $OUT"
  printf -- '- %s — Tugas %s — review Claude putaran %s — %s — detail: %s\n' "$(ts)" "$N" "$ROUND" "$VERDICT" "$OUT" >>"$LOG"
  if [ "$VERDICT" = "VERDICT: ACCEPT" ]; then
    git add "$LOG" "$REV_DIR" >/dev/null 2>&1; git commit -q -m "chore(revamp): review log task $N" >/dev/null 2>&1 || true
    [ "$STARTED_DEV" = 1 ] && pkill -f "vite.*--port 5173" >/dev/null 2>&1
    echo "[task $N] SELESAI"; exit 0
  fi
  [ "$ROUND" -ge "$MAX_FIX" ] && break
  echo "[task $N] $WORKER memperbaiki…"
  FIX_MSG="Review independen MENOLAK Tugas $N. Isi review ada di $OUT — baca seluruhnya. Perbaiki setiap butir di bagian Temuan tanpa melanggar aturan yang sama, jalankan ulang verifikasi tugas, tempel outputnya, commit perbaikan sebagai commit baru dengan pesan 'fix(revamp): task $N review round $((ROUND+1))', tambah 1 baris Log, lalu BERHENTI."
  HEAD_BEFORE="$(git rev-parse HEAD)"
  run_worker continue "$FIX_MSG" | tee "$REV_DIR/task-$N-opencode-r$((ROUND+1)).log"
  if [ "$(git rev-parse HEAD)" = "$HEAD_BEFORE" ]; then echo "[task $N] ABORT: OpenCode tidak meng-commit perbaikan."; exit 3; fi
done

[ "$STARTED_DEV" = 1 ] && pkill -f "vite.*--port 5173" >/dev/null 2>&1
echo "[task $N] GAGAL setelah $MAX_FIX perbaikan. Baca $REV_DIR/task-$N-review-r*.md lalu putuskan manual."
exit 1
