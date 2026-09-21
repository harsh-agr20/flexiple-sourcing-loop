import type { Filters, Profile } from "./types";

const VENDOR_PREFIXES = ["aws", "amazon", "google", "gcp", "microsoft", "azure"];

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

// Strips common cloud-vendor prefixes so e.g. "Amazon RDS" and "AWS RDS" are
// recognized as the same skill even if the LLM didn't use the dataset's
// exact spelling (the prompt asks it to, but this is a cheap safety net).
function coreTokens(s: string): string {
  return normalize(s)
    .split(/\s+/)
    .filter((word) => !VENDOR_PREFIXES.includes(word))
    .join(" ");
}

function profileHasSkill(profile: Profile, skill: string): boolean {
  const target = normalize(skill);
  const targetCore = coreTokens(skill);
  return profile.skills.some((s) => {
    const sn = normalize(s);
    if (sn.includes(target) || target.includes(sn)) return true;
    const sCore = coreTokens(s);
    return sCore.length > 0 && (sCore.includes(targetCore) || targetCore.includes(sCore));
  });
}

function locationMatches(profile: Profile, wanted: string[]): boolean {
  if (wanted.length === 0) return true;
  const loc = normalize(profile.location);
  return wanted.some((w) => {
    const wn = normalize(w);
    if (wn === "remote" || wn.includes("remote")) return loc.includes("remote");
    return loc.includes(wn) || wn.includes(loc);
  });
}

export function applyFilters(profiles: Profile[], filters: Filters): Profile[] {
  return profiles.filter((p) => {
    if (
      filters.required_skills.length > 0 &&
      !filters.required_skills.every((skill) => profileHasSkill(p, skill))
    ) {
      return false;
    }

    if (filters.min_years_experience != null && p.years_experience < filters.min_years_experience) {
      return false;
    }
    if (filters.max_years_experience != null && p.years_experience > filters.max_years_experience) {
      return false;
    }

    if (!locationMatches(p, filters.locations)) {
      return false;
    }

    if (
      filters.company_types.length > 0 &&
      !filters.company_types.includes(p.current_company_type)
    ) {
      return false;
    }

    return true;
  });
}
