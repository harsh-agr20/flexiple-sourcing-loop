"use client";

import { useState } from "react";
import { useSourcingLoop } from "@/lib/useSourcingLoop";
import { generateFilters, runSearch, refineSearch, type ApiError } from "@/lib/api";
import { FiltersRubricPanel } from "@/components/FiltersRubricPanel";
import { ResultCard } from "@/components/ResultCard";
import { ErrorBanner } from "@/components/ErrorBanner";
import { ThinkingIndicator } from "@/components/ThinkingIndicator";

const EXAMPLE_QUERIES = [
  "RDS developers with 4-7 years of experience who have worked at startups, for a role based in Bangalore.",
  "Senior React/Next.js frontend engineers, 5+ years, any location, not from agencies.",
  "Database reliability engineers with Terraform and Postgres experience, enterprise background preferred.",
];

export default function Home() {
  const { state, dispatch } = useSourcingLoop();
  const [query, setQuery] = useState("");
  const [lastFeedbackText, setLastFeedbackText] = useState("");

  function toErrorInfo(err: unknown, retry: "generate" | "search" | "refine"): { kind: string; message: string; retry: typeof retry } {
    const e = err as ApiError;
    return { kind: e?.kind ?? "unknown", message: e?.message ?? "Something went wrong.", retry };
  }

  async function handleGenerate(q: string) {
    if (!q.trim()) return;
    dispatch({ type: "SET_QUERY", query: q });
    dispatch({ type: "GENERATE_START" });
    try {
      const { filters, rubric } = await generateFilters(q);
      dispatch({ type: "GENERATE_OK", filters, rubric });
    } catch (err) {
      dispatch({ type: "ERROR", error: toErrorInfo(err, "generate") });
    }
  }

  async function handleRunSearch(f = state.filters, r = state.rubric) {
    if (!f || !r) return;
    dispatch({ type: "SEARCH_START" });
    try {
      const { results, filteredCount, totalCount } = await runSearch(f, r);
      dispatch({ type: "SEARCH_OK", results, filteredCount, totalCount });
    } catch (err) {
      dispatch({ type: "ERROR", error: toErrorInfo(err, "search") });
    }
  }

  async function handleRefine(feedbackText: string) {
    if (!state.filters || !state.rubric || !feedbackText.trim()) return;
    setLastFeedbackText(feedbackText);
    dispatch({ type: "REFINE_START" });
    try {
      const res = await refineSearch(state.filters, state.rubric, state.results, feedbackText);
      dispatch({ type: "REFINE_OK", ...res });
      await handleRunSearch(res.filters, res.rubric);
    } catch (err) {
      dispatch({ type: "ERROR", error: toErrorInfo(err, "refine") });
    }
  }

  function buildFeedbackText(): string {
    const parts: string[] = [];
    const lines = Object.entries(state.perProfileFeedback).map(([id, verdict]) => {
      const p = state.results.find((r) => r.id === id);
      return `${p?.name ?? id} is ${verdict === "good" ? "a good match" : "not a fit"}`;
    });
    if (lines.length) parts.push(lines.join("; "));
    if (state.chatDraft.trim()) parts.push(state.chatDraft.trim());
    return parts.join(". ");
  }

  function handleRetry() {
    const retry = state.error?.retry;
    dispatch({ type: "DISMISS_ERROR" });
    if (retry === "generate") handleGenerate(state.query || query);
    if (retry === "search") handleRunSearch();
    if (retry === "refine") handleRefine(lastFeedbackText);
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Sourcing Refinement Loop</h1>
          <p className="text-sm text-neutral-500">Describe who you need. Refine by reacting to who you see.</p>
        </div>
        {state.stage !== "landing" && (
          <button
            onClick={() => dispatch({ type: "RESTART" })}
            className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
          >
            Start over
          </button>
        )}
      </header>

      {state.error && (
        <div className="mb-6">
          <ErrorBanner
            message={state.error.message}
            onRetry={state.error.retry ? handleRetry : undefined}
            onDismiss={() => dispatch({ type: "DISMISS_ERROR" })}
          />
        </div>
      )}

      {(state.stage === "landing" || state.stage === "generating") && (
        <section className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
          <label className="mb-2 block text-sm font-medium">What are you looking for?</label>
          <textarea
            className="input min-h-[100px] w-full text-base"
            placeholder="e.g. RDS developers with 4-7 years of experience who have worked at startups, for a role based in Bangalore."
            value={query}
            disabled={state.stage === "generating"}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map((ex) => (
              <button
                key={ex}
                type="button"
                disabled={state.stage === "generating"}
                onClick={() => setQuery(ex)}
                className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-500 hover:border-neutral-400 dark:border-neutral-700"
              >
                {ex.slice(0, 40)}…
              </button>
            ))}
          </div>
          <button
            onClick={() => handleGenerate(query)}
            disabled={state.stage === "generating" || !query.trim()}
            className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {state.stage === "generating" ? "Thinking…" : "Search"}
          </button>
          {state.stage === "generating" && (
            <ThinkingIndicator
              messages={["Reading your request…", "Drafting objective filters…", "Writing the fit rubric…"]}
            />
          )}
        </section>
      )}

      {state.stage === "review" && state.filters && state.rubric && (
        <section>
          <p className="mb-3 text-sm text-neutral-500">
            Search: <span className="font-medium text-neutral-800 dark:text-neutral-200">&ldquo;{state.query}&rdquo;</span>
          </p>
          <FiltersRubricPanel
            filters={state.filters}
            rubric={state.rubric}
            editable
            onFiltersChange={(f) => dispatch({ type: "SET_FILTERS", filters: f })}
            onRubricChange={(r) => dispatch({ type: "SET_RUBRIC", rubric: r })}
          />
          <button
            onClick={() => handleRunSearch()}
            className="mt-5 rounded-xl bg-indigo-600 px-5 py-2.5 font-medium text-white transition hover:bg-indigo-700"
          >
            Run search
          </button>
        </section>
      )}

      {(state.stage === "searching" || state.stage === "results" || state.stage === "refining" || state.stage === "frozen") &&
        state.filters &&
        state.rubric && (
          <section>
            <p className="mb-3 text-sm text-neutral-500">
              Search: <span className="font-medium text-neutral-800 dark:text-neutral-200">&ldquo;{state.query}&rdquo;</span>
              {state.stage === "frozen" && (
                <span className="ml-2 rounded-full bg-neutral-800 px-2 py-0.5 text-[10px] font-semibold uppercase text-white dark:bg-neutral-100 dark:text-neutral-900">
                  Frozen
                </span>
              )}
            </p>

            <FiltersRubricPanel
              filters={state.filters}
              rubric={state.rubric}
              editable={state.stage === "results"}
              onFiltersChange={(f) => dispatch({ type: "SET_FILTERS", filters: f })}
              onRubricChange={(r) => dispatch({ type: "SET_RUBRIC", rubric: r })}
            />

            {state.stage === "results" && (
              <button
                onClick={() => handleRunSearch()}
                className="mt-3 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-400"
              >
                Re-run search with these filters
              </button>
            )}

            <div className="mt-6">
              {state.stage === "searching" && (
                <ThinkingIndicator messages={["Filtering the talent pool…", "Scoring profiles against the rubric…"]} />
              )}
              {state.stage === "refining" && (
                <ThinkingIndicator messages={["Reading your feedback…", "Adjusting filters and rubric…", "Re-running the search…"]} />
              )}

              {(state.stage === "results" || state.stage === "frozen") && (
                <>
                  {state.filteredCount === 0 ? (
                    <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
                      <p className="font-medium">No profiles matched these filters.</p>
                      <p className="mt-1 text-sm text-neutral-500">
                        Out of {state.totalCount} profiles in the pool, none passed the current objective filters.
                      </p>
                      {state.stage === "results" && (
                        <button
                          onClick={() => handleRefine("No profiles matched the current filters. Please loosen them so we get some results.")}
                          className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                          Ask AI to loosen the filters
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <p className="mb-3 text-xs text-neutral-500">
                        Showing top {state.results.length} of {state.filteredCount} profiles that passed the filters
                        (out of {state.totalCount} total).
                      </p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {state.results.map((p) => (
                          <ResultCard
                            key={p.id}
                            profile={p}
                            feedback={state.perProfileFeedback[p.id]}
                            disabled={state.stage === "frozen"}
                            onFeedback={(v) => dispatch({ type: "TOGGLE_PROFILE_FEEDBACK", id: p.id, verdict: v })}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            {state.stage === "results" && state.filteredCount > 0 && (
              <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <label className="mb-1 block text-xs font-medium text-neutral-500">
                  Tell the AI what to change (or mark profiles above, then send)
                </label>
                <div className="flex gap-2">
                  <input
                    className="input flex-1"
                    placeholder='e.g. "1 is too junior, 2 and 4 are right"'
                    value={state.chatDraft}
                    onChange={(e) => dispatch({ type: "SET_CHAT_DRAFT", text: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRefine(buildFeedbackText());
                    }}
                  />
                  <button
                    onClick={() => handleRefine(buildFeedbackText())}
                    disabled={!state.chatDraft.trim() && Object.keys(state.perProfileFeedback).length === 0}
                    className="rounded-xl bg-neutral-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-neutral-100 dark:text-neutral-900"
                  >
                    Refine
                  </button>
                </div>
              </div>
            )}

            {state.changeLog.length > 0 && (
              <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm dark:border-neutral-800 dark:bg-neutral-900/50">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  What changed
                </h4>
                <ul className="list-inside list-disc space-y-1 text-neutral-600 dark:text-neutral-400">
                  {state.changeLog.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {state.stage === "results" && state.filteredCount > 0 && (
              <button
                onClick={() => dispatch({ type: "FREEZE" })}
                className="mt-6 rounded-xl border border-neutral-800 px-5 py-2.5 font-medium text-neutral-800 transition hover:bg-neutral-800 hover:text-white dark:border-neutral-200 dark:text-neutral-200 dark:hover:bg-neutral-200 dark:hover:text-neutral-900"
              >
                Freeze search
              </button>
            )}

            {state.stage === "frozen" && (
              <p className="mt-6 text-sm text-neutral-500">
                This search is frozen. These are the final filters, rubric, and shortlist.
              </p>
            )}
          </section>
        )}
    </main>
  );
}
