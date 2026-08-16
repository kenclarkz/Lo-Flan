# Lo-Flan AI Phone Receptionist + Admin Orders (Stage 2)

A backend that answers your Twilio phone number with an AI receptionist that
talks to callers about **Lo's Flan**. It uses **Twilio Voice + Media Streams**
for the phone audio and Google's **Gemini Live** for conversation. Every call
is recorded and exposed to the admin dashboard's **Orders & Chat** page
(`GET /api/orders`, protected by `ADMIN_API_KEY`).

> The website **chat bot** is now fully built-in and runs entirely in the
> browser against a local knowledge base (`data/chatbot.ts` + `lib/chatbot.ts`).
> It needs no API key, no AI service, and no connection to this backend. The
> admin orders API below is used by the admin dashboard only.

```
Caller ──► Twilio ──► POST /twilio/incoming (returns TwiML)
                          │
                          └── plays greeting, then opens:
                          └── WSS /media-stream (8 kHz µ-law audio)
                                   │
                          bridge converts audio
                                   │
                          Gemini Live (16 kHz PCM in / 24 kHz PCM out)

Call record ──► store/orders.js ──► GET /api/orders (admin dashboard)
```

- The phone AI takes orders (menu/prices are real facts now) and records each
  call's transcript. Records land in the order store and are surfaced by
  `GET /api/orders` (protected by `ADMIN_API_KEY`) for the admin dashboard.

---

## 1. What you need

| Account/service | Why | Cost |
|---|---|---|
| [Twilio](https://www.twilio.com/try-twilio) (a phone number with Voice) | Answers the call, streams audio to you | Trial credit or ~$1.15/mo per number + usage |
| [Google AI Studio](https://aistudio.google.com/apikey) | Free Gemini Live API key | Free tier |
| A public HTTPS URL (ngrok / VPS / Cloud Run / Railway...) | Twilio must reach your webhook + WebSocket | ngrok free tier is enough to test |

No paid accounts are required to test.

---

## 2. Environment variables

Copy the template and fill it in:

```bash
cp .env.example .env
```

| Variable | Required | Purpose |
|---|---|---|
| `PORT` | no | Port to listen on (default `8080`) |
| `APP_BASE_URL` | recommended | Public base URL, e.g. `https://abc123.ngrok-free.app`. Used to build the `wss://.../media-stream` URL. If empty, derived from each request's `Host` header. |
| `GEMINI_API_KEY` | **yes** | Free key from https://aistudio.google.com/apikey |
| `GEMINI_LIVE_MODEL` | no | Live model (default `gemini-2.5-flash-live-preview`) |
| `GEMINI_VOICE` | no | Gemini voice (default `Puck`) |
| `ADMIN_API_KEY` | **recommended** | Shared secret guarding `GET /api/orders` + friends. The admin dashboard sends it as the `X-Admin-Key` header. Leave empty to disable the admin endpoints. |
| `ORDERS_FILE` | no | JSON file where orders/calls persist (default `./data/orders.json`) |
| `TWILIO_AUTH_TOKEN` | no | Enables webhook signature verification (see below) |
| `VERIFY_TWILIO_SIGNATURES` | no | `true` to verify `X-Twilio-Signature` on incoming webhooks (requires `TWILIO_AUTH_TOKEN`) |
| `GREETING_MESSAGE` | no | Spoken greeting before the AI connects |
| `UNAVAILABLE_MESSAGE` | no | Fallback message when the AI can't start |
| `LOG_LEVEL` | no | `debug` \| `info` \| `warn` \| `error` |

`.env` is git-ignored. Only `.env.example` (no secrets) is committed.

---

## 3. Run it locally

```bash
cd server
npm install
cp .env.example .env        # add your GEMINI_API_KEY
npm run dev                 # http://localhost:8080
```

Verify it's up:

```bash
curl http://localhost:8080/health
# {"status":"ok","service":"loflan-receptionist",...}
```

## 4. Expose it publicly (so Twilio can reach it)

Twilio needs a public HTTPS URL for the webhook **and** a public WSS URL for
the Media Stream. For local testing, ngrok tunnels both:

```bash
ngrok http 8080
# Forwarding https://abc123.ngrok-free.app -> http://localhost:8080
```

Then set `APP_BASE_URL=https://abc123.ngrok-free.app` in `server/.env` and
restart the server.

> Tip: run `ngrok http 8080` with `--host-header=rewrite` if you hit Host
> header issues.

---

## 5. Configure Twilio (exact steps)

1. In the [Twilio Console](https://console.twilio.com), go to
   **Phone Numbers → Manage → Active numbers** and click your number.
2. Under **Voice & Fax → A CALL COMES IN**, set:
   - **Webhook** (not TwiML Bin)
   - URL: `https://abc123.ngrok-free.app/twilio/incoming`
   - Method: **HTTP POST**
3. Click **Save**.

That's it — the webhook returns TwiML that plays the greeting and opens the
Media Stream to `wss://abc123.ngrok-free.app/media-stream`.

### Optional: status callbacks
Set the **Voice → Status Callback URL** to
`https://abc123.ngrok-free.app/twilio/status` if you want call-event logging.

### Optional: verify webhook signatures
Set `TWILIO_AUTH_TOKEN` and `VERIFY_TWILIO_SIGNATURES=true` in `.env`. The
server then rejects requests without a valid `X-Twilio-Signature`.

---

## 6. Make a test call

1. Make sure the server is running and ngrok is up.
2. From any phone (or the Twilio Console **Debugger / Make a call** button on
   the number page), call your Twilio number.
3. You should hear:
   > "Thanks for calling Lo's Flan! I'm the AI receptionist. How can I help
   > you today?"
4. Ask it things like *"What are your hours?"*, *"Where are you located?"*,
   *"How much is a flan?"* (it now quotes real menu prices), *"I'd like to
   order two chocolate flans for Saturday"*, and *"Are you a robot?"*.

Server logs show the streamed conversation:

```
[call CAxxx] caller: What are your hours?
[call CAxxx] receptionist: We're open Tuesday through Friday...
```

---

## 7. Health check & endpoints

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Health check (uptime monitors, CI smoke test) |
| `POST` | `/twilio/incoming` | Twilio Voice webhook → returns TwiML |
| `POST` | `/twilio/status` | Optional call-status callback |
| `WS` | `/media-stream` | Twilio Media Streams bidirectional audio |
| `GET` | `/api/orders` | Admin — list recorded orders/calls (`X-Admin-Key` header) |
| `POST` | `/api/orders/:id/status` | Admin — set an order's status (`{ status }`) |
| `DELETE` | `/api/orders/:id` | Admin — remove a single record |
| `POST` | `/api/orders/clear` | Admin — wipe all records |

Admin endpoints respond `401` unless the request carries
`X-Admin-Key: <ADMIN_API_KEY>` (or `?adminKey=...`).

Example admin fetch:

```bash
curl http://localhost:8080/api/orders -H 'X-Admin-Key: your-secret'
```

---

## 8. Tests

```bash
cd server
npm test
```

Covers the µ-law/PCM + resampler codec, TwiML generation, the system prompt /
knowledge base, the HTTP routes (incl. fallback when the API key is missing),
and the full WebSocket bridge (caller audio in, AI audio out, interrupts,
buffering, and clean shutdown).

---

## 9. Costs

- **Google Gemini Live API**: free tier includes the Live preview models.
  No billing card needed. Once you outgrow the free tier, Live audio billing
  is token-based and cheap (cents per conversation).
- **Twilio**: the number costs ~$1.15/month; calls are billed per minute
  (roughly $0.003–0.014/min for incoming voice on a US number depending on
  destination). Trial credit covers testing.
- **ngrok**: free tier is fine for testing (random URL, some concurrent
  connection limits).

---

## 10. Architecture

```
server/
├── src/
│   ├── index.js             # entrypoint — HTTP + WebSocket server
│   ├── app.js               # Express app, health check, error handling
│   ├── config.js            # env parsing + validation
│   ├── routes/twilio.js     # /twilio/incoming + /twilio/status webhooks
│   ├── routes/orders.js     # /api/orders (admin)
│   ├── store/orders.js      # order/call store (JSON file persistence)
│   ├── ws/mediaStream.js    # Twilio Media Streams <-> AI bridge + call logging
│   ├── ai/
│   │   ├── index.js         # conversation-session factory (provider switch)
│   │   └── geminiLive.js    # Gemini Live provider (STT + LLM + TTS in one)
│   ├── knowledge/business.js# business facts, menu + phone system prompt
│   └── utils/
│       ├── audio.js         # µ-law <-> PCM, linear resampler
│       ├── twiml.js         # TwiML builders
│       └── logger.js        # leveled logger
├── test/                    # node:test suites
├── .env.example
└── package.json
```

### Order-taking
- **Phone calls**: `ws/mediaStream.js` accumulates the live transcript and
  records each call (number, transcript, order-likelihood) when it ends.
- **Website chat bot**: fully built-in and local — `lib/chatbot.ts` +
  `data/chatbot.ts` in the website package answer questions with intent
  matching. It never talks to this backend and does not record orders here.
- **Dashboard**: the admin panel reads `GET /api/orders` and shows the call
  records (and any chat orders the store may still hold) from this backend.

### Stage 3 notes
- **Live availability**: add function-calling / grounding so the bot and
  receptionist know which flavors are in stock right now.
- **Other AI providers**: implement the same session interface in
  `src/ai/` and switch in `src/ai/index.js`.
