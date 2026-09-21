import { z } from "zod";

export const ProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  current_title: z.string(),
  years_experience: z.number(),
  location: z.string(),
  current_company: z.string(),
  current_company_type: z.enum(["startup", "scaleup", "enterprise", "agency"]),
  skills: z.array(z.string()),
  past_companies: z.array(
    z.object({
      company: z.string(),
      company_type: z.enum(["startup", "scaleup", "enterprise", "agency"]),
      title: z.string(),
      years: z.number(),
    })
  ),
  education: z.string(),
  summary: z.string(),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const FiltersSchema = z.object({
  required_skills: z.array(z.string()),
  nice_to_have_skills: z.array(z.string()),
  min_years_experience: z.number().nullable(),
  max_years_experience: z.number().nullable(),
  locations: z.array(z.string()),
  company_types: z.array(z.enum(["startup", "scaleup", "enterprise", "agency"])),
  summary: z.string(),
});
export type Filters = z.infer<typeof FiltersSchema>;

export const RubricCriterionSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  weight: z.number().min(1).max(10),
});

export const RubricSchema = z.object({
  criteria: z.array(RubricCriterionSchema).min(1),
});
export type Rubric = z.infer<typeof RubricSchema>;
export type RubricCriterion = z.infer<typeof RubricCriterionSchema>;

export const GenerateFiltersResponseSchema = z.object({
  filters: FiltersSchema,
  rubric: RubricSchema,
});
export type GenerateFiltersResponse = z.infer<typeof GenerateFiltersResponseSchema>;

export const ScoredProfileSchema = z.object({
  id: z.string(),
  score: z.number().min(0).max(100),
  verdict: z.enum(["strong", "possible", "weak"]),
  explanation: z.string(),
});
export type ScoredProfile = z.infer<typeof ScoredProfileSchema>;

export const ScoreProfilesResponseSchema = z.object({
  scored: z.array(ScoredProfileSchema),
});
export type ScoreProfilesResponse = z.infer<typeof ScoreProfilesResponseSchema>;

export const RefineResponseSchema = z.object({
  filters: FiltersSchema,
  rubric: RubricSchema,
  changeSummary: z.array(z.string()),
});
export type RefineResponse = z.infer<typeof RefineResponseSchema>;

export type ProfileFeedback = {
  id: string;
  verdict: "good" | "bad";
};

export type RankedProfile = Profile & ScoredProfile;
