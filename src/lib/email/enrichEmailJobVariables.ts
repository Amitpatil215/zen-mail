import { getServerDb } from "@/lib/firestore/server";
import type { CampaignRecipient } from "@/lib/campaigns/mergePersonVariables";
import type { EmailJobDoc, PersonDoc } from "@/lib/firestore/schema";
import { signParams } from "@/lib/crypto/signing";

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

function pickPersonFields(vars: Record<string, unknown>) {
  const nested = asRecord(vars.person);
  const first =
    (typeof nested.first_name === "string" && nested.first_name) ||
    (typeof vars.first_name === "string" && vars.first_name) ||
    "";
  const last =
    (typeof nested.last_name === "string" && nested.last_name) ||
    (typeof vars.last_name === "string" && vars.last_name) ||
    "";
  const email =
    (typeof nested.email === "string" && nested.email) ||
    (typeof vars.email === "string" && vars.email) ||
    "";
  return { first_name: first, last_name: last, email };
}

function unsubscribeUrl(params: {
  baseUrl: string;
  tenantId: string;
  personId: string;
  fromEmail: string;
}) {
  const f = params.fromEmail.toLowerCase().trim();
  const sig = signParams({ t: params.tenantId, p: params.personId, f });
  const q = new URLSearchParams({
    t: params.tenantId,
    p: params.personId,
    f,
    sig,
  });
  return `${params.baseUrl}/u/unsub?${q.toString()}`;
}

/**
 * Merges `person` / `system` for Liquid: always applied last so signatures stay trusted.
 */
export async function enrichEmailJobVariables(params: {
  tenantId: string;
  job: EmailJobDoc;
  fromEmail: string;
}): Promise<Record<string, unknown>> {
  const base = asRecord(params.job.variables);
  const baseUrl = (process.env.PUBLIC_BASE_URL ?? "").replace(/\/$/, "");
  const db = getServerDb();
  const people = db.collection("tenants").doc(params.tenantId).collection("people");

  let personId = params.job.person_id?.trim() || "";
  let docSnap = personId ? await people.doc(personId).get() : null;

  if ((!docSnap || !docSnap.exists) && params.job.to[0]) {
    const email = params.job.to[0].toLowerCase().trim();
    const found = await people.where("email", "==", email).limit(1).get();
    if (!found.empty) {
      docSnap = found.docs[0]!;
      personId = docSnap.id;
    }
  }

  let first_name = "";
  let last_name = "";
  let email = params.job.to[0]?.toLowerCase().trim() ?? "";

  if (docSnap?.exists) {
    const d = docSnap.data() as PersonDoc;
    first_name = d.first_name ?? "";
    last_name = d.last_name ?? "";
    email = d.email ?? email;
  } else {
    const picked = pickPersonFields(base);
    first_name = picked.first_name;
    last_name = picked.last_name;
    email = picked.email || email;
  }

  const person = {
    ...asRecord(base.person),
    first_name,
    last_name,
    email,
  };

  const unsubscribe =
    baseUrl && personId
      ? unsubscribeUrl({
          baseUrl,
          tenantId: params.tenantId,
          personId,
          fromEmail: params.fromEmail,
        })
      : "";

  const system = {
    unsubscribe,
    people: {
      first_name,
      last_name,
      email,
    },
  };

  return { ...base, person, system };
}

/** Campaign preview: same `system.*` shape as send-time without persisting a job. */
export function mergePreviewSystemVariables(params: {
  tenantId: string;
  fromEmail: string | null;
  recipient: CampaignRecipient;
  variables: Record<string, unknown>;
}): Record<string, unknown> {
  const baseUrl = (process.env.PUBLIC_BASE_URL ?? "").replace(/\/$/, "");
  const from = (params.fromEmail ?? "newsletter@example.com").toLowerCase().trim();
  const unsubscribe = baseUrl
    ? unsubscribeUrl({
        baseUrl,
        tenantId: params.tenantId,
        personId: params.recipient.id,
        fromEmail: from,
      })
    : "";
  const first = params.recipient.first_name ?? "";
  const last = params.recipient.last_name ?? "";
  const email = params.recipient.email;
  return {
    ...params.variables,
    system: {
      unsubscribe: unsubscribe || "[Configure PUBLIC_BASE_URL for real unsubscribe links]",
      people: { first_name: first, last_name: last, email },
    },
  };
}
