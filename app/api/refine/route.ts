import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { callGeminiStructured } from "@/lib/gemini";
import { refineSchemaObj } from "@/lib/geminiSchemas";
import { FiltersSchema, RubricSchema, RefineResponseSchema } from "@/lib/types";
import { handleLlmError } from "@/lib/errorResponse";
import { REFINE_SYSTEM_PROMPT, buildRefineUserPrompt } from "@/lib/prompts/refine";

const ShownProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  current_title: z.string(),
  years_experience: z.number(),
  location: z.string(),
  current_company: z.string(),
  current_company_type: z.string(),
  skills: z.array(z.string()),
  score: z.number(),
  verdict: z.string(),
  explanation: z.string(),
});

const BodySchema = z.object({
  filters: FiltersSchema,
  rubric: RubricSchema,
  shownProfiles: z.array(ShownProfileSchema),
  feedbackText: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  let body;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "bad_request", message: "Refinement request was malformed." },
      { status: 400 }
    );
  }

  try {
    const result = await callGeminiStructured(
      {
        system: REFINE_SYSTEM_PROMPT,
        user: buildRefineUserPrompt(
          JSON.stringify(body.filters, null, 2),
          JSON.stringify(body.rubric, null, 2),
          JSON.stringify(body.shownProfiles, null, 2),
          body.feedbackText
        ),
        schema: refineSchemaObj,
      },
      RefineResponseSchema
    );
    return NextResponse.json(result);
  } catch (err) {
    return handleLlmError(err);
  }
}
