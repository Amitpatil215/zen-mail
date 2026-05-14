"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ContactsTable } from "./contacts-table";
import { CreatePeopleDialog } from "./create-people-dialog";
import { EditPersonDialog } from "./edit-person-dialog";
import { peopleAuthedFetch } from "./people-fetch";
import { PeopleGroupsSection } from "./people-groups-section";
import type { Group, Person } from "./people-types";

const PAGE_SIZE = 12;

export function PeoplePageClient() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [filterGroupIds, setFilterGroupIds] = useState<string[]>([]);
  const [pages, setPages] = useState<
    { people: Person[]; next_cursor: string | null }[]
  >([]);
  const [activePage, setActivePage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editPerson, setEditPerson] = useState<Person | null>(null);

  const fetchPage = useCallback(
    async (cursor: string | null) => {
      const qs = new URLSearchParams();
      qs.set("page_size", String(PAGE_SIZE));
      if (filterGroupIds.length) qs.set("groups", filterGroupIds.join(","));
      if (cursor) qs.set("cursor", cursor);
      const res = await peopleAuthedFetch(`/api/people?${qs.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      return (await res.json()) as {
        people: Person[];
        next_cursor: string | null;
      };
    },
    [filterGroupIds]
  );

  const reloadPeopleFromStart = useCallback(async () => {
    try {
      const data = await fetchPage(null);
      setError(null);
      setPages([data]);
      setActivePage(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load people.");
    }
  }, [fetchPage]);

  const groupsLoadedRef = useRef(false);

  const reloadGroups = useCallback(async () => {
    const res = await peopleAuthedFetch("/api/groups");
    if (!res.ok) throw new Error(await res.text());
    const data = (await res.json()) as { groups: Group[] };
    setGroups(data.groups);
    groupsLoadedRef.current = true;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        if (!groupsLoadedRef.current) {
          const res = await peopleAuthedFetch("/api/groups");
          if (!res.ok) throw new Error(await res.text());
          const data = (await res.json()) as { groups: Group[] };
          if (cancelled) return;
          setGroups(data.groups);
          groupsLoadedRef.current = true;
        }

        const pageData = await fetchPage(null);
        if (cancelled) return;
        setError(null);
        setPages([pageData]);
        setActivePage(0);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load data.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchPage]);

  const current = pages[activePage];
  const canPrev = activePage > 0;
  const canNext = Boolean(current?.next_cursor);

  async function goNext() {
    if (!current?.next_cursor) return;
    try {
      if (pages[activePage + 1]) {
        setActivePage(activePage + 1);
        return;
      }
      const data = await fetchPage(current.next_cursor);
      setError(null);
      setPages((p) => [...p.slice(0, activePage + 1), data]);
      setActivePage(activePage + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load page.");
    }
  }

  function goPrev() {
    if (activePage > 0) setActivePage(activePage - 1);
  }

  function toggleFilterGroup(id: string) {
    setFilterGroupIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">People</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage contacts and organize them into groups.
          </p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          Add people
        </Button>
      </div>

      <PeopleGroupsSection
        groups={groups}
        filterGroupIds={filterGroupIds}
        onToggleFilterGroup={toggleFilterGroup}
        onGroupCreated={() => void reloadGroups()}
      />

      {error ? (
        <div className="text-sm text-destructive">{error}</div>
      ) : null}

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-medium">Contacts</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Page {activePage + 1}</span>
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={!canPrev}
              onClick={goPrev}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={!canNext}
              onClick={() => void goNext()}
            >
              Next
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <ContactsTable
            people={current?.people ?? []}
            groups={groups}
            onEdit={setEditPerson}
          />
        </div>
      </div>

      <CreatePeopleDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        groups={groups}
        onCreated={() => void reloadPeopleFromStart()}
      />

      <EditPersonDialog
        person={editPerson}
        open={editPerson !== null}
        onOpenChange={(o) => {
          if (!o) setEditPerson(null);
        }}
        groups={groups}
        onSaved={() => void reloadPeopleFromStart()}
      />
    </div>
  );
}
