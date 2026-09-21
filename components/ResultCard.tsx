"use client";

import type { RankedProfile } from "@/lib/types";

const VERDICT_STYLE: Record<string, string> = {
  strong: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  possible: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  weak: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
};

export function ResultCard({
  profile,
  feedback,
  onFeedback,
  disabled,
}: {
  profile: RankedProfile;
  feedback: "good" | "bad" | undefined;
  onFeedback: (verdict: "good" | "bad") => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 transition ${
        feedback === "good"
          ? "border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20"
          : feedback === "bad"
            ? "border-rose-300 bg-rose-50/40 dark:bg-rose-950/20"
            : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold">{profile.name}</h4>
          <p className="text-sm text-neutral-500">
            {profile.current_title} · {profile.current_company} ({profile.current_company_type}) ·{" "}
            {profile.years_experience} yrs · {profile.location}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-lg font-bold tabular-nums">{profile.score}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${VERDICT_STYLE[profile.verdict] ?? ""}`}>
            {profile.verdict}
          </span>
        </div>
      </div>

      <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">{profile.explanation}</p>

      <div className="mt-2 flex flex-wrap gap-1">
        {profile.skills.slice(0, 6).map((s) => (
          <span
            key={s}
            className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
          >
            {s}
          </span>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onFeedback("good")}
          className={`rounded-lg border px-3 py-1 text-xs font-medium transition disabled:opacity-40 ${
            feedback === "good"
              ? "border-emerald-500 bg-emerald-500 text-white"
              : "border-neutral-300 hover:border-emerald-400 dark:border-neutral-700"
          }`}
        >
          Good match
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onFeedback("bad")}
          className={`rounded-lg border px-3 py-1 text-xs font-medium transition disabled:opacity-40 ${
            feedback === "bad"
              ? "border-rose-500 bg-rose-500 text-white"
              : "border-neutral-300 hover:border-rose-400 dark:border-neutral-700"
          }`}
        >
          Not a fit
        </button>
      </div>
    </div>
  );
}
