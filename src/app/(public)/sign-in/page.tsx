"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type SignInState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string };

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<SignInState>({ kind: "idle" });

  const canSubmit = useMemo(
    () => email.trim().length > 3 && password.trim().length > 3,
    [email, password]
  );

  useEffect(() => {
    // Lazy import so this page renders even before env is configured.
    (async () => {
      const { getClientAuth } = await import("@/lib/firebase/client");
      const auth = getClientAuth();
      const { onAuthStateChanged } = await import("firebase/auth");
      return onAuthStateChanged(auth, (user) => {
        if (user) router.replace("/app");
      });
    })().catch(() => {
      // ignore (env likely not configured yet)
    });
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setState({ kind: "loading" });
    try {
      const { getClientAuth } = await import("@/lib/firebase/client");
      const auth = getClientAuth();
      const {
        signInWithEmailAndPassword,
        createUserWithEmailAndPassword,
      } = await import("firebase/auth");
      const emailTrimmed = email.trim();
      try {
        await signInWithEmailAndPassword(auth, emailTrimmed, password);
      } catch (err) {
        const code =
          typeof err === "object" && err !== null && "code" in err
            ? String((err as { code?: unknown }).code)
            : "";
        if (code === "auth/user-not-found" || code === "auth/invalid-login-credentials") {
          try {
            await createUserWithEmailAndPassword(auth, emailTrimmed, password);
          } catch (createErr) {
            const createCode =
              typeof createErr === "object" && createErr !== null && "code" in createErr
                ? String((createErr as { code?: unknown }).code)
                : "";
            // If email already exists, this was a wrong-password case.
            if (createCode === "auth/email-already-in-use") throw err;
            throw createErr;
          }
        } else throw err;
      }
      router.replace("/app");
    } catch (err) {
      setState({
        kind: "error",
        message:
          err instanceof Error ? err.message : "Failed to sign in. Try again.",
      });
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-14">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm font-medium hover:underline">
          ← Back to landing
        </Link>
      </div>

      <h1 className="mt-8 text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Use Firebase Auth email/password for now.
      </p>

      <form onSubmit={onSubmit} className="mt-8 grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-medium">Email</span>
          <input
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">Password</span>
          <input
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </label>

        {state.kind === "error" ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {state.message}
          </div>
        ) : null}

        <Button type="submit" size="lg" disabled={!canSubmit || state.kind === "loading"}>
          {state.kind === "loading" ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="mt-8 text-xs text-muted-foreground">
        After sign-in, pick a tenant (or create one) in Settings.
      </div>
    </div>
  );
}

