export default function CampaignsPage() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Schedule template sends and track status per target.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="text-sm font-medium">Coming soon</div>
        <div className="mt-2 text-sm text-muted-foreground">
          Campaign creation, scheduling, and reporting are in progress.
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="text-sm font-medium">Campaign list</div>
        <div className="mt-2 text-sm text-muted-foreground">
          Coming next: draft/scheduled/running/completed and targets sublist.
        </div>
      </div>
    </div>
  );
}

