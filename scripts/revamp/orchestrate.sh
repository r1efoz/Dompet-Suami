#!/usr/bin/env bash
# Orkestrasi failover: scripts/revamp/orchestrate.sh <dari> [sampai]   (default sampai 11)
#   1. opencode  — sampai MAX_TRY kali per tugas; gagal semua → 2
#   2. agy       — sampai MAX_TRY kali per tugas; gagal semua → 3
#   3. claude    — kerjakan langsung sampai CLAUDE_TASKS tugas berturut-turut, lalu kembali ke 1
# Berulang sampai semua tugas selesai (review ACCEPT) atau claude pun gagal.
# Satu "percobaan" = satu scripts/revamp/task.sh N (yang di dalamnya sudah ada 2× lanjut sesi + 2× perbaikan review).
# Sebelum tiap percobaan ada cek kesehatan 90 detik; pekerja yang mati tidak dibiarkan membakar waktu penuh.
set -u
FROM="${1:?dari tugas}"; TO="${2:-11}"
MAX_TRY="${MAX_TRY:-10}"; CLAUDE_TASKS="${CLAUDE_TASKS:-2}"; WAIT="${WAIT:-60}"
DIR="$(cd "$(dirname "$0")" && pwd)"; ROOT="$(cd "$DIR/../.." && pwd)"; cd "$ROOT"
STATE="docs/handoff/reviews/orchestrate.log"; mkdir -p docs/handoff/reviews
note() { printf '%s %s\n' "$(date '+%H:%M:%S')" "$*" | tee -a "$STATE"; }

healthy() {
  case "$1" in
    opencode) timeout 90 opencode run --title "health" "Balas persis satu kata: SIAP. Jangan pakai tool." 2>&1 | grep -q "SIAP" ;;
    agy)      timeout 90 agy -p "Balas persis satu kata: SIAP. Jangan pakai tool." --output-format text 2>&1 | grep -q "SIAP" ;;
    claude)   timeout 90 claude -p "Balas persis: SIAP" --max-turns 1 --output-format text 2>&1 | grep -q "SIAP" ;;
  esac
}

# attempt <worker> <N> → 0 sukses, 1 gagal
attempt() {
  local w="$1" n="$2"
  if ! healthy "$w"; then note "[$w] tidak sehat (health check gagal)"; return 1; fi
  WORKER="$w" "$DIR/task.sh" "$n"; local rc=$?
  note "[$w] Tugas $n → task.sh exit $rc"
  [ "$rc" = 0 ]
}

# try_worker <worker> <N> → 0 jika salah satu dari MAX_TRY percobaan sukses
try_worker() {
  local w="$1" n="$2" i
  for i in $(seq 1 "$MAX_TRY"); do
    note "[$w] Tugas $n percobaan $i/$MAX_TRY"
    attempt "$w" "$n" && return 0
    [ "$i" -lt "$MAX_TRY" ] && sleep "$WAIT"
  done
  return 1
}

claude_left=0   # sisa jatah tugas berturut-turut untuk claude
N="$FROM"
while [ "$N" -le "$TO" ]; do
  note "===== Tugas $N ====="
  if [ "$claude_left" -gt 0 ]; then
    if attempt claude "$N"; then claude_left=$((claude_left-1)); N=$((N+1)); continue; fi
    note "claude gagal pada Tugas $N; berhenti."; exit 1
  fi
  if try_worker opencode "$N"; then N=$((N+1)); continue; fi
  note "opencode gagal $MAX_TRY kali → pindah ke agy"
  if try_worker agy "$N"; then N=$((N+1)); continue; fi
  note "agy gagal $MAX_TRY kali → claude mengambil alih $CLAUDE_TASKS tugas"
  if attempt claude "$N"; then claude_left=$((CLAUDE_TASKS-1)); N=$((N+1)); continue; fi
  note "claude gagal pada Tugas $N; berhenti."; exit 1
done
note "Semua tugas $FROM–$TO selesai."
