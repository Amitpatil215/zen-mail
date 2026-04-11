"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EMAIL_FOR_SIGN_IN_KEY, emailLinkActionCodeSettings } from "@/lib/firebase/emailLinkSignIn";
import { ensureTenantAndSelectDefault } from "@/lib/tenants/ensureDefaultTenant";

type Phase = "form" | "sending" | "sent" | "completing" | "confirmLinkEmail";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [error, setError] = useState<string | null>(null);

  const canSend = useMemo(() => email.trim().length > 3, [email]);

  useEffect(() => {
    let unsub: undefined | (() => void);
    let cancelled = false;

    (async () => {
      const { getClientAuth } = await import("@/lib/firebase/client");
      const auth = getClientAuth();
      const { onAuthStateChanged, isSignInWithEmailLink, signInWithEmailLink } =
        await import("firebase/auth");

      unsub = onAuthStateChanged(auth, (user) => {
        if (user) router.replace("/app");
      });

      const href = window.location.href;
      if (!isSignInWithEmailLink(auth, href)) return;

      const stored = window.localStorage.getItem(EMAIL_FOR_SIGN_IN_KEY);
      if (stored) {
        setPhase("completing");
        setError(null);
        try {
          await signInWithEmailLink(auth, stored, href);
          window.localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
          await ensureTenantAndSelectDefault();
          if (!cancelled) router.replace("/app");
        } catch (err) {
          if (!cancelled) {
            setError(
              err instanceof Error ? err.message : "Sign-in link invalid or expired. Request a new one."
            );
            setPhase("form");
            router.replace("/sign-in");
          }
        }
        return;
      }

      if (!cancelled) setPhase("confirmLinkEmail");
    })().catch(() => {
      // env likely not configured
    });

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [router]);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend || phase === "sending") return;
    setError(null);
    setPhase("sending");
    try {
      const { getClientAuth } = await import("@/lib/firebase/client");
      const auth = getClientAuth();
      const { sendSignInLinkToEmail } = await import("firebase/auth");
      const emailTrimmed = email.trim();
      await sendSignInLinkToEmail(auth, emailTrimmed, emailLinkActionCodeSettings());
      window.localStorage.setItem(EMAIL_FOR_SIGN_IN_KEY, emailTrimmed);
      setPhase("sent");
    } catch (err) {
      setPhase("form");
      setError(err instanceof Error ? err.message : "Could not send sign-in email.");
    }
  }

  async function completeLinkWithEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!canSend || phase === "completing") return;
    setError(null);
    setPhase("completing");
    try {
      const { getClientAuth } = await import("@/lib/firebase/client");
      const auth = getClientAuth();
      const { isSignInWithEmailLink, signInWithEmailLink } = await import("firebase/auth");
      const href = window.location.href;
      if (!isSignInWithEmailLink(auth, href)) {
        setPhase("form");
        setError("This page is not a valid sign-in link anymore.");
        router.replace("/sign-in");
        return;
      }
      await signInWithEmailLink(auth, email.trim(), href);
      window.localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
      await ensureTenantAndSelectDefault();
      router.replace("/app");
    } catch (err) {
      setPhase("form");
      setError(err instanceof Error ? err.message : "Could not complete sign-in.");
      router.replace("/sign-in");
    }
  }

  const showConfirmLink = phase === "confirmLinkEmail";
  const showSent = phase === "sent";
  const busy = phase === "sending" || phase === "completing";

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-14">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm font-medium hover:underline">
          ← Back to landing
        </Link>
      </div>

      <h1 className="mt-8 text-2xl font-semibold tracking-tight">
        {showConfirmLink ? "Confirm your email" : "Sign in"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {showConfirmLink
          ? "You opened the sign-in link on a different device or browser. Enter the same email address the link was sent to."
          : showSent
            ? `We sent a sign-in link to ${email.trim()}. Check your inbox and open the link.`
            : "Passwordless sign-in: we will email you a one-time link. New accounts are created automatically the first time you use it."}
      </p>

      {showSent ? (
        <div className="mt-8 grid gap-4">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => {
              setPhase("form");
              setError(null);
            }}
          >
            Use a different email
          </Button>
        </div>
      ) : (
        <form
          onSubmit={showConfirmLink ? completeLinkWithEmail : sendMagicLink}
          className="mt-8 grid gap-4"
        >
          <label className="grid gap-2">
            <span className="text-sm font-medium">Email</span>
            <input
              className="h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              disabled={busy}
            />
          </label>

          {error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <Button type="submit" size="lg" disabled={!canSend || busy}>
            {busy
              ? showConfirmLink
                ? "Signing in..."
                : "Sending link..."
              : showConfirmLink
                ? "Complete sign-in"
                : "Email me a sign-in link"}
          </Button>
        </form>
      )}

      <div className="mt-8 text-xs text-muted-foreground">
        After sign-in, pick a tenant (or create one) in Settings.
      </div>
    </div>
  );
}
