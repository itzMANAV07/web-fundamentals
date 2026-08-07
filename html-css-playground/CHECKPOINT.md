# Checkpoint — WhatsApp Message Notification Router

**Status: COMPLETE and submittable.** This file is a durable snapshot of
everything done so you have it even if the chat session ends.

## Deliverables (in this outputs folder)

1. **`code.zip`** — the full `code/` directory (main.py, router/, evaluation/,
   README.md, requirements.txt). Excludes the media analysis cache and
   the dataset, per submission rules.
2. **`output.csv`** — predictions for all 110 rows of `dataset/messages.csv`,
   with the required schema:
   `message_id,action,message_type,reason,confidence,evidence_message_ids`
3. **This checkpoint file.**

Still to hand in per the platform instructions: **`log.txt`**, which lives at
`~/hackerrank_orchestrate_august26/log.txt` inside the working
environment (per `AGENTS.md`'s transcript-logging contract) — grab that
file directly if the platform needs it separately from this chat.

## What the system does

Rule-based (fully deterministic, no API key required) router that reads
every CSV in `dataset/` plus the actual image/audio files, and decides
`notify` / `digest` / `mute` for each message. Full design writeup is in
`code/README.md` inside the zip — short version:

- **Images** → OCR'd with `pytesseract` (with an `ffmpeg` fallback for a
  couple of mislabeled AVIF files found in the dataset).
- **Voice notes** → transcribed offline with CMU PocketSphinx (no
  network/API key needed; genuine ASR, not a stub — quality is modest on
  accented/short speech, documented as a known limitation).
- **Text signals** → regex/keyword detection for scam/phishing, payment,
  event, promotion, greeting, urgency, direct-mention/question patterns,
  plus prompt-injection detection (messages that try to instruct the
  router are flagged, not obeyed).
- **Trust/context** → group type + admin role + mute state, business
  verification + domain match + report rate, real user-business
  relationship history, quiet-hours (DND) window.
- **Evidence retrieval** → pulls real `message_id`s from
  `message_history.csv` (same sender/group/business + keyword overlap),
  cross-checked against `message_events.csv` reactions.
- **Decision engine** (`router/decide.py`) → fixed priority order: scam/
  safety risk mutes regardless of engagement → direct mentions/asks
  override a muted group → operational-admin urgency → verified-business
  relationship urgency → promotions (mute if opted out / repeatedly
  dismissed by the *same* sender) → greetings/forwards → safe fallback.
- **Optional LLM layer** (`router/llm.py`) — off by default; only
  activates if you set both `ANTHROPIC_API_KEY` and `USE_LLM=1`, and
  always falls back safely to the rule engine on any failure.

## Self-evaluation result

Ran `evaluation/evaluate.py` against the 30 organizer-labeled rows in
`dataset/sample_messages.csv` (used only for calibration/self-check, never
fed into the router or hardcoded):

```
Action accuracy:       29/30 = 96.7%
Message_type accuracy: 27/30 = 90.0%
Both correct:          27/30 = 90.0%
```

Remaining 3 mismatches, all understood and documented (not silently
ignored):
- 2 are voice notes where PocketSphinx's offline ASR produced a low-quality
  transcript (a fundamental offline-ASR-accuracy limitation, not a logic bug).
- 1 is a subjective type call (`event` vs `urgent` for a same-day school
  bus schedule change) — the `action` (notify) was correct either way.

## How to reproduce

```bash
cd code
pip install -r requirements.txt          # needs: tesseract-ocr, ffmpeg (system pkgs)
python3 main.py --dataset ../dataset --out ../dataset/output.csv
python3 evaluation/evaluate.py --dataset ../dataset   # self-check vs sample_messages.csv
```

## Timeline note

Onboarding/agreement for this HackerRank Orchestrate challenge was
recorded at 2026-08-01T14:56:00Z. Development, debugging, and 3 rounds of
rule refinement (each verified by re-running the evaluator) followed in
this session, ending with the 96.7%/90% result above.
