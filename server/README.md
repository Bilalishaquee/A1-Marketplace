# A-1 Renovations — Phase 2: AI Engine & Estimation Logic

Backend for the AI quoting pipeline. Implements the design in
[`../docs/Phase2_AI_Engine_TDD.md`](../docs/Phase2_AI_Engine_TDD.md):
photos → surface/material + damage detection → tiered measurement → deterministic
itemized cost estimate (range + confidence) → grounded LLM Q&A → self-learning
data capture.

## Why it runs with zero setup

Per the TDD's locked decisions, every external dependency degrades to a safe default:

| Concern | Default (runs now) | Production |
|---------|--------------------|-----------|
| Model provider | `mock` adapter — deterministic, no API key (TDD §0.1 A3) | `claude` (set `MODEL_PROVIDER=claude` + `ANTHROPIC_API_KEY`) |
| Image rendering | `mock` renderer — SVG placeholder, no API key | `gemini` — Gemini 2.5 Flash Image / "Nano Banana" (set `GEMINI_API_KEY`) |
| Storage | in-memory repo (TDD §6.4) | Postgres via Prisma (`prisma/schema.prisma`) |
| Object store | stubbed presigned URLs | S3 direct-to-bucket |
| Job queue | in-process async runner | BullMQ on Redis |
| HTTP latency | async + SSE streaming (TDD §1.3) | same |

No Postgres, no Redis, no S3, no API key needed to demo the full flow.

## Run

```bash
cd server
npm install            # express + zod (engines/tests need NOTHING)
npm test               # 14 unit tests — cost + measurement + orchestrator
npm run dev            # http://localhost:4000  (Node 22.6+ native TS)
```

Requires **Node ≥ 22.6** (uses `--experimental-strip-types`; no build step).

## End-to-end demo

```bash
# 1. create a draft + get presigned upload URLs
curl -sX POST localhost:4000/v1/quotes -H 'content-type: application/json' \
  -d '{"serviceType":"kitchen_remodel","regionZip":"90001","imageCount":2}'

# 2. confirm uploaded images (runs the quality gate)
curl -sX POST localhost:4000/v1/quotes/<ID>/images/confirm -H 'content-type: application/json' \
  -d '{"images":[{"s3Key":"a.jpg","byteSize":50000,"width":1200,"height":900,"blurScore":120,"brightness":130}]}'

# 3. enqueue estimation (returns 202)
curl -sX POST localhost:4000/v1/quotes/<ID>/estimate

# 4. watch staged progress (SSE) — mirrors the QuoteUpload UI stages
curl -N localhost:4000/v1/quotes/<ID>/events

# 5. fetch the finished, itemized quote
curl -s localhost:4000/v1/quotes/<ID>
```

## API surface (TDD §7)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/v1/quotes` | create draft + presigned upload URLs |
| POST | `/v1/quotes/:id/images/confirm` | register uploads + quality gate |
| POST | `/v1/quotes/:id/estimate` | enqueue async estimation (202) |
| GET | `/v1/quotes/:id/events` | SSE progress stream |
| GET | `/v1/quotes/:id` | full quote (client-shaped, dollars) |
| POST | `/v1/quotes/:id/qa` | grounded LLM follow-up Q&A |
| POST | `/v1/quotes/:id/renderings` | generate / regenerate an "after renovation" preview (`{ style }`: modern·classic·minimalist·luxury) |
| PATCH | `/v1/quotes/:id/line-items/:index` | PM edit (captured as training signal) |
| POST | `/v1/quotes/:id/decision` | approve / decline / request_edit |
| POST | `/v1/quotes/:id/outcome` | record real job actuals (self-learning) |
| GET | `/v1/admin/pricing` · `/service-templates` · `/calibration/preview` | pricing + calibration preview |

## Front-end integration (handed to Phase 3)

`GET /v1/quotes/:id` returns `estimate.lineItems` already in the
`{ category, item, cost, hrs }` shape that `web-app/.../QuoteResult.jsx` renders,
plus `total`, `totalLow/High`, `confidence`, `rationale`, and `framing`. The SSE
stages (`analyzing_surfaces → detecting_damage → measuring → costing → done`) map
1:1 to the simulated steps in `QuoteUpload.jsx`. Wiring the React app to these
endpoints (replacing the `setInterval` simulation) is **Phase 3 — Client App**.

## Layout

```
src/
  server.ts            HTTP entry (Express + SSE), dependency wiring
  config.ts            env-driven config, safe defaults
  types.ts             domain types + SCHEMA_VERSION
  ai/                  provider-agnostic model adapter (mock | claude) + factory
                       + image renderer (mock | gemini) — "after renovation" preview
  engines/
    measurement.ts     tiered measurement (TDD §4) — pure, tested
    cost.ts            deterministic cost engine (TDD §5) — pure, tested
  data/
    pricing.ts         versioned pricing catalog (PLACEHOLDER — needs A-1 data)
    serviceTemplates.ts scope-of-work templates per service
  pipeline/
    imagePipeline.ts   quality gate (TDD §3.1)
    orchestrator.ts    CV → measurement → cost, emits SSE stages
    render.ts          "after renovation" image generation (grounded in the quote)
  store/               repo interfaces + in-memory impls
  routes/              quotes + admin
prisma/schema.prisma   production Postgres schema (TDD §6)
test/                  cost / measurement / orchestrator
```

## ⚠️ Blocking dependency (TDD §0.1 A9, §10.3)

`src/data/pricing.ts` holds **placeholder** market rates. Before any quote is shown
to a real customer, replace them with A-1's actual supplier prices, labor rates,
and regional adjustments, and supply ~30–50 historical job invoices/photos to seed
the eval golden set. Accuracy cannot be validated without this.
