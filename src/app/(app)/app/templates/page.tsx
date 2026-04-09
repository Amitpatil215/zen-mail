"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { getActiveTenantId } from "@/lib/tenants/activeTenant";
import { deleteTemplate, listTemplatesPage, type TemplateRow } from "@/lib/templates/firestore";
import { ConfirmDialog } from "./_components/ConfirmDialog";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

const PAGE_SIZE = 10;

function formatTs(ts?: number) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "—";
  }
}

export default function TemplatesPage() {
  const tenantId = useMemo(() => getActiveTenantId(), []);
  const [items, setItems] = useState<TemplateRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [cursors, setCursors] = useState<(QueryDocumentSnapshot<DocumentData> | null)[]>([null]);
  const [confirm, setConfirm] = useState<{ id: string; name: string } | null>(null);

  async function loadPage(targetPage: number) {
    setError(null);
    if (!tenantId) {
      setError("No active tenant selected.");
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const after = cursors[targetPage] ?? null;
      const res = await listTemplatesPage({ tenantId, pageSize: PAGE_SIZE, after });
      setItems(res.items);
      setPage(targetPage);
      setCursors((prev) => {
        const next = prev.slice();
        next[targetPage] = after;
        next[targetPage + 1] = res.lastDoc;
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load templates.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  async function doDelete(id: string) {
    if (!tenantId) return;
    try {
      await deleteTemplate({ tenantId, templateId: id });
      await loadPage(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete template.");
    }
  }

  const hasPrev = page > 0;
  const hasNext = Boolean(cursors[page + 1]);

  return (
    <div className="grid gap-6">
      <ConfirmDialog
        open={Boolean(confirm)}
        title="Delete template?"
        description={confirm ? `This will permanently delete “${confirm.name}”.` : undefined}
        confirmText="Delete"
        destructive
        onClose={() => setConfirm(null)}
        onConfirm={async () => {
          const c = confirm;
          setConfirm(null);
          if (c) await doDelete(c.id);
        }}
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Stored in Firestore under your active tenant.
          </p>
        </div>
        <Button asChild>
          <Link href="/app/templates/new">Create template</Link>
        </Button>
      </div>

      {error ? <div className="text-sm text-destructive">{error}</div> : null}

      <div className="rounded-2xl border border-border bg-card">
        <div className="hidden grid-cols-12 gap-2 border-b border-border px-5 py-3 text-xs font-medium text-muted-foreground md:grid">
          <div className="col-span-5">Name</div>
          <div className="col-span-4">Labels</div>
          <div className="col-span-2">Updated</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        <div className="divide-y divide-border">
          {items.map((t) => (
            <div
              key={t.id}
              className="flex flex-col gap-2 px-5 py-4 md:grid md:grid-cols-12 md:items-center md:gap-2 md:py-3"
            >
              <div className="md:col-span-5">
                <div className="text-sm font-medium">{t.name}</div>
                <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{t.subject}</div>
              </div>

              <div className="md:col-span-4">
                <div className="text-[11px] font-medium text-muted-foreground md:hidden">Labels</div>
                <div className="mt-1 flex flex-wrap gap-1.5 md:mt-0">
                {(t.labels ?? []).length ? (
                  t.labels.map((l) => (
                    <span key={l} className="rounded-lg border border-border px-2 py-0.5 text-[11px]">
                      {l}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 md:col-span-3 md:justify-end">
                <div className="text-xs text-muted-foreground md:col-span-2 md:text-right">
                  <span className="font-medium text-muted-foreground md:hidden">Updated: </span>
                  {formatTs(t.updated_at)}
                </div>
                <Link className="text-xs hover:underline" href={`/app/templates/${t.id}`}>
                  Edit
                </Link>
                <button
                  className="text-xs text-destructive hover:underline"
                  onClick={() => setConfirm({ id: t.id, name: t.name })}
                  type="button"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {!items.length ? (
            <div className="px-5 py-10 text-center text-sm text-muted-foreground">
              {loading ? "Loading…" : "No templates yet."}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" disabled={!hasPrev || loading} onClick={() => loadPage(page - 1)}>
          Prev
        </Button>
        <Button type="button" variant="outline" disabled={!hasNext || loading} onClick={() => loadPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

