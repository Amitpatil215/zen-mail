"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type State = { kind: "loading" } | { kind: "signedOut" } | { kind: "signedIn" };

export function AuthButton({
  signedInHref = "/app",
  signedOutHref = "/sign-in",
}: {
  signedInHref?: string;
  signedOutHref?: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let unsub: undefined | (() => void);
    (async () => {
      const { getClientAuth } = await import("@/lib/firebase/client");
      const auth = getClientAuth();
      const { onAuthStateChanged } = await import("firebase/auth");
      unsub = onAuthStateChanged(auth, (user) => {
        setState(user ? { kind: "signedIn" } : { kind: "signedOut" });
      });
    })().catch(() => setState({ kind: "signedOut" }));
    return () => unsub?.();
  }, []);

  async function onSignOut() {
    const { getClientAuth } = await import("@/lib/firebase/client");
    const auth = getClientAuth();
    const { signOut } = await import("firebase/auth");
    await signOut(auth);
    router.refresh();
    router.push("/");
  }

  if (state.kind === "loading") {
    return (
      <Button variant="ghost" disabled>
        …
      </Button>
    );
  }

  if (state.kind === "signedOut") {
    return (
      <Button asChild variant="ghost">
        <Link href={signedOutHref}>Sign in</Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline">
        <Link href={signedInHref}>Dashboard</Link>
      </Button>
      <Button variant="ghost" onClick={onSignOut} type="button">
        Sign out
      </Button>
    </div>
  );
}

