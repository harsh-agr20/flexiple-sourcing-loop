import { NextResponse } from "next/server";
import { LlmError } from "./gemini";

const MESSAGES: Record<LlmError["kind"], string> = {
  rate_limit: "The LLM is rate-limited right now. Wait a few seconds and try again.",
  timeout: "The LLM took too long to respond. Try again.",
  malformed: "The LLM returned something we couldn't parse, even after a retry. Try again.",
  network: "Couldn't reach the LLM API. Check your connection and try again.",
  unknown: "Something went wrong talking to the LLM.",
};

export function handleLlmError(err: unknown) {
  if (err instanceof LlmError) {
    return NextResponse.json(
      { error: err.kind, message: MESSAGES[err.kind] },
      { status: err.kind === "rate_limit" ? 429 : 502 }
    );
  }
  console.error(err);
  return NextResponse.json(
    { error: "unknown", message: "Unexpected server error." },
    { status: 500 }
  );
}
