# phi-scribe

**Open-source AI scribe for clinicians. Voice in → SOAP note out. Runs fully local.**

> Your AI scribe is sending patient audio and notes to a third-party LLM. Do you have a BAA? Does the LLM provider have a BAA? phi-scribe is an open-source alternative that keeps voice and notes on your machine by default.

---

## What it does

1. **Record** — tap the mic button, dictate your encounter notes
2. **Transcribe** — Whisper runs locally on your machine (no audio sent anywhere)
3. **Generate** — pick your model: local (Ollama) or cloud (BAA-gated)
4. **Review and copy** — edit the SOAP note, then copy to your EHR clipboard

**Pipeline:**
```
[ Clinician speaks ]
        ↓
[ Whisper (local, whisper.cpp) ]
        ↓
[ Model picker — local Ollama or cloud w/ BAA ]
        ↓
[ Structured SOAP note ]
        ↓
[ Edit in-app → copy to EHR ]
```

## Quick start

### Prerequisites

- **Node.js 18+**
- **[Ollama](https://ollama.ai)** running locally: `ollama pull llama3.1:8b`
- **[whisper.cpp](https://github.com/ggerganov/whisper.cpp)** built and model downloaded:

```bash
git clone https://github.com/ggerganov/whisper.cpp ~/whisper.cpp
cd ~/whisper.cpp && make -j
bash ./models/download-ggml-model.sh base
```

### Run phi-scribe

```bash
git clone https://github.com/engindearing/phi-scribe
cd phi-scribe
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Privacy model

| Step | What happens |
|------|-------------|
| Audio recording | Stays in browser memory until upload to local API |
| Transcription | Runs on your machine via whisper.cpp. Audio deleted immediately after. |
| Note generation | Local Ollama by default — never leaves your machine |
| Cloud models | Hard-blocked unless you explicitly confirm BAA in Settings |
| Audit log | Metadata only (timestamps, model IDs, word counts). No PHI text logged. |

---

## Local model setup (Ollama)

```bash
# Recommended for most machines
ollama pull llama3.1:8b

# Faster, smaller
ollama pull phi3.5

# Higher quality, needs 16GB RAM
ollama pull llama3.1:70b
```

---

## Whisper model sizing

| Model | RAM | Relative quality | Use when |
|-------|-----|-----------------|---------|
| tiny  | ~400MB | lowest | fast demo |
| base  | ~1GB | good | **recommended default** |
| small | ~2GB | better | Apple Silicon M2+ |
| medium | ~5GB | high | M3 Pro or better |
| large | ~10GB | highest | dedicated GPU |

---

## Cloud models (optional, requires BAA)

Cloud models (GPT-4o, Claude Sonnet/Opus) are **disabled by default**. To enable:

1. Obtain a signed BAA with OpenAI and/or Anthropic
2. Add your API keys to `.env.local`
3. Go to Settings → check the BAA confirmation
4. Cloud models will unlock in the model picker

**phi-scribe enforces this gate at the API level** — the server rejects cloud requests unless `baaConfirmed` is set, regardless of client state.

---

## SOAP note template

The default prompt template follows AAFP *Documentation Tips* and AHIMA CDI BoK standards. A SOOOAAP variant (Subjective / Objective-Observations / Objective-Old / Objective-Office / Assessment / Action) is available in future settings.

---

## Audit log

phi-scribe maintains a local SQLite audit log at `~/.phi-scribe/audit.db`. It records:
- Event type (transcription started/completed, note generated/copied/edited)
- Timestamp
- Model used
- Session ID
- Duration and word count

**No PHI text is written to the audit log.** The transcript and note text exist only in your browser session.

---

## Stack

- **Next.js 14** (Pages Router) + TypeScript
- **Tailwind CSS** + **Radix UI**
- **whisper.cpp** for local STT
- **Ollama** for local LLM inference (`/v1/chat/completions`)
- **better-sqlite3** for audit log

---

## License

MIT — use it, fork it, build on it.

---

## Competition context

| Product | Open source | Local inference | Model choice |
|---------|-------------|-----------------|-------------|
| Heidi | No | No | No |
| Abridge | No | No | No |
| Freed.ai | No | No | No |
| Nuance DAX | No | No | No |
| **phi-scribe** | **Yes** | **Yes** | **Yes** |
