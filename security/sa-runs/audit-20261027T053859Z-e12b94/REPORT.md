# Security Assessment — git:https://github.com/r1efoz/Dompet-Suami.git — run audit-20261027T053859Z-e12b94 — AUDIT
Label: AUDIT • Mode: audit • Level eksekusi: L0 • Environment: local-worktree • Platform: Darwin-arm64 • python 3.14.7 • commit a8a947f063f5980dd214e6adacf32f8d6348b2ce • tree b9e2b653f118
Otorisasi run: TIDAK TERVERIFIKASI (authorization_unverified) via trusted context `None` • Kelayakan bukti: dibandingkan dengan subject saat ini

## Ringkasan (dihasilkan dari data)
- Total kontrol: 77 = applicable 77 + N/A disetujui 0
- Applicable 77 = Pass 0 + Fail 0 + Belum diuji 77 + Exception aktif 0
- Konsistensi identitas hitung: OK
- **Siap untuk keputusan rilis (Pass DAN fresh): 0 dari 0 Pass** — Pass dengan freshness unknown/stale tidak dihitung
- Proposal/observasi yang DIABAIKAN karena tidak berwenang atau check belum diimplementasi: 166 (lihat lampiran)
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

## Temuan terbuka (1) — berbukti
Per severity: HIGH 1

| ID | Sev | Kontrol | Lokasi | Jenis | Ringkasan | Bukti |
|---|---|---|---|---|---|---|
| F-0001 | HIGH | SA-AGT-05 | `.claude/settings.json` | config | Tidak ada .claude/settings.json: tidak ada deny rule untuk secret/config agent (jalankan /secure-setup). | obs-0165 → `evidence/obs-0165.json` |

Jenis: `config`/`secret` = deterministik dari file; `design_risk` = kelemahan desain yang dampaknya runtime belum diuji; `candidate` = heuristik, perlu konfirmasi manusia (bisa false positive).

## Kontrol belum diuji — per alasan
- `authorization_unverified` (77): SA-GOV-01, SA-GOV-02, SA-GOV-03, SA-GOV-04, SA-GOV-05, SA-GOV-06, SA-AGT-01a, SA-AGT-01b, SA-AGT-02, SA-AGT-03, SA-AGT-04, SA-AGT-05, SA-AGT-06, SA-DEP-01, SA-DEP-02, SA-DEP-03, SA-DEP-04, SA-DEP-05, SA-DEP-06, SA-IAM-01, SA-IAM-02, SA-IAM-03, SA-IAM-04a, SA-IAM-04b, SA-IAM-05, SA-IAM-06, SA-DAT-01, SA-DAT-02a, SA-DAT-02b, SA-DAT-02c, SA-DAT-03, SA-DAT-04a, SA-DAT-04b, SA-DAT-05, SA-DAT-06, SA-APP-01, SA-APP-02, SA-APP-03, SA-APP-04, SA-APP-05, SA-APP-06, SA-BIZ-01, SA-BIZ-02, SA-BIZ-03, SA-BIZ-04, SA-BIZ-05, SA-BIZ-06, SA-CIC-01, SA-CIC-02, SA-CIC-03, SA-CIC-04, SA-CIC-05, SA-CIC-06, SA-INF-01, SA-INF-02, SA-INF-03, SA-INF-04, SA-INF-05, SA-INF-06, SA-AIL-01, SA-AIL-02, SA-AIL-03, SA-AIL-04, SA-AIL-05, SA-AIL-06, SA-TST-01, SA-TST-02, SA-TST-03, SA-TST-04, SA-TST-05, SA-TST-06, SA-OPS-01, SA-OPS-02, SA-OPS-03, SA-OPS-04, SA-OPS-05, SA-OPS-06

## Kontrol yang memerlukan keputusan manusia (decision_authority=human)
SA-GOV-01, SA-GOV-02, SA-GOV-03, SA-GOV-04, SA-GOV-05, SA-GOV-06, SA-AGT-02, SA-AGT-04, SA-IAM-01, SA-IAM-02, SA-IAM-04b, SA-IAM-05, SA-DAT-05, SA-DAT-06, SA-BIZ-02, SA-BIZ-03, SA-BIZ-06, SA-CIC-01, SA-CIC-06, SA-INF-02, SA-INF-04, SA-TST-02, SA-TST-04, SA-TST-06, SA-OPS-02, SA-OPS-03, SA-OPS-04, SA-OPS-05, SA-OPS-06

## Lampiran — proposal/observasi yang diabaikan
- {'observation_id': 'obs-0001', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0002', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0003', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0004', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0005', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0006', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0007', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0008', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0009', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0010', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0011', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0012', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0013', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0014', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0015', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0016', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0017', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0018', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0019', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0020', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0021', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0022', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0023', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0024', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0025', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0026', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0027', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0028', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0029', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0030', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0031', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0032', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0033', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0034', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0035', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0036', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0037', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0038', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0039', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0040', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0041', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0042', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0043', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0044', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0045', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0046', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0047', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0048', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0049', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0050', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0051', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0052', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0053', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0054', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0055', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0056', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0057', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0058', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0059', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0060', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0061', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0062', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0063', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0064', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0065', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0066', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0067', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0068', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0069', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0070', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0071', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0072', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0073', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0074', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0075', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0076', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0077', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0078', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0079', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0080', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0081', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0082', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0083', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0084', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0085', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0086', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0087', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0088', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0089', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0090', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0091', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0092', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0093', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0094', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0095', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0096', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0097', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0098', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0099', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0100', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0101', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0102', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0103', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0104', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0105', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0106', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0107', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0108', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0109', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0110', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0111', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0112', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0113', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0114', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0115', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0116', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0117', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0118', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0119', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0120', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0121', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0122', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0123', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0124', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0125', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0126', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0127', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0128', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0129', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0130', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0131', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0132', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0133', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0134', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0135', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0136', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0137', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0138', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0139', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0140', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0141', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0142', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0143', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0144', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0145', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0146', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0147', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0148', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0149', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0150', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0151', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0152', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0153', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0154', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0155', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0156', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0157', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0158', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0159', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0160', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0161', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0162', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0163', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0164', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0165', 'reason': 'authorization_unverified'}
- {'observation_id': 'obs-0166', 'reason': 'authorization_unverified'}

## Batasan
- Level eksekusi L0: kontrol dengan check berlevel lebih tinggi tidak dijalankan.
- Check yang belum diimplementasi (registry implemented=false) tidak pernah menghasilkan Pass.


## Kemampuan yang BELUM tersedia (eksplisit)

- Check terimplementasi (L0 statis): **20** dari 151; dijalankan pada run ini: 11.
- Belum tersedia — L0 (statis/attestation, belum ada collector): 79 check; L1 (eksekusi terisolasi): 22; L2 (dinamis berotorisasi): 30.
- Tidak tersedia pada MVP: SAST/DAST eksternal (semgrep, ZAP), pemindaian riwayat git, sandbox/boundary probe P6–P10, MCP/agent runtime probe, snapshot & resume replay-safe, uji unit rules Firebase, uji RLS runtime.
- Konsekuensi: kontrol yang memerlukan check di atas tetap **Belum diuji** (bukan Pass) walau check statisnya lulus.
- Scan internal (`app-02.internal-scan`, `iam-*`, `ops-01`) = pola heuristik, menghasilkan *kandidat* — bukan pengganti SAST.
