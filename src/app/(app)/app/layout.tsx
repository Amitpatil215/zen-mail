import type { ReactNode } from "react";
import Link from "next/link";
import { AppSidebar } from "@/components/app/AppSidebar";
import { AuthGate } from "@/components/auth/AuthGate";
import { TenantGate } from "@/components/tenants/TenantGate";
import { AuthButton } from "@/components/auth/AuthButton";

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
        <AuthButton />
      </div>
    </header>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="flex min-h-dvh">
        <AppSidebar />
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

