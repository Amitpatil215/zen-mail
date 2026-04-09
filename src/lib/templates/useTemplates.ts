import { useEffect, useState } from "react";
import type { TemplateRow } from "@/lib/templates/firestoreClient";
import { subscribeTemplates } from "@/lib/templates/firestoreClient";

export function useTemplates(tenantId: string | null) {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) {
      setTemplates([]);
      return;
    }
    setError(null);
    let unsub: (() => void) | null = null;
    subscribeTemplates({
      tenantId,
      onChange: setTemplates,
      onError: (m) => setError(m),
    })
      .then((u) => {
        unsub = u;
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load templates."));
    return () => unsub?.();
  }, [tenantId]);

  return { templates, error };
}

