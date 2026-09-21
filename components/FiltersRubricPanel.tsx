"use client";

import type { Filters, Rubric } from "@/lib/types";

const COMPANY_TYPES = ["startup", "scaleup", "enterprise", "agency"] as const;

function parseList(text: string): string[] {
  return text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function FiltersRubricPanel({
  filters,
  rubric,
  editable,
  onFiltersChange,
  onRubricChange,
}: {
  filters: Filters;
  rubric: Rubric;
  editable: boolean;
  onFiltersChange?: (f: Filters) => void;
  onRubricChange?: (r: Rubric) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <section className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Objective filters
        </h3>
        {filters.summary && (
          <p className="mb-3 text-sm text-neutral-600 dark:text-neutral-400">{filters.summary}</p>
        )}

        <Field label="Required skills">
          {editable ? (
            <input
              className="input"
              defaultValue={filters.required_skills.join(", ")}
              placeholder="e.g. AWS RDS, PostgreSQL"
              onBlur={(e) =>
                onFiltersChange?.({ ...filters, required_skills: parseList(e.target.value) })
              }
            />
          ) : (
            <TagRow items={filters.required_skills} empty="Any" />
          )}
        </Field>

        <Field label="Nice-to-have skills">
          {editable ? (
            <input
              className="input"
              defaultValue={filters.nice_to_have_skills.join(", ")}
              onBlur={(e) =>
                onFiltersChange?.({ ...filters, nice_to_have_skills: parseList(e.target.value) })
              }
            />
          ) : (
            <TagRow items={filters.nice_to_have_skills} empty="None" />
          )}
        </Field>

        <Field label="Years of experience">
          {editable ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="input w-20"
                defaultValue={filters.min_years_experience ?? ""}
                placeholder="min"
                onBlur={(e) =>
                  onFiltersChange?.({
                    ...filters,
                    min_years_experience: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
              <span className="text-neutral-400">to</span>
              <input
                type="number"
                className="input w-20"
                defaultValue={filters.max_years_experience ?? ""}
                placeholder="max"
                onBlur={(e) =>
                  onFiltersChange?.({
                    ...filters,
                    max_years_experience: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
            </div>
          ) : (
            <span className="text-sm">
              {filters.min_years_experience ?? "any"} – {filters.max_years_experience ?? "any"} yrs
            </span>
          )}
        </Field>

        <Field label="Locations">
          {editable ? (
            <input
              className="input"
              defaultValue={filters.locations.join(", ")}
              placeholder="e.g. Bangalore"
              onBlur={(e) => onFiltersChange?.({ ...filters, locations: parseList(e.target.value) })}
            />
          ) : (
            <TagRow items={filters.locations} empty="Any" />
          )}
        </Field>

        <Field label="Company type">
          {editable ? (
            <div className="flex flex-wrap gap-2">
              {COMPANY_TYPES.map((ct) => {
                const active = filters.company_types.includes(ct);
                return (
                  <button
                    key={ct}
                    type="button"
                    onClick={() =>
                      onFiltersChange?.({
                        ...filters,
                        company_types: active
                          ? filters.company_types.filter((c) => c !== ct)
                          : [...filters.company_types, ct],
                      })
                    }
                    className={`rounded-full border px-3 py-1 text-xs capitalize transition ${
                      active
                        ? "border-indigo-500 bg-indigo-500 text-white"
                        : "border-neutral-300 text-neutral-600 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-400"
                    }`}
                  >
                    {ct}
                  </button>
                );
              })}
            </div>
          ) : (
            <TagRow items={filters.company_types} empty="Any" />
          )}
        </Field>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Fit rubric
        </h3>
        <ul className="space-y-3">
          {rubric.criteria.map((c, idx) => (
            <li key={c.id} className="rounded-lg border border-neutral-100 p-2 dark:border-neutral-800">
              <div className="flex items-center justify-between gap-2">
                {editable ? (
                  <input
                    className="input flex-1 font-medium"
                    defaultValue={c.label}
                    onBlur={(e) => {
                      const next = [...rubric.criteria];
                      next[idx] = { ...c, label: e.target.value };
                      onRubricChange?.({ criteria: next });
                    }}
                  />
                ) : (
                  <span className="font-medium">{c.label}</span>
                )}
                {editable ? (
                  <input
                    type="number"
                    min={1}
                    max={10}
                    className="input w-16 text-center"
                    defaultValue={c.weight}
                    onBlur={(e) => {
                      const next = [...rubric.criteria];
                      next[idx] = { ...c, weight: Number(e.target.value) };
                      onRubricChange?.({ criteria: next });
                    }}
                  />
                ) : (
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                    weight {c.weight}
                  </span>
                )}
              </div>
              {editable ? (
                <textarea
                  className="input mt-1 w-full text-xs"
                  rows={2}
                  defaultValue={c.description}
                  onBlur={(e) => {
                    const next = [...rubric.criteria];
                    next[idx] = { ...c, description: e.target.value };
                    onRubricChange?.({ criteria: next });
                  }}
                />
              ) : (
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{c.description}</p>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="mb-1 block text-xs font-medium text-neutral-500">{label}</label>
      {children}
    </div>
  );
}

function TagRow({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) {
    return <span className="text-sm text-neutral-400">{empty}</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
        >
          {item}
        </span>
      ))}
    </div>
  );
}
