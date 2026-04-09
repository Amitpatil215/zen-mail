"use client";

import type { TemplateDoc } from "@/lib/firestore/schema";

export function toTemplateDraftDoc(params: {
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  labels: string;
  sampleJson: string;
}): Omit<TemplateDoc, "created_at" | "updated_at"> {
  const sample = JSON.parse(params.sampleJson || "{}") as unknown;
  return {
    name: params.name.trim() || "Untitled",
    subject: params.subject ?? "",
    body_html: params.bodyHtml ?? "",
    body_text: params.bodyText?.trim() ? params.bodyText : null,
    labels: params.labels
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    sample_data:
      typeof sample === "object" && sample !== null ? (sample as Record<string, unknown>) : {},
  };
}

