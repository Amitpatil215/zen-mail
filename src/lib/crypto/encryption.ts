import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

type EncPayload = {
  v: 1;
  alg: "aes-256-gcm";
  iv: string; // base64
  tag: string; // base64
  data: string; // base64
};

function getKeyBytes() {
  const raw = process.env.SES_CRED_ENC_KEY;
  if (!raw) throw new Error("SES_CRED_ENC_KEY not configured (base64 32 bytes).");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("SES_CRED_ENC_KEY must decode to 32 bytes.");
  return key;
}

export function encryptString(plaintext: string): string {
  const key = getKeyBytes();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload: EncPayload = {
    v: 1,
    alg: "aes-256-gcm",
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    data: enc.toString("base64"),
  };
  return JSON.stringify(payload);
}

export function decryptString(payloadJson: string): string {
  const key = getKeyBytes();
  const payload = JSON.parse(payloadJson) as EncPayload;
  if (payload.v !== 1 || payload.alg !== "aes-256-gcm") {
    throw new Error("Unsupported encryption payload.");
  }
  const iv = Buffer.from(payload.iv, "base64");
  const tag = Buffer.from(payload.tag, "base64");
  const data = Buffer.from(payload.data, "base64");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString("utf8");
}

