// Gemini's responseSchema is a constrained JSON-schema subset (no $ref, no additionalProperties).
// These mirror the Zod schemas in ./types.ts and must be kept in sync with them by hand.

const COMPANY_TYPE_ENUM = ["startup", "scaleup", "enterprise", "agency"];

export const filtersSchemaObj = {
  type: "object",
  properties: {
    required_skills: { type: "array", items: { type: "string" } },
    nice_to_have_skills: { type: "array", items: { type: "string" } },
    min_years_experience: { type: "number", nullable: true },
    max_years_experience: { type: "number", nullable: true },
    locations: { type: "array", items: { type: "string" } },
    company_types: { type: "array", items: { type: "string", enum: COMPANY_TYPE_ENUM } },
    summary: { type: "string" },
  },
  required: [
    "required_skills",
    "nice_to_have_skills",
    "min_years_experience",
    "max_years_experience",
    "locations",
    "company_types",
    "summary",
  ],
};

export const rubricSchemaObj = {
  type: "object",
  properties: {
    criteria: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          description: { type: "string" },
          weight: { type: "number" },
        },
        required: ["id", "label", "description", "weight"],
      },
    },
  },
  required: ["criteria"],
};

export const generateFiltersSchemaObj = {
  type: "object",
  properties: {
    filters: filtersSchemaObj,
    rubric: rubricSchemaObj,
  },
  required: ["filters", "rubric"],
};

export const scoreProfilesSchemaObj = {
  type: "object",
  properties: {
    scored: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          score: { type: "number" },
          verdict: { type: "string", enum: ["strong", "possible", "weak"] },
          explanation: { type: "string" },
        },
        required: ["id", "score", "verdict", "explanation"],
      },
    },
  },
  required: ["scored"],
};

export const refineSchemaObj = {
  type: "object",
  properties: {
    filters: filtersSchemaObj,
    rubric: rubricSchemaObj,
    changeSummary: { type: "array", items: { type: "string" } },
  },
  required: ["filters", "rubric", "changeSummary"],
};
