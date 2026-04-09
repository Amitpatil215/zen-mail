"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type State = { kind: "loading" } | { kind: "authed" } | { kind: "unauthed" };

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let unsub: undefined | (() => void);
    (async () => {
      const { getClientAuth } = await import("@/lib/firebase/client");
      const auth = getClientAuth();
      const { onAuthStateChanged } = await import("firebase/auth");
      unsub = onAuthStateChanged(auth, (user) => {
        if (!user) {
          setState({ kind: "unauthed" });
          router.replace("/sign-in");
          return;
        }
        setState({ kind: "authed" });
      });
    })().catch(() => {
      setState({ kind: "unauthed" });
      router.replace("/sign-in");
    });
    return () => unsub?.();
  }, [router, pathname]);

  if (state.kind !== "authed") {
    return (
      <div className="grid min-h-[40vh] place-items-center">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return <>{children}</>;
}

