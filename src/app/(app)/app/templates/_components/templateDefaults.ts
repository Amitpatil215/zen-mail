import type { TemplateDoc } from "@/lib/firestore/schema";

export function defaultTemplateDraft(): Omit<TemplateDoc, "created_at" | "updated_at"> {
  return {
    name: "New template",
    subject: "Hello {{ person.first_name }}",
    body_html:
      "<!-- HTML template -->\n<h1>Hello {{ person.first_name }}</h1>\n<p>Welcome to Zen Mail.</p>\n",
    body_text: "Hello {{ person.first_name }}\nWelcome to Zen Mail.\n",
    labels: [],
    sample_data: {
      person: { first_name: "Taylor", last_name: "Lee", email: "taylor@example.com" },
      system: {
        unsubscribe: "https://example.com/u/unsub",
        people: {
          first_name: "Taylor",
          last_name: "Lee",
          email: "taylor@example.com",
        },
      },
    },
  };
}

