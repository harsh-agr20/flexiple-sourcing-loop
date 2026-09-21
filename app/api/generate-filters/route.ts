import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { callGeminiStructured } from "@/lib/gemini";
import { generateFiltersSchemaObj } from "@/lib/geminiSchemas";
import { GenerateFiltersResponseSchema } from "@/lib/types";
import { handleLlmError } from "@/lib/errorResponse";
import {
  buildGenerateFiltersSystemPrompt,
  buildGenerateFiltersUserPrompt,
} from "@/lib/prompts/generateFilters";
import { loadProfiles } from "@/lib/loadProfiles";

const BodySchema = z.object({ query: z.string().min(3).max(1000) });

export async function POST(req: NextRequest) {
  let body;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "bad_request", message: "Please enter a search description." },
      { status: 400 }
    );
  }

  const knownSkills = Array.from(new Set(loadProfiles().flatMap((p) => p.skills))).sort();

  try {
    const result = await callGeminiStructured(
      {
        system: buildGenerateFiltersSystemPrompt(knownSkills),
        user: buildGenerateFiltersUserPrompt(body.query),
        schema: generateFiltersSchemaObj,
      },
      GenerateFiltersResponseSchema
    );
    return NextResponse.json(result);
  } catch (err) {
    return handleLlmError(err);
  }
}
