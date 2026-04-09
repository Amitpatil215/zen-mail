const VAR_RE = /\{\{\s*([\s\S]*?)\s*\}\}|\{%\s*([\s\S]*?)\s*%\}/g;

const KEYWORD_SET = new Set([
  "if",
  "elsif",
  "else",
  "endif",
  "for",
  "endfor",
  "in",
  "break",
  "continue",
  "assign",
  "capture",
  "endcapture",
  "case",
  "when",
  "endcase",
  "unless",
  "endunless",
  "render",
  "include",
  "comment",
  "endcomment",
  "raw",
  "endraw",
  "true",
  "false",
  "nil",
  "null",
  "blank",
  "empty",
  "contains",
  "and",
  "or",
  "not",
]);

function normalizeVarToken(token: string): string | null {
  const t = token.trim();
  if (!t) return null;
  if (t.startsWith("'") || t.startsWith('"')) return null;
  if (/^-?\d+(\.\d+)?$/.test(t)) return null;
  if (t.startsWith(".") || t.includes("..")) return null;
  if (!/^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*$/.test(t)) return null;
  if (KEYWORD_SET.has(t)) return null;
  if (t === "forloop") return null;
  return t;
}

function extractFromLiquidExpression(expr: string): string[] {
  // Split filters `a | upcase | default: 'x'` → keep left side + filter args.
  const parts = expr.split("|").map((p) => p.trim());
  const out: string[] = [];

  // Left side: `person.first_name` or `person["x"]` (we ignore bracket access for MVP)
  const left = parts[0] ?? "";
  for (const tok of left.split(/[^A-Za-z0-9_.]+/g)) {
    const v = normalizeVarToken(tok);
    if (v) out.push(v);
  }

  // Filter args: `default: person.last_name` etc.
  for (const p of parts.slice(1)) {
    const argPart = p.includes(":") ? p.split(":").slice(1).join(":") : "";
    for (const tok of argPart.split(/[^A-Za-z0-9_.]+/g)) {
      const v = normalizeVarToken(tok);
      if (v) out.push(v);
    }
  }
  return out;
}

export function listLiquidVariables(template: string): string[] {
  const vars = new Set<string>();
  for (const match of template.matchAll(VAR_RE)) {
    const inner = (match[1] ?? match[2] ?? "").trim();
    if (!inner) continue;

    // Remove tag name for common tags: `{% if person.first_name %}` → `person.first_name`
    const tagBody = inner.replace(/^(if|elsif|unless|for|assign|capture)\b\s*/i, "");
    for (const v of extractFromLiquidExpression(tagBody)) vars.add(v);
  }

  return [...vars].sort();
}

function hasPath(obj: unknown, path: string): boolean {
  if (typeof obj !== "object" || obj === null) return false;
  let cur: unknown = obj;
  for (const part of path.split(".")) {
    if (typeof cur !== "object" || cur === null) return false;
    if (!(part in (cur as Record<string, unknown>))) return false;
    cur = (cur as Record<string, unknown>)[part];
  }
  return true;
}

export function findMissingLiquidVariables(template: string, data: unknown): string[] {
  const required = listLiquidVariables(template);
  const missing = required.filter((p) => !hasPath(data, p));
  return missing;
}

