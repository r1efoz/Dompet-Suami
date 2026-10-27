# Security Assessment — git:https://github.com/r1efoz/Dompet-Suami.git — run verify-20261027T055236Z-a2fc7d — VERIFY
Label: VERIFY • Mode: verify • Level eksekusi: L0 • Environment: local-worktree • Platform: Darwin-arm64 • python 3.14.7 • commit 5de21ebd53ec6bef569fca48dd020820378fa56f • tree 35143d31e826
Otorisasi run: terverifikasi via trusted context `sa-authorize` • Kelayakan bukti: dibandingkan dengan subject saat ini

## Ringkasan (dihasilkan dari data)
- Total kontrol: 77 = applicable 77 + N/A disetujui 0
- Applicable 77 = Pass 0 + Fail 0 + Belum diuji 77 + Exception aktif 0
- Konsistensi identitas hitung: OK
- **Siap untuk keputusan rilis (Pass DAN fresh): 0 dari 0 Pass** — Pass dengan freshness unknown/stale tidak dihitung
> Laporan ini tidak menyatakan aplikasi aman atau compliant; ia melaporkan status per kontrol dan apa yang belum diuji.

## Status per domain
| Domain | Total | Applicable | Pass | Fail | Belum diuji | N/A | Exception | Release-ready |
|---|---|---|---|---|---|---|---|---|
| AGT | 7 | 7 | 0 | 0 | 7 | 0 | 0 | 0 |
| AIL | 6 | 6 | 0 | 0 | 6 | 0 | 0 | 0 |
| APP | 6 | 6 | 0 | 0 | 6 | 0 | 0 | 0 |
| BIZ | 6 | 6 | 0 | 0 | 6 | 0 | 0 | 0 |
| CIC | 6 | 6 | 0 | 0 | 6 | 0 | 0 | 0 |
| DAT | 9 | 9 | 0 | 0 | 9 | 0 | 0 | 0 |
| DEP | 6 | 6 | 0 | 0 | 6 | 0 | 0 | 0 |
| GOV | 6 | 6 | 0 | 0 | 6 | 0 | 0 | 0 |
| IAM | 7 | 7 | 0 | 0 | 7 | 0 | 0 | 0 |
| INF | 6 | 6 | 0 | 0 | 6 | 0 | 0 | 0 |
| OPS | 6 | 6 | 0 | 0 | 6 | 0 | 0 | 0 |
| TST | 6 | 6 | 0 | 0 | 6 | 0 | 0 | 0 |

## Status per ID sumber (agregasi parent)
- **Belum diuji** (72): AGT-01, AGT-02, AGT-03, AGT-04, AGT-05, AGT-06, AIL-01, AIL-02, AIL-03, AIL-04, AIL-05, AIL-06, APP-01, APP-02, APP-03, APP-04, APP-05, APP-06, BIZ-01, BIZ-02, BIZ-03, BIZ-04, BIZ-05, BIZ-06, CIC-01, CIC-02, CIC-03, CIC-04, CIC-05, CIC-06, DAT-01, DAT-02, DAT-03, DAT-04, DAT-05, DAT-06, DEP-01, DEP-02, DEP-03, DEP-04, DEP-05, DEP-06, GOV-01, GOV-02, GOV-03, GOV-04, GOV-05, GOV-06, IAM-01, IAM-02, IAM-03, IAM-04, IAM-05, IAM-06, INF-01, INF-02, INF-03, INF-04, INF-05, INF-06, OPS-01, OPS-02, OPS-03, OPS-04, OPS-05, OPS-06, TST-01, TST-02, TST-03, TST-04, TST-05, TST-06

## Kontrol Fail
- tidak ada Fail yang tercatat (bukan berarti tidak ada kelemahan)

## Temuan terbuka (0) — berbukti
- tidak ada temuan terbuka dari check yang dijalankan (lihat daftar check yang belum tersedia di bawah).

## Temuan ditutup oleh retest statis (4)
- C-F-0001 (retest of verify-20261027T055149Z-761c31#F-0001) `.claude/settings.json` — tidak terdeteksi lagi pada run verify-20261027T055236Z-a2fc7d (retest statis; bukan bukti perbaikan runtime)
- C-F-0002 (retest of verify-20261027T055149Z-761c31#F-0002) `.claude/settings.json` — tidak terdeteksi lagi pada run verify-20261027T055236Z-a2fc7d (retest statis; bukan bukti perbaikan runtime)
- C-F-0003 (retest of verify-20261027T055149Z-761c31#F-0003) `.claude/settings.json` — tidak terdeteksi lagi pada run verify-20261027T055236Z-a2fc7d (retest statis; bukan bukti perbaikan runtime)
- C-F-0004 (retest of verify-20261027T055149Z-761c31#F-0004) `.claude/settings.json` — tidak terdeteksi lagi pada run verify-20261027T055236Z-a2fc7d (retest statis; bukan bukti perbaikan runtime)

## Kontrol belum diuji — per alasan
- `not_executed` (76): SA-GOV-01, SA-GOV-02, SA-GOV-03, SA-GOV-04, SA-GOV-05, SA-GOV-06, SA-AGT-01a, SA-AGT-01b, SA-AGT-02, SA-AGT-03, SA-AGT-04, SA-AGT-05, SA-AGT-06, SA-DEP-01, SA-DEP-03, SA-DEP-04, SA-DEP-05, SA-DEP-06, SA-IAM-01, SA-IAM-02, SA-IAM-03, SA-IAM-04a, SA-IAM-04b, SA-IAM-05, SA-IAM-06, SA-DAT-01, SA-DAT-02a, SA-DAT-02b, SA-DAT-02c, SA-DAT-03, SA-DAT-04a, SA-DAT-04b, SA-DAT-05, SA-DAT-06, SA-APP-01, SA-APP-02, SA-APP-03, SA-APP-04, SA-APP-05, SA-APP-06, SA-BIZ-01, SA-BIZ-02, SA-BIZ-03, SA-BIZ-04, SA-BIZ-05, SA-BIZ-06, SA-CIC-01, SA-CIC-02, SA-CIC-03, SA-CIC-04, SA-CIC-05, SA-CIC-06, SA-INF-01, SA-INF-02, SA-INF-03, SA-INF-04, SA-INF-05, SA-INF-06, SA-AIL-01, SA-AIL-02, SA-AIL-03, SA-AIL-04, SA-AIL-05, SA-AIL-06, SA-TST-01, SA-TST-02, SA-TST-03, SA-TST-04, SA-TST-05, SA-TST-06, SA-OPS-01, SA-OPS-02, SA-OPS-03, SA-OPS-04, SA-OPS-05, SA-OPS-06
- `inconclusive` (1): SA-DEP-02

## Kontrol yang memerlukan keputusan manusia (decision_authority=human)
SA-GOV-01, SA-GOV-02, SA-GOV-03, SA-GOV-04, SA-GOV-05, SA-GOV-06, SA-AGT-02, SA-AGT-04, SA-IAM-01, SA-IAM-02, SA-IAM-04b, SA-IAM-05, SA-DAT-05, SA-DAT-06, SA-BIZ-02, SA-BIZ-03, SA-BIZ-06, SA-CIC-01, SA-CIC-06, SA-INF-02, SA-INF-04, SA-TST-02, SA-TST-04, SA-TST-06, SA-OPS-02, SA-OPS-03, SA-OPS-04, SA-OPS-05, SA-OPS-06

## Batasan
- Level eksekusi L0: kontrol dengan check berlevel lebih tinggi tidak dijalankan.
- Check yang belum diimplementasi (registry implemented=false) tidak pernah menghasilkan Pass.


## Kemampuan yang BELUM tersedia (eksplisit)

- Check terimplementasi (L0 statis): **20** dari 151; dijalankan pada run ini: 11.
- Belum tersedia — L0 (statis/attestation, belum ada collector): 79 check; L1 (eksekusi terisolasi): 22; L2 (dinamis berotorisasi): 30.
- Tidak tersedia pada MVP: SAST/DAST eksternal (semgrep, ZAP), pemindaian riwayat git, sandbox/boundary probe P6–P10, MCP/agent runtime probe, snapshot & resume replay-safe, uji unit rules Firebase, uji RLS runtime.
- Konsekuensi: kontrol yang memerlukan check di atas tetap **Belum diuji** (bukan Pass) walau check statisnya lulus.
- Scan internal (`app-02.internal-scan`, `iam-*`, `ops-01`) = pola heuristik, menghasilkan *kandidat* — bukan pengganti SAST.


## Hasil verifikasi terhadap run `verify-20261027T055149Z-761c31`

- Masih terbuka: **0** · Tidak terdeteksi lagi (closed, retest statis): **4** · Baru: **0**
- Catatan: 'closed' = pola tidak lagi ditemukan oleh collector statis yang sama pada subjek baru; bukan bukti perilaku runtime. Keputusan rilis tetap manusia.

| Finding lama (run#id) | Kontrol | Lokasi lama | Ringkasan |
|---|---|---|---|
| verify-20261027T055149Z-761c31#F-0001 | SA-AGT-05 | `.claude/settings.json` | Deny rule `Read(.env)` tidak ada. |
| verify-20261027T055149Z-761c31#F-0002 | SA-AGT-05 | `.claude/settings.json` | Deny rule `Edit(.claude/settings.json)` tidak ada. |
| verify-20261027T055149Z-761c31#F-0003 | SA-AGT-05 | `.claude/settings.json` | Deny rule `Edit(.mcp.json)` tidak ada. |
| verify-20261027T055149Z-761c31#F-0004 | SA-AGT-05 | `.claude/settings.json` | Deny rule `Edit(.github/workflows/**)` tidak ada. |
