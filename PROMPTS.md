# LLM prompts

All prompts used by the app live in [`lib/prompts/`](lib/prompts/) as plain exported strings — this file is a
reading guide, not a duplicate copy, so it can't drift out of sync with the code.

There are three server-side Gemini calls, each with its own system prompt and its own JSON schema
(`lib/geminiSchemas.ts`, mirrored by the Zod schemas in `lib/types.ts` that validate the response
before anything touches the UI).

## 1. Free text → filters + rubric
**File:** [`lib/prompts/generateFilters.ts`](lib/prompts/generateFilters.ts)
**Called from:** `POST /api/generate-filters`

Turns the recruiter's one-sentence ask into structured objective filters (required vs.
nice-to-have skills, years of experience, locations, company types) and a subjective fit rubric
(3-5 weighted criteria). Told explicitly not to invent constraints the recruiter didn't imply, and
not to just restate the filters as rubric criteria.

## 2. Score + rank filtered profiles
**File:** [`lib/prompts/scoreProfiles.ts`](lib/prompts/scoreProfiles.ts)
**Called from:** `POST /api/search`

Takes the rubric and the profiles that already passed the mechanical filters, and returns a
0-100 score, a verdict (strong/possible/weak), and an explanation per profile. The prompt
explicitly requires the explanation to cite real fields from that profile (title, company, years,
specific skills) and to be honest about weaknesses rather than only listing positives — this is
what the assignment calls out as the trust-building part of the UI.

## 3. Refine from recruiter feedback
**File:** [`lib/prompts/refine.ts`](lib/prompts/refine.ts)
**Called from:** `POST /api/refine`

Takes the current filters/rubric, the profiles just shown (with their scores/explanations), and
the recruiter's feedback (free text and/or per-profile good/bad reactions), and returns updated
filters + rubric + a `changeSummary` array of short bullet points naming exactly what changed and
why. The prompt is deliberately conservative: "only change what the feedback actually justifies" —
this is what stops one round of feedback from silently rewriting unrelated parts of the search,
which would break the recruiter's trust in the loop.

After this call returns, the client automatically re-runs `/api/search` with the new
filters/rubric (prompt #2 above) so refinement always ends on updated results, not just updated
criteria.
