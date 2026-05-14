import type { TemplateDoc } from "@/lib/firestore/schema";

type SeedTemplate = Omit<TemplateDoc, "created_at" | "updated_at">;

function baseSampleData() {
  return {
    brand: {
      name: "Zen Mail",
      logo_url: "https://placehold.co/140x40/png?text=Zen+Mail",
      primary_color: "#0B1020",
      accent_color: "#6D28D9",
    },
    recipient: { first_name: "Avery", last_name: "Chen", email: "avery@example.com" },
    company: { name: "Acme Co" },
    links: {
      dashboard_url: "https://example.com/app",
      preferences_url: "https://example.com/preferences",
      unsubscribe_url: "https://example.com/unsub",
    },
    system: {
      unsubscribe: "https://example.com/u/unsub",
      people: {
        first_name: "Avery",
        last_name: "Chen",
        email: "avery@example.com",
      },
    },
  } satisfies Record<string, unknown>;
}

function htmlShell(params: { title: string; preheader: string; content: string; footerNote?: string }) {
  const footer = params.footerNote
    ? `<p style="margin:0;font-size:12px;line-height:18px;color:#6B7280">${params.footerNote}</p>`
    : "";

  // Keep HTML email compatible: table-based layout, inline styles, no JS.
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${params.title}</title>
  </head>
  <body style="margin:0;background:#F3F4F6;color:#111827;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${params.preheader}</div>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#F3F4F6;padding:24px 0">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="width:600px;max-width:600px">
            <tr>
              <td style="padding:0 18px 12px 18px">
                <div style="display:flex;align-items:center;gap:10px">
                  <div style="width:12px;height:12px;border-radius:999px;background:#6D28D9"></div>
                  <div style="font-weight:700;letter-spacing:-0.02em">${"{{ brand.name | default: 'Zen Mail' }}"}</div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:0 18px">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #E5E7EB">
                  <tr>
                    <td style="padding:22px 22px 18px 22px">
                      ${params.content}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 22px;background:#F9FAFB;border-top:1px solid #E5E7EB">
                      ${footer}
                      <p style="margin:10px 0 0 0;font-size:12px;line-height:18px;color:#6B7280">
                        <a href="${"{{ links.preferences_url }}"}" style="color:#6D28D9;text-decoration:none">Preferences</a>
                        ·
                        <a href="${"{{ system.unsubscribe | default: links.unsubscribe_url }}"}" style="color:#6D28D9;text-decoration:none">Unsubscribe</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 18px 0 18px">
                <p style="margin:0;font-size:12px;line-height:18px;color:#9CA3AF">
                  Sent to ${"{{ recipient.email }}"} · ${"{{ brand.name | default: 'Zen Mail' }}"}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function defaultTenantTemplates(): SeedTemplate[] {
  const sample = baseSampleData();

  const welcome: SeedTemplate = {
    name: "Welcome (Warm + Minimal)",
    subject: "Welcome to {{ brand.name }} — let’s get you set up",
    labels: ["onboarding", "welcome"],
    sample_data: sample,
    body_html: htmlShell({
      title: "Welcome",
      preheader: "Your account is ready. Here’s the fastest path to value.",
      content: `
        <h1 style="margin:0 0 10px 0;font-size:24px;line-height:32px;letter-spacing:-0.03em">
          Welcome, ${"{{ recipient.first_name | default: 'there' }}"}.
        </h1>
        <p style="margin:0 0 14px 0;font-size:15px;line-height:24px;color:#374151">
          We set up your workspace and added a few starter templates so you can send your first campaign in minutes.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0 6px 0">
          <tr>
            <td bgcolor="#6D28D9" style="border-radius:14px">
              <a href="${"{{ links.dashboard_url }}"}"
                 style="display:inline-block;padding:12px 16px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none">
                Open dashboard
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:10px 0 0 0;font-size:13px;line-height:20px;color:#6B7280">
          Tip: customize the variables once, reuse everywhere.
        </p>
      `,
      footerNote: "If you didn’t create this account, you can safely ignore this email.",
    }),
    body_text:
      "Welcome! Your workspace is ready.\n\nOpen dashboard: {{ links.dashboard_url }}\n\nIf you didn’t create this account, ignore this email.",
  };

  const releaseNotes: SeedTemplate = {
    name: "Product Update (Release Notes)",
    subject: "What’s new in {{ brand.name }}: 3 improvements you’ll notice",
    labels: ["product", "updates"],
    sample_data: sample,
    body_html: htmlShell({
      title: "Product update",
      preheader: "Smaller details, bigger impact — here’s what shipped.",
      content: `
        <h1 style="margin:0 0 8px 0;font-size:22px;line-height:30px;letter-spacing:-0.02em">
          A quick update from ${"{{ brand.name | default: 'Zen Mail' }}"}.
        </h1>
        <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#374151">
          Here are three improvements we shipped recently:
        </p>
        <div style="display:grid;gap:10px">
          <div style="border:1px solid #E5E7EB;border-radius:14px;padding:12px 12px;background:#ffffff">
            <div style="font-weight:700">Cleaner template editing</div>
            <div style="margin-top:4px;font-size:13px;line-height:20px;color:#6B7280">Write once, preview fast.</div>
          </div>
          <div style="border:1px solid #E5E7EB;border-radius:14px;padding:12px 12px;background:#ffffff">
            <div style="font-weight:700">Better deliverability hints</div>
            <div style="margin-top:4px;font-size:13px;line-height:20px;color:#6B7280">Catch common issues early.</div>
          </div>
          <div style="border:1px solid #E5E7EB;border-radius:14px;padding:12px 12px;background:#ffffff">
            <div style="font-weight:700">Faster job status</div>
            <div style="margin-top:4px;font-size:13px;line-height:20px;color:#6B7280">Clear “queued → sent” visibility.</div>
          </div>
        </div>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0 0 0">
          <tr>
            <td bgcolor="#111827" style="border-radius:14px">
              <a href="${"{{ links.dashboard_url }}"}"
                 style="display:inline-block;padding:12px 16px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none">
                See what’s new
              </a>
            </td>
          </tr>
        </table>
      `,
    }),
    body_text:
      "A quick update.\n\n- Cleaner template editing\n- Better deliverability hints\n- Faster job status\n\nSee what’s new: {{ links.dashboard_url }}",
  };

  const eventInvite: SeedTemplate = {
    name: "Event Invite (Modern Card)",
    subject: "You’re invited: The Zen Mail Workshop (30 min)",
    labels: ["events", "invite"],
    sample_data: sample,
    body_html: htmlShell({
      title: "Invitation",
      preheader: "A short, practical workshop on shipping email faster.",
      content: `
        <div style="border-radius:16px;padding:14px;background:linear-gradient(135deg,#111827,#6D28D9);color:#ffffff">
          <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.9">Workshop</div>
          <div style="margin-top:6px;font-size:20px;line-height:28px;font-weight:800;letter-spacing:-0.02em">
            Ship better email in 30 minutes
          </div>
          <div style="margin-top:8px;font-size:13px;line-height:20px;opacity:0.9">
            Tue · 11:00 AM · Remote
          </div>
        </div>
        <p style="margin:14px 0 14px 0;font-size:15px;line-height:24px;color:#374151">
          Hi ${"{{ recipient.first_name | default: 'there' }}"}, we’ll cover templates, variables, and a simple workflow to keep email consistent.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0">
          <tr>
            <td bgcolor="#6D28D9" style="border-radius:14px">
              <a href="${"{{ links.dashboard_url }}"}"
                 style="display:inline-block;padding:12px 16px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none">
                Reserve a spot
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:12px 0 0 0;font-size:13px;line-height:20px;color:#6B7280">
          Can’t make it? Reply and we’ll send a recap.
        </p>
      `,
    }),
    body_text:
      "You're invited: Ship better email in 30 minutes.\n\nReserve a spot: {{ links.dashboard_url }}",
  };

  const promo: SeedTemplate = {
    name: "Promo (Clean + Bold)",
    subject: "{{ brand.name }} Spring Offer — 20% off for 48 hours",
    labels: ["promo", "marketing"],
    sample_data: sample,
    body_html: htmlShell({
      title: "Limited offer",
      preheader: "A simple promo layout with a strong CTA.",
      content: `
        <h1 style="margin:0 0 8px 0;font-size:24px;line-height:32px;letter-spacing:-0.03em">
          A small upgrade, a big difference.
        </h1>
        <p style="margin:0 0 14px 0;font-size:15px;line-height:24px;color:#374151">
          For the next <strong>48 hours</strong>, get <strong>20% off</strong> your first year.
        </p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin:16px 0 0 0">
          <div style="flex:1;min-width:170px;border:1px solid #E5E7EB;border-radius:14px;padding:12px;background:#ffffff">
            <div style="font-weight:800;font-size:18px;letter-spacing:-0.02em">20% off</div>
            <div style="margin-top:4px;font-size:13px;line-height:20px;color:#6B7280">First year</div>
          </div>
          <div style="flex:1;min-width:170px;border:1px solid #E5E7EB;border-radius:14px;padding:12px;background:#ffffff">
            <div style="font-weight:800;font-size:18px;letter-spacing:-0.02em">48 hours</div>
            <div style="margin-top:4px;font-size:13px;line-height:20px;color:#6B7280">Ends soon</div>
          </div>
        </div>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:18px 0 0 0">
          <tr>
            <td bgcolor="#111827" style="border-radius:14px">
              <a href="${"{{ links.dashboard_url }}"}"
                 style="display:inline-block;padding:12px 16px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none">
                Claim offer
              </a>
            </td>
          </tr>
        </table>
      `,
    }),
    body_text:
      "Limited offer: 20% off for 48 hours.\n\nClaim offer: {{ links.dashboard_url }}",
  };

  const newsletter: SeedTemplate = {
    name: "Newsletter (Editorial)",
    subject: "{{ brand.name }} Weekly — a calm recap",
    labels: ["newsletter"],
    sample_data: sample,
    body_html: htmlShell({
      title: "Newsletter",
      preheader: "An editorial layout with sections and links.",
      content: `
        <h1 style="margin:0 0 10px 0;font-size:22px;line-height:30px;letter-spacing:-0.02em">
          This week at ${"{{ company.name | default: 'your company' }}"}.
        </h1>
        <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#374151">
          Three highlights, zero fluff.
        </p>
        <div style="border-left:3px solid #6D28D9;padding-left:12px;margin:0 0 14px 0">
          <div style="font-weight:800">1) A small win</div>
          <div style="margin-top:4px;font-size:13px;line-height:20px;color:#6B7280">What shipped and why it matters.</div>
        </div>
        <div style="border-left:3px solid #6D28D9;padding-left:12px;margin:0 0 14px 0">
          <div style="font-weight:800">2) A useful link</div>
          <div style="margin-top:4px;font-size:13px;line-height:20px;color:#6B7280">One resource worth your time.</div>
        </div>
        <div style="border-left:3px solid #6D28D9;padding-left:12px;margin:0 0 18px 0">
          <div style="font-weight:800">3) Next up</div>
          <div style="margin-top:4px;font-size:13px;line-height:20px;color:#6B7280">What we’re focusing on next week.</div>
        </div>
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td bgcolor="#6D28D9" style="border-radius:14px">
              <a href="${"{{ links.dashboard_url }}"}"
                 style="display:inline-block;padding:12px 16px;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none">
                Read in the app
              </a>
            </td>
          </tr>
        </table>
      `,
    }),
    body_text:
      "This week recap.\n\n1) A small win\n2) A useful link\n3) Next up\n\nRead in the app: {{ links.dashboard_url }}",
  };

  return [welcome, releaseNotes, eventInvite, promo, newsletter];
}

