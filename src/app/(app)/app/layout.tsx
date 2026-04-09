import type { ReactNode } from "react";
import Link from "next/link";
import { AuthGate } from "@/components/auth/AuthGate";
import { TenantGate } from "@/components/tenants/TenantGate";

const navItems: Array<{ href: string; label: string }> = [
  { href: "/app", label: "Overview" },
  { href: "/app/people", label: "People" },
  { href: "/app/templates", label: "Templates" },
  { href: "/app/campaigns", label: "Campaigns" },
  { href: "/app/jobs", label: "Jobs" },
  { href: "/app/assets", label: "Assets" },
  { href: "/app/settings/tenants", label: "Settings" },
  { href: "/app/settings/domains-ses", label: "SES" },
  { href: "/app/settings/api-keys", label: "API Keys" },
];

function Sidebar() {
  return (
    <aside className="hidden w-64 flex-col border-r border-border bg-card/40 p-4 md:flex">
      <div className="flex items-center gap-2 px-2 py-2">
        <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
          Z
        </div>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight">Zen Mail</div>
          <div className="text-xs text-muted-foreground">Dashboard</div>
        </div>
      </div>
      <nav className="mt-6 grid gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl px-3 py-2 text-sm font-medium text-foreground/90 hover:bg-muted"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto px-2 pt-6 text-xs text-muted-foreground">
        Queue, templates, deliverability.
      </div>
    </aside>
  );
}

function Topbar() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background/70 px-4 backdrop-blur">
      <div className="text-sm font-medium tracking-tight">Zen Mail</div>
      <div className="flex items-center gap-2">
        <Link
          className="rounded-xl border border-border px-3 py-1.5 text-sm hover:bg-muted"
          href="/"
        >
          Landing
        </Link>
        <Link
          className="rounded-xl border border-border px-3 py-1.5 text-sm hover:bg-muted"
          href="/sign-in"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="flex min-h-dvh">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main className="flex-1 p-4 md:p-8">
            <AuthGate>
              <TenantGate>{children}</TenantGate>
            </AuthGate>
          </main>
        </div>
      </div>
    </div>
  );
}

