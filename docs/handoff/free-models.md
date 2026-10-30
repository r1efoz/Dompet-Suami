# Model gratis untuk loop OpenCode — hasil uji 2026-10-30 18:20 WIB

Semua diuji langsung dengan `curl` dari mesin ini. Angka bisa berubah; uji ulang sebelum mengandalkan.

## Tanpa key sama sekali (anonim)

| Endpoint | Model yang jalan anonim | Tool calling | Batas anonim | Layak untuk agen? |
|---|---|---|---|---|
| **LLM7** `https://api.llm7.io/v1` | `codestral-latest` (alias `default`); model lain minta key | **Ya** (diuji: memanggil `get_time` dengan benar) | ±15 req/menit per IP (burst 6 req → 2 lolos, 4 ditolak 429); token gratis → 30 RPM | **Ya, dengan retry.** Satu-satunya yang masuk akal. |
| OVHcloud AI Endpoints `https://oai.endpoints.kepler.ai.cloud.ovh.net/v1` | `gpt-oss-120b` | ya (model mendukung) | 2 req/menit per IP | Tidak (terlalu lambat untuk puluhan panggilan tool per tugas) |
| Pollinations `https://text.pollinations.ai/openai` | `openai` (GPT-OSS 20B) | ya | 1 balasan / 30 detik per IP | Tidak |
| OpenCode Free via 9Router (`oc/*`) | 8 model Zen gratis | ya | kuota harian anonim — **habis hari ini** (`FreeUsageLimitError`) | Ya saat kuota ada; sudah dipakai combo sekarang |
| MiMo Free via 9Router (`mmf/*`) | — | — | `Unsupported model` untuk semua id | Rusak (integrasi 9Router usang) |
| Kilo Gateway anonim | — | — | `PAID_MODEL_AUTH_REQUIRED` | Tidak |
| OpenRouter anonim | — | — | `401 No cookie auth` | Tidak |

## Gratis tapi perlu daftar (key gratis, tanpa kartu) — lebih kuat & lebih cepat

| Provider | Base URL | Batas gratis | Model untuk coding/agen | Sudah ada di 9Router? |
|---|---|---|---|---|
| **Cerebras** | `https://api.cerebras.ai/v1` | 30 RPM, 60k TPM, 14.400 RPD | `gpt-oss-120b`, `qwen-3-235b-a22b-instruct-2507` | Ya (`cerebras/*`) — tinggal isi key |
| **Groq** | `https://api.groq.com/openai/v1` | 30 RPM, 14.400 RPD | `openai/gpt-oss-120b`, `qwen/qwen3-32b` | Ya (`groq/*`) |
| **Google AI Studio** | `https://generativelanguage.googleapis.com/v1beta/openai/` | 15 RPM / 1.500 RPD (Flash) | `gemini-3.x-flash` | Ya (`gemini/*`) |
| NVIDIA NIM | `https://integrate.api.nvidia.com/v1` | 40 RPM (kredit) | `deepseek-v4-flash`, `kimi-k2.6` | Ya (`nvidia/*`) |
| Mistral | `https://api.mistral.ai/v1` | 1 req/detik, 1 M token/bulan | `codestral-latest` | Ya (`mistral/*`) |
| Cloudflare Workers AI | REST sendiri | 10.000 neuron/hari | `glm-4.7-flash`, `kimi-k2.6` | Ya (`cf/*`, butuh accountId) |

Rekomendasi combo `Coding-Gratis` (urutan fallback): `cx/gpt-6-luna` → `cerebras/gpt-oss-120b` → `groq/openai/gpt-oss-120b` → `gemini/gemini-3.8-flash` → `oc/glm-5.3-flash-free` → `llm7/codestral-latest`.

## Cara pasang LLM7 (tanpa key)

### A. Langsung di OpenCode (tanpa 9Router), `~/.config/opencode/opencode.json`

```json
"provider": {
  "llm7": {
    "npm": "@ai-sdk/openai-compatible",
    "name": "LLM7 (gratis, tanpa key)",
    "options": { "baseURL": "https://api.llm7.io/v1", "apiKey": "anonymous" },
    "models": {
      "codestral-latest": { "name": "Codestral via LLM7", "limit": { "context": 128000, "output": 8000 } }
    }
  }
}
```

Uji: `opencode run -m llm7/codestral-latest "Balas satu kata: SIAP"`.
Untuk loop: `opencode run -m llm7/codestral-latest …` atau ubah `"model"` di config. `apiKey` boleh teks apa saja; LLM7 mengabaikannya saat anonim.

### B. Lewat 9Router (agar masuk combo fallback)

Dashboard 9Router → Providers → tambah **Custom OpenAI-compatible** → base URL `https://api.llm7.io/v1`, key `anonymous` (9Router mewajibkan field key terisi; "any placeholder works"), model `codestral-latest`. Lalu Combo → `Coding-Gratis` → tambah di urutan terakhir.

Token gratis LLM7 (menaikkan ke 30 RPM): daftar di situs llm7.io, lalu ganti `anonymous` dengan token itu.

## Catatan

- Provider gratis mungkin menyimpan prompt untuk pelatihan. Repo ini tidak berisi rahasia (`.env*` ditolak dibaca agen), tapi isi kode akan terkirim.
- Codestral lebih lemah dari gpt-6-luna untuk tugas multi-langkah; reviewer Claude tetap menangkap kesalahannya. Harapkan lebih banyak putaran perbaikan.
- `scripts/revamp/task.sh` sudah retry 2× (30 detik) saat provider putus; untuk reset kuota (20 menit–1 hari) jalankan ulang manual.
