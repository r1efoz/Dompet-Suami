#!/usr/bin/env bash
# Jalankan tugas berurutan: scripts/revamp/all.sh <dari> [sampai]   (default sampai 11). Berhenti di tugas pertama yang gagal.
set -u
FROM="${1:?dari tugas}"; TO="${2:-11}"
DIR="$(cd "$(dirname "$0")" && pwd)"
for N in $(seq "$FROM" "$TO"); do
  "$DIR/task.sh" "$N" || { echo "Berhenti di Tugas $N."; exit 1; }
done
echo "Semua tugas $FROM–$TO selesai."
