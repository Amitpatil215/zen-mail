function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function setPath(obj: Record<string, unknown>, path: string, value: unknown) {
  const parts = path.split(".").filter(Boolean);
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < parts.length; i++) {
    const key = parts[i]!;
    const isLast = i === parts.length - 1;
    if (isLast) {
      if (!(key in cur)) cur[key] = value;
      return;
    }
    const next = cur[key];
    if (!isPlainObject(next)) cur[key] = {};
    cur = cur[key] as Record<string, unknown>;
  }
}

function deepMergePreferRight(
  left: Record<string, unknown>,
  right: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...left };
  for (const [k, rv] of Object.entries(right)) {
    const lv = out[k];
    if (isPlainObject(lv) && isPlainObject(rv)) out[k] = deepMergePreferRight(lv, rv);
    else out[k] = rv;
  }
  return out;
}

export function buildSampleDataForRequiredVars(requiredVars: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const v of requiredVars) setPath(out, v, "REPLACE_ME");
  return out;
}

export function populateSampleDataJson(params: {
  requiredVars: string[];
  existingData: unknown;
}): Record<string, unknown> {
  const base = buildSampleDataForRequiredVars(params.requiredVars);
  const existing = isPlainObject(params.existingData) ? params.existingData : {};
  return deepMergePreferRight(base, existing);
}

