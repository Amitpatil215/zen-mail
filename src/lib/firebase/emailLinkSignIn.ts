import type { ActionCodeSettings } from "firebase/auth";

/** Same key as Firebase docs — used when the user completes the link on the same device. */
export const EMAIL_FOR_SIGN_IN_KEY = "emailForSignIn";

/** Continue URL for the sign-in email; domain must be in Firebase Authorized domains. */
export function emailLinkActionCodeSettings(): ActionCodeSettings {
  if (typeof window === "undefined") {
    throw new Error("emailLinkActionCodeSettings is client-only");
  }
  return {
    url: `${window.location.origin}/sign-in`,
    handleCodeInApp: true,
  };
}
