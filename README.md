# Sourcing Refinement Loop

A small full-stack app implementing the Flexiple sourcing refinement loop end to end: free text →
LLM-generated filters + rubric → local filtering over `data/profiles.json` → LLM scoring/ranking →
chat/per-profile refinement → freeze.

## Setup

Requires Node.js 20+.

```bash
npm install
cp .env.local.example .env.local   # then paste your key into .env.local
npm run dev
```

Open http://localhost:3000.

**API key environment variable:** `GEMINI_API_KEY`. Get a free key at
https://aistudio.google.com/apikey. The server reads it from the environment only — it is never
sent to the client and must never be committed (`.env.local` is gitignored).

Model used: `gemini-2.0-flash` via the REST API, with `responseMimeType: application/json` and a
`responseSchema` for structured output (see `lib/gemini.ts`).

## How it works

- **`/api/generate-filters`** — one LLM call turns the free-text query into structured filters
  (required/nice-to-have skills, years, locations, company types) and a weighted fit rubric.
- **`/api/search`** — applies the filters locally to the 48-profile dataset (`lib/filterProfiles.ts`,
  no LLM involved), then one LLM call scores/ranks the filtered profiles against the rubric and
  returns the top 5 with per-profile explanations grounded in real fields.
- **`/api/refine`** — takes the recruiter's feedback (free text and/or per-profile good/bad
  reactions) plus the profiles just shown, and returns updated filters/rubric and a plain-language
  `changeSummary` of what changed and why. The client then automatically re-runs `/api/search`
  with the new filters/rubric.
- All state (query, filters, rubric, results, feedback, change log) lives in a single client-side
  reducer (`lib/useSourcingLoop.ts`) — nothing is persisted server-side or across sessions, per the
  assignment's ground rules.

Prompts are documented in [`PROMPTS.md`](PROMPTS.md) and live as plain strings in `lib/prompts/`.

## Error handling

Every LLM call goes through `lib/gemini.ts`, which:
- Enforces a 25s timeout via `AbortController`.
- Retries once, automatically, if the model's JSON fails Zod validation — the validation error is
  fed back to the model on the retry.
- Surfaces rate limits (HTTP 429), timeouts, network failures, and repeated malformed output as
  distinct, typed errors rather than crashing.
- The frontend shows a dismissible error banner with a **Retry** button that replays the exact
  failed action (generate / search / refine) — nothing is lost.

The empty-results state (filters matched zero profiles) is designed explicitly, with a one-click
"ask AI to loosen the filters" action that feeds that fact back into the refine prompt.

## Decisions: what I prioritised, what I cut, why

**Prioritised:**
- Getting the full loop working end-to-end with *real* LLM calls at every step (generate, score,
  refine) over polishing any single step, since the assignment explicitly weighs "does the loop
  work end to end" highest.
- Grounded, specific explanations (citing real skills/companies/years) over generic-sounding
  copy, since the assignment calls this out by name as something they check.
- Designed loading/empty/error states over extra features, per the assignment's own framing of
  "quality over quantity."
- A single reducer driving one page over a multi-page/router setup — this is a single session, one
  linear flow, so client-side routing would add indirection with no benefit.

**Cut, deliberately:**
- No streaming of LLM responses — structured JSON output doesn't stream cleanly, and a short
  "thinking" indicator gets the same perceived-latency benefit for far less complexity.
- No persistence/history of past searches — explicitly out of scope per the assignment.
- Filters are a fixed, intentionally small schema (skills/years/location/company type) rather than
  an open-ended query DSL — matches what the assignment's example filters need and keeps the local
  filter logic auditable in a few lines instead of a mini query engine.
- Rubric editing is inline text/number fields, not a drag-to-reorder or add/remove-criterion UI —
  recruiters can rewrite labels/descriptions/weights, which covers the "edit directly" requirement
  without spending the timebox on list-management UI.
- No automated tests — given the 2.5h build window, manual verification of the real LLM loop (the
  thing actually being evaluated) was a better use of time than test scaffolding for a
  single-session prototype.

## Known limitations

- The Gemini free tier has fairly aggressive per-minute rate limits; rapid consecutive refine
  rounds may hit them (handled — see Error handling above — but worth knowing while demoing).
- `MAX_TO_SCORE` in `app/api/search/route.ts` caps profiles sent to the scoring call at 30 to keep
  latency/token usage bounded; irrelevant here since the whole pool is 48 profiles, but noted for
  anyone scaling the dataset up.
