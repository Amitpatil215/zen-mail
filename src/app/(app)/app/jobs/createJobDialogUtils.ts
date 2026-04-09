"use client";

export function parseJsonObject(
  text: string
):
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; error: string } {
  try {
    const v = JSON.parse(text);
    if (!v || typeof v !== "object" || Array.isArray(v)) {
      return { ok: false, error: "Variables must be a JSON object." };
    }
    return { ok: true, value: v as Record<string, unknown> };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Invalid JSON." };
  }
}

