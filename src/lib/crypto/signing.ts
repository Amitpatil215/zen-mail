import { createHmac, timingSafeEqual } from "crypto";

function required(name: string, v: string | undefined) {
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export function signParams(params: Record<string, string>) {
  const key = required("TRACKING_SIGNING_KEY", process.env.TRACKING_SIGNING_KEY);
  const canonical = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHmac("sha256", key).update(canonical).digest("hex");
}

export function verifySignature(params: Record<string, string>, sig: string) {
  const expected = signParams(params);
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(sig, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

