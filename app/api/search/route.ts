import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { callGeminiStructured } from "@/lib/gemini";
import { scoreProfilesSchemaObj } from "@/lib/geminiSchemas";
import { FiltersSchema, RubricSchema, ScoreProfilesResponseSchema, type RankedProfile } from "@/lib/types";
import { handleLlmError } from "@/lib/errorResponse";
import { loadProfiles } from "@/lib/loadProfiles";
import { applyFilters } from "@/lib/filterProfiles";
import { SCORE_PROFILES_SYSTEM_PROMPT, buildScoreProfilesUserPrompt } from "@/lib/prompts/scoreProfiles";

const BodySchema = z.object({
  filters: FiltersSchema,
  rubric: RubricSchema,
});

const MAX_TO_SCORE = 18;
const TOP_N = 5;

export async function POST(req: NextRequest) {
  let body;
  try {
    body = BodySchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "bad_request", message: "Filters or rubric were malformed." },
      { status: 400 }
    );
  }

  const allProfiles = loadProfiles();
  const filtered = applyFilters(allProfiles, body.filters);

  if (filtered.length === 0) {
    return NextResponse.json({
      results: [],
      filteredCount: 0,
      totalCount: allProfiles.length,
    });
  }

  const toScore = filtered.slice(0, MAX_TO_SCORE);

  try {
    const { scored } = await callGeminiStructured(
      {
        system: SCORE_PROFILES_SYSTEM_PROMPT,
        user: buildScoreProfilesUserPrompt(
          JSON.stringify(body.rubric, null, 2),
          JSON.stringify(toScore, null, 2)
        ),
        schema: scoreProfilesSchemaObj,
      },
      ScoreProfilesResponseSchema
    );

    const scoreById = new Map(scored.map((s) => [s.id, s]));
    const ranked: RankedProfile[] = toScore
      .map((p) => {
        const s = scoreById.get(p.id);
        if (!s) return null;
        return { ...p, ...s };
      })
      .filter((p): p is RankedProfile => p !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_N);

    return NextResponse.json({
      results: ranked,
      filteredCount: filtered.length,
      totalCount: allProfiles.length,
    });
  } catch (err) {
    return handleLlmError(err);
  }
}
