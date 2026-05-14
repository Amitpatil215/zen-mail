"use client";

import { Button } from "@/components/ui/button";

type Props = {
  globalUnsub: boolean;
  onGlobalUnsubChange: (value: boolean) => void;
  fromKeys: string[];
  onRemoveSender: (fromEmail: string) => void;
  onClearAllSenders: () => void;
};

export function EditPersonSubscriptionSection({
  globalUnsub,
  onGlobalUnsubChange,
  fromKeys,
  onRemoveSender,
  onClearAllSenders,
}: Props) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <div className="text-xs font-medium text-muted-foreground">Subscription</div>
      <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-0.5 size-4 rounded border-border"
          checked={globalUnsub}
          onChange={(e) => onGlobalUnsubChange(e.target.checked)}
        />
        <span>
          <span className="font-medium text-foreground">Unsubscribed from all workspace email</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            When checked, this person will not receive any campaigns. Per-sender opt-outs below still
            apply when this is unchecked.
          </span>
        </span>
      </label>

      <div className="mt-4 border-t border-border pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-medium text-muted-foreground">Per-sender opt-outs</div>
          {fromKeys.length ? (
            <Button type="button" variant="ghost" size="xs" onClick={onClearAllSenders}>
              Clear all
            </Button>
          ) : null}
        </div>
        {fromKeys.length ? (
          <ul className="mt-2 max-h-36 space-y-1.5 overflow-y-auto text-xs">
            {fromKeys.map((key) => (
              <li
                key={key}
                className="flex items-center justify-between gap-2 rounded-md bg-background px-2 py-1.5"
              >
                <span className="min-w-0 truncate font-mono text-muted-foreground" title={key}>
                  {key}
                </span>
                <Button type="button" variant="outline" size="xs" onClick={() => onRemoveSender(key)}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">None — receiving from all From addresses.</p>
        )}
      </div>
    </div>
  );
}
