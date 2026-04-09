import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthButton } from "@/components/auth/AuthButton";

function FeatureCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      <div className="mt-2 text-sm leading-6 text-muted-foreground">
        {children}
      </div>
    </div>
  );
}

function StepCard({
  step,
  title,
  children,
}: {
  step: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
          {step}
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold tracking-tight">{title}</h3>
          <div className="mt-2 text-sm leading-6 text-muted-foreground">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-14">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            Z
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">Zen Mail</div>
            <div className="text-xs text-muted-foreground">
              SES-powered email marketing
            </div>
          </div>
        </div>
        <AuthButton />
      </header>

      <main className="mt-12 grid gap-12">
        <section className="grid gap-6">
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Sending and monitoring emails in one simple platform.
          </h1>
          <p className="max-w-2xl text-pretty text-base leading-7 text-muted-foreground">
            Zen Mail is built for both tech and non-tech teams: minimal markup
            friction compared to raw SES, fast template workflows, and a clear
            queue + deliverability view.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/sign-in">Get started</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#how-it-works">How it works</Link>
            </Button>
          </div>
          <ul className="mt-2 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
            <li className="rounded-xl border border-border bg-card/50 p-4">
              Very simple to use (tech & non-tech).
            </li>
            <li className="rounded-xl border border-border bg-card/50 p-4">
              Minimum markup from base email provider like SES.
            </li>
            <li className="rounded-xl border border-border bg-card/50 p-4">
              Sending and monitoring in one platform.
            </li>
          </ul>
        </section>

        <section id="how-it-works" className="grid gap-4">
          <h2 className="text-xl font-semibold tracking-tight">How it works</h2>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Keep SES as your sending provider, then let Zen Mail handle templates,
            scheduling, retries, and monitoring.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <StepCard step="1" title="Register your SES sender">
              Add (and verify) your sender email or domain in AWS SES, then save
              your SES credentials in Zen Mail.
            </StepCard>
            <StepCard step="2" title="Build templates & audiences">
              Create templates with variables, preview them, and manage people +
              tags in one place.
            </StepCard>
            <StepCard step="3" title="Schedule sends & monitor delivery">
              Schedule email jobs via UI or API. Zen Mail handles queueing,
              retries, and records delivery events.
            </StepCard>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-sm text-muted-foreground">Under the hood</div>
            <div className="mt-2 font-mono text-sm">
              API → Firestore → Queue → Worker → SES
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          <h2 className="text-xl font-semibold tracking-tight">Core features</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <FeatureCard title="Templates + preview">
              Labels, sample data variables, and light/dark previews.
            </FeatureCard>
            <FeatureCard title="People management">
              Contacts, tags, and custom columns per tenant.
            </FeatureCard>
            <FeatureCard title="Queue + retries">
              Idempotency keys, retry/backoff, and a full send log.
            </FeatureCard>
            <FeatureCard title="Deliverability webhooks">
              Record delivered, bounced, and complaint events.
            </FeatureCard>
            <FeatureCard title="Tracking + unsubscribe">
              Open tracking pixel and signed unsubscribe routes.
            </FeatureCard>
            <FeatureCard title="Assets + API keys">
              Foldered assets for email images and S2S API keys.
            </FeatureCard>
          </div>
        </section>

        <section id="developers" className="grid gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold tracking-tight">
              For developers
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Scheduling an email is a single API call. Zen Mail stores the job,
              queues it, and sends it at the scheduled time.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-medium">Create a scheduled job</div>
              <div className="text-xs text-muted-foreground">
                POST <span className="font-mono">/api/email-jobs</span>
              </div>
            </div>
            <pre className="mt-4 overflow-x-auto rounded-xl border border-border bg-muted p-4 text-xs leading-5">
              <code>{`curl -X POST "$BASE_URL/api/email-jobs" \\
  -H "Authorization: Bearer $ID_TOKEN" \\
  -H "x-tenant-id: $TENANT_ID" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "template",
    "template_id": "welcome_email",
    "to": ["person@example.com"],
    "subject": "Welcome to Zen Mail",
    "variables": { "firstName": "Ada" },
    "scheduled_at": 1760000000000,
    "idempotency_key": "welcome_email_person@example.com_1760000000000",
    "max_retries": 3
  }'`}</code>
            </pre>
            <ul className="mt-4 grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
              <li>
                <span className="font-medium text-foreground">
                  Idempotency built-in
                </span>
                : repeated calls with the same{" "}
                <span className="font-mono">idempotency_key</span> return the
                same job.
              </li>
              <li>
                <span className="font-medium text-foreground">
                  Schedule in epoch ms
                </span>
                : set{" "}
                <span className="font-mono">scheduled_at</span> (or omit it to
                send immediately).
              </li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="mt-14 border-t border-border pt-8 text-sm text-muted-foreground">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>© {new Date().getFullYear()} Zen Mail</div>
          <div className="flex gap-4">
            <Link className="hover:underline" href="/sign-in">
              Sign in
            </Link>
            <Link className="hover:underline" href="/app">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

