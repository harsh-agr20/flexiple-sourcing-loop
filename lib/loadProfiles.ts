import fs from "fs";
import path from "path";
import { ProfileSchema, type Profile } from "./types";

let cached: Profile[] | null = null;

export function loadProfiles(): Profile[] {
  if (cached) return cached;
  const filePath = path.join(process.cwd(), "data", "profiles.json");
  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  cached = raw.map((p: unknown) => ProfileSchema.parse(p));
  return cached!;
}
