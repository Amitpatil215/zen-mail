export default function AppOverviewPage() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Queue status, recent sends, and deliverability at a glance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-sm font-medium">Queued</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight">—</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Jobs waiting to be processed
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-sm font-medium">Sent (24h)</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight">—</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Successful sends in last 24 hours
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-sm font-medium">Bounces (24h)</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight">—</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Bounces reported by SES
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="text-sm font-medium">Recent activity</div>
        <div className="mt-2 text-sm text-muted-foreground">
          Go to Jobs to create a test job, then run your external cron against
          the worker endpoint to process it.
        </div>
      </div>
    </div>
  );
}

