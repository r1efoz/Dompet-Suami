#!/usr/bin/env bash
# Jalankan satu tugas revamp: OpenCode mengerjakan, Claude headless mereview, OpenCode memperbaiki bila ditolak.
# Pakai: scripts/revamp/task.sh <N>      (maks 2 putaran perbaikan)
set -uo pipefail
N="${1:?nomor tugas}"; MAX_FIX="${MAX_FIX:-2}"; EXTRA="${EXTRA:-}"; SKIP_WORK="${SKIP_WORK:-0}"  # SKIP_WORK=1: tugas sudah di-commit, langsung review
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

render() { sed -e "s/{N}/$N/g" -e "s|{EXTRA}|$2|" "$1"; }
ts() { date '+%Y-%m-%d %H:%M'; }

OC_SESSION="revamp-task-$N-$(date +%s)"
if [ "$SKIP_WORK" = 1 ]; then
  echo "[task $N] SKIP_WORK=1 — lewati pengerjaan, langsung review HEAD"
else
  echo "[task $N] OpenCode mengerjakan…"
  opencode run --title "Revamp Tugas $N" --session "$OC_SESSION" --auto "$(render scripts/revamp/task-prompt.md "$EXTRA")" \
    | tee "$REV_DIR/task-$N-opencode-r0.log"
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
  echo "[task $N] OpenCode memperbaiki…"
  FIX_MSG="Review independen MENOLAK Tugas $N. Isi review ada di $OUT — baca seluruhnya. Perbaiki setiap butir di bagian Temuan tanpa melanggar aturan yang sama, jalankan ulang verifikasi tugas, tempel outputnya, commit perbaikan sebagai commit baru dengan pesan 'fix(revamp): task $N review round $((ROUND+1))', tambah 1 baris Log, lalu BERHENTI."
  opencode run --session "$OC_SESSION" --auto "$FIX_MSG" | tee "$REV_DIR/task-$N-opencode-r$((ROUND+1)).log"
done

[ "$STARTED_DEV" = 1 ] && pkill -f "vite.*--port 5173" >/dev/null 2>&1
echo "[task $N] GAGAL setelah $MAX_FIX perbaikan. Baca $REV_DIR/task-$N-review-r*.md lalu putuskan manual."
exit 1
