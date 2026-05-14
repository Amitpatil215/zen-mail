export function TemplateVariablesSection() {
  return (
    <section id="template-variables" className="grid gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight">Template variables (Liquid)</h2>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Every send (template or raw HTML/text) merges a{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">system</code> object into
          your Liquid scope. You do not need to pass these from the API for real mail; use{" "}
          <span className="font-medium text-foreground">Sample data</span> in the template editor
          only so the preview can resolve the same paths.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="text-sm font-medium">Built-in fields</div>
        <ul className="mt-3 grid gap-2 text-sm leading-6 text-muted-foreground md:grid-cols-2">
          <li>
            <code className="font-mono text-xs text-foreground">{"{{ system.unsubscribe }}"}</code> —
            signed URL for one-click unsubscribe from the specific From address used for that send.
          </li>
          <li>
            <code className="font-mono text-xs text-foreground">{"{{ system.people.first_name }}"}</code>
            ,{" "}
            <code className="font-mono text-xs text-foreground">{"{{ system.people.last_name }}"}</code>,{" "}
            <code className="font-mono text-xs text-foreground">{"{{ system.people.email }}"}</code> —
            resolved from the recipient when they exist in People (or from job variables).
          </li>
        </ul>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          Set <code className="rounded bg-muted px-1 font-mono">PUBLIC_BASE_URL</code> on the server so{" "}
          <code className="font-mono text-xs">system.unsubscribe</code> is a real link in production.
          Optional <code className="rounded bg-muted px-1 font-mono">person_id</code> on API jobs pins
          the CRM row for unsubscribe and merge fields.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="text-sm font-medium">Example (HTML footer)</div>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-border bg-muted p-4 text-xs leading-5">
          <code>{`<p style="font-size:12px;color:#6b7280">
  <a href="{{ system.unsubscribe }}">Unsubscribe</a>
  · sent to {{ system.people.email }}
</p>`}</code>
        </pre>
        <div className="mt-4 text-sm font-medium">Example (subject line)</div>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-border bg-muted p-4 text-xs leading-5">
          <code>{`Hi {{ system.people.first_name }}, here's your update`}</code>
        </pre>
      </div>
    </section>
  );
}
