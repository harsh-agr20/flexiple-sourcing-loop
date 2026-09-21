import type { Filters, Rubric, RankedProfile } from "./types";

export type ApiError = { kind: string; message: string };

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    const err: ApiError = { kind: data.error ?? "unknown", message: data.message ?? "Something went wrong." };
    throw err;
  }
  return data as T;
}

export function generateFilters(query: string) {
  return post<{ filters: Filters; rubric: Rubric }>("/api/generate-filters", { query });
}

export function runSearch(filters: Filters, rubric: Rubric) {
  return post<{ results: RankedProfile[]; filteredCount: number; totalCount: number }>(
    "/api/search",
    { filters, rubric }
  );
}

export function refineSearch(
  filters: Filters,
  rubric: Rubric,
  shownProfiles: RankedProfile[],
  feedbackText: string
) {
  return post<{ filters: Filters; rubric: Rubric; changeSummary: string[] }>("/api/refine", {
    filters,
    rubric,
    shownProfiles,
    feedbackText,
  });
}
