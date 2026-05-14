"use client";

import { Suspense } from "react";
import { CampaignWizard } from "./CampaignWizard";

export default function NewCampaignPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
      <CampaignWizard />
    </Suspense>
  );
}
