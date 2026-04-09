"use client";

import type { ReactNode } from "react";

type Cred = {
  id: string;
  email_domain: string;
  region: string;
  status: string;
  default_from_name: string;
  default_from_email: string;
  ses_access_key: string;
  ses_secret_key: string;
};

function IconButton(props: { title: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      title={props.title}
      onClick={props.onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted"
    >
      {props.children}
    </button>
  );
}

export function ExistingSesCreds(props: {
  creds: Cred[];
  onEdit: (cred: Cred) => void;
  onDelete: (cred: Cred) => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="text-sm font-medium">Existing</div>
      <div className="mt-3 grid gap-2">
        {props.creds.length ? (
          props.creds.map((c) => (
            <div key={c.id} className="rounded-xl border border-border bg-background px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium">{c.email_domain}</div>
                  <div className="text-xs text-muted-foreground">{c.status}</div>
                </div>
                <div className="flex items-center gap-2">
                  <IconButton title="Edit" onClick={() => props.onEdit(c)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M12 20h9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4 11.5-11.5z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </IconButton>
                  <IconButton title="Delete" onClick={() => props.onDelete(c)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M3 6h18"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M8 6V4h8v2"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M19 6l-1 14H6L5 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M10 11v6M14 11v6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </IconButton>
                </div>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {c.region} • {c.default_from_email} • {c.default_from_name}
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-muted-foreground">No credentials yet.</div>
        )}
      </div>
    </div>
  );
}

