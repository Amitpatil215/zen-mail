import Link from "next/link";
import { Button } from "@/components/ui/button";

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
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild>
            <Link href="/app">Open dashboard</Link>
          </Button>
        </div>
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
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-sm text-muted-foreground">
              Event-driven architecture
            </div>
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

