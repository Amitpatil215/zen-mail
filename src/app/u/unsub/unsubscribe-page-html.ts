/** Public unsubscribe confirmation pages (no app chrome). */

function shell(title: string, inner: string) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="robots" content="noindex,nofollow"/>
  <title>${title}</title>
  <style>
    @keyframes fadeUp { from { opacity:0; transform: translateY(12px);} to { opacity:1; transform: none;} }
    @keyframes pulseRing {
      0% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.35); }
      70% { box-shadow: 0 0 0 18px rgba(124, 58, 237, 0); }
      100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0); }
    }
    @keyframes drift {
      0%, 100% { transform: translate(0, 0) scale(1); }
      50% { transform: translate(-2%, 1%) scale(1.02); }
    }
    * { box-sizing: border-box; }
    body {
      margin:0; min-height:100vh; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
      color:#0f172a; background:#020617; overflow-x:hidden;
    }
    .bg {
      position:fixed; inset:0; z-index:0;
      background: radial-gradient(1200px 800px at 20% 10%, #1e1b4b 0%, transparent 55%),
                  radial-gradient(900px 600px at 85% 30%, #4c1d95 0%, transparent 50%),
                  radial-gradient(700px 500px at 50% 100%, #312e81 0%, #020617 70%);
      animation: drift 18s ease-in-out infinite;
    }
    .noise {
      position:fixed; inset:0; z-index:1; opacity:0.04; pointer-events:none;
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E");
    }
    .wrap { position:relative; z-index:2; min-height:100vh; display:flex; align-items:center; justify-content:center; padding:32px 20px; }
    .card {
      width:100%; max-width:440px;
      background: linear-gradient(145deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04));
      border: 1px solid rgba(255,255,255,0.14);
      border-radius: 24px;
      padding: 40px 36px 36px;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      box-shadow: 0 24px 80px rgba(0,0,0,0.45);
      animation: fadeUp 0.7s ease-out both;
    }
    .orb {
      width:72px; height:72px; margin:0 auto 22px;
      border-radius: 999px;
      background: linear-gradient(135deg, #a78bfa, #7c3aed 45%, #4f46e5);
      display:flex; align-items:center; justify-content:center;
      font-size: 34px; line-height:1;
      animation: pulseRing 2.4s ease-out infinite;
    }
    h1 {
      margin:0 0 12px; text-align:center;
      font-size: 1.55rem; font-weight: 700; letter-spacing: -0.03em; color: #f8fafc;
    }
    p {
      margin:0; text-align:center; font-size: 1rem; line-height: 1.65; color: #cbd5e1;
    }
    .muted { margin-top:18px; font-size:0.875rem; color:#94a3b8; }
    .sender {
      display:inline-block; margin-top:14px; padding:8px 14px;
      border-radius:999px; font-size:0.8125rem; color:#e2e8f0;
      background: rgba(15,23,42,0.5); border:1px solid rgba(148,163,184,0.25);
    }
  </style>
</head>
<body>
  <div class="bg" aria-hidden="true"></div>
  <div class="noise" aria-hidden="true"></div>
  <div class="wrap">${inner}</div>
</body>
</html>`;
}

export function unsubscribeInvalidPage() {
  const inner = `<div class="card" role="alert">
    <div class="orb" aria-hidden="true">✕</div>
    <h1>Link not valid</h1>
    <p>This unsubscribe link is missing details or has expired. If you still need help, reply to the last email you received from us.</p>
  </div>`;
  return shell("Unsubscribe", inner);
}

export function unsubscribeSuccessPage(params: { fromLabel?: string }) {
  const from = params.fromLabel
    ? `<p class="sender" title="Sender you opted out from">${escapeHtml(params.fromLabel)}</p>`
    : "";
  const inner = `<div class="card">
    <div class="orb" aria-hidden="true">✓</div>
    <h1>We're sorry to see you go</h1>
    <p>You have been unsubscribed. You will not receive more messages from this sender address.</p>
    ${from}
    <p class="muted">If this was a mistake, you can contact the team that emailed you and ask to be re-subscribed.</p>
  </div>`;
  return shell("Unsubscribed", inner);
}

export function unsubscribeAlreadyPage(params: { fromLabel?: string }) {
  const from = params.fromLabel
    ? `<p class="sender">${escapeHtml(params.fromLabel)}</p>`
    : "";
  const inner = `<div class="card">
    <div class="orb" aria-hidden="true">✓</div>
    <h1>You're already unsubscribed</h1>
    <p>Our records show you have already opted out from this sender. No further action is needed.</p>
    ${from}
    <p class="muted">We're sorry to see you go — thank you for the time you spent with us.</p>
  </div>`;
  return shell("Unsubscribe", inner);
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
