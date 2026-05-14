"use client";

import Link from "next/link";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  FileText,
  FolderOpen,
  Key,
  LayoutDashboard,
  Mail,
  Megaphone,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems: Array<{
  href: string;
  label: string;
  icon: LucideIcon;
  comingSoon?: boolean;
}> = [
  { href: "/app", label: "Overview", icon: LayoutDashboard },
  { href: "/app/templates", label: "Templates", icon: FileText },
  { href: "/app/jobs", label: "Jobs", icon: Briefcase },
  { href: "/app/assets", label: "Assets", icon: FolderOpen },
  { href: "/app/settings/tenants", label: "Settings", icon: Settings },
  { href: "/app/settings/domains-ses", label: "SES", icon: Mail },
  { href: "/app/settings/api-keys", label: "API Keys", icon: Key },
  { href: "/app/people", label: "People", icon: Users, comingSoon: true },
  { href: "/app/campaigns", label: "Campaigns", icon: Megaphone, comingSoon: true },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-border bg-card/40 p-2 transition-[width] duration-200 ease-out md:flex",
        collapsed ? "w-17" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 py-2",
          collapsed ? "justify-center px-0" : "px-2",
        )}
      >
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground">
          Z
        </div>
        {!collapsed ? (
          <div className="min-w-0 leading-tight">
            <div className="text-sm font-semibold tracking-tight">Zen Mail</div>
            <div className="text-xs text-muted-foreground">Dashboard</div>
          </div>
        ) : null}
      </div>

      <nav className="mt-4 grid gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-xl py-2 text-sm font-medium text-foreground/90 hover:bg-muted",
                collapsed ? "justify-center px-2" : "px-3",
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              {collapsed ? (
                <span className="sr-only">{item.label}</span>
              ) : null}
              {!collapsed ? (
                <>
                  <span>{item.label}</span>
                  {item.comingSoon ? (
                    <span className="absolute right-2 top-1 rounded-full border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none text-muted-foreground">
                      Coming soon
                    </span>
                  ) : null}
                </>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {!collapsed ? (
        <div className="mt-auto px-2 pt-6 text-xs text-muted-foreground">
          Queue, templates, deliverability.
        </div>
      ) : (
        <div className="mt-auto" />
      )}

      <div className={cn("pt-2", collapsed ? "px-0" : "px-2")}>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background/60 py-2 text-sm text-foreground hover:bg-muted",
            !collapsed && "px-3",
          )}
        >
          {collapsed ? (
            <ChevronRight className="size-4 shrink-0" aria-hidden />
          ) : (
            <>
              <ChevronLeft className="size-4 shrink-0" aria-hidden />
              <span className="min-w-0 truncate">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
