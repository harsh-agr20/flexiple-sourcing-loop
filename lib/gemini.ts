import { z } from "zod";

const GEMINI_MODEL = "gemini-3.5-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const TIMEOUT_MS = 45000;

export class LlmError extends Error {
  kind: "rate_limit" | "timeout" | "malformed" | "network" | "unknown";
  constructor(kind: LlmError["kind"], message: string) {
    super(message);
    this.kind = kind;
    this.name = "LlmError";
  }
}

type CallOptions = {
  system: string;
  user: string;
  schema: Record<string, unknown>; // Gemini responseSchema (JSON schema subset)
};

async function callGeminiOnce({ system, user, schema }: CallOptions): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new LlmError("unknown", "GEMINI_API_KEY is not set on the server.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema,
          temperature: 0.4,
        },
      }),
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new LlmError("timeout", "The model took too long to respond.");
    }
    throw new LlmError("network", "Could not reach the LLM API.");
  } finally {
    clearTimeout(timeout);
  }

  if (res.status === 429) {
    throw new LlmError("rate_limit", "Rate limit hit on the LLM API.");
  }
  if (res.status === 503) {
    throw new LlmError("rate_limit", "The LLM service is temporarily overloaded (high demand).");
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new LlmError("unknown", `LLM API error ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new LlmError("malformed", "LLM response had no content.");
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new LlmError("malformed", "LLM response was not valid JSON.");
  }
}

/**
 * Calls Gemini with a JSON schema, validates against the Zod schema, and
 * retries once (with the validation error fed back to the model) on
 * malformed output before giving up.
 */
export async function callGeminiStructured<T>(
  opts: CallOptions,
  zodSchema: z.ZodType<T>
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw =
        attempt === 0
          ? await callGeminiOnce(opts)
          : await callGeminiOnce({
              ...opts,
              user: `${opts.user}\n\nYour previous response failed validation with this error, fix it and return valid JSON only:\n${String(lastError)}`,
            });

      const parsed = zodSchema.safeParse(raw);
      if (parsed.success) return parsed.data;

      lastError = parsed.error.message;
      if (attempt === 1) {
        throw new LlmError("malformed", "LLM output repeatedly failed schema validation.");
      }
    } catch (err) {
      if (err instanceof LlmError && err.kind !== "malformed") {
        throw err; // don't retry rate limits/timeouts/network errors
      }
      lastError = err;
      if (attempt === 1) {
        throw err instanceof LlmError ? err : new LlmError("malformed", String(err));
      }
    }
  }

  throw new LlmError("unknown", "Unreachable");
}
