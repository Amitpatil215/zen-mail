import { Liquid } from "liquidjs";

const engine = new Liquid({
  strictFilters: true,
  strictVariables: false,
});

export async function renderLiquid(
  template: string,
  data: unknown,
  opts?: { strictVariables?: boolean }
) {
  const scope: Record<string, unknown> =
    typeof data === "object" && data !== null ? (data as Record<string, unknown>) : {};
  return engine.parseAndRender(template, scope, {
    strictVariables: opts?.strictVariables ?? false,
  });
}

