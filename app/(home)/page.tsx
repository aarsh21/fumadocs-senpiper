import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Form Schema DSL</h1>
      <p className="text-fd-muted-foreground mb-8">Internal Documentation</p>

      <Link
        href="/ai-form-helper"
        className="group mb-8 w-full max-w-md p-5 rounded-xl border-2 border-fd-primary/30 bg-gradient-to-br from-fd-primary/5 to-fd-primary/10 hover:border-fd-primary/60 hover:from-fd-primary/10 hover:to-fd-primary/15 transition-all"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-fd-primary/10 text-fd-primary">
            <Sparkles className="size-5" />
          </div>
          <span className="font-semibold text-lg">AI Form Schema Builder</span>
        </div>
        <p className="text-sm text-fd-muted-foreground">
          Build and edit V1 form schemas with AI assistance. Generate schemas
          from descriptions, validate JSON, and submit directly to the server.
        </p>
      </Link>

      <div className="grid gap-3 w-full max-w-md">
        <LinkCard href="/docs" title="Documentation" />
        <LinkCard href="/docs/concepts/field-types" title="Field Types" />
        <LinkCard href="/docs/concepts/expressions" title="Expressions" />
        <LinkCard
          href="/docs/concepts/conditional-logic"
          title="Conditional Logic"
        />
        <LinkCard
          href="/docs/recipes/cascading-dropdown"
          title="Cascading Dropdowns"
        />
        <LinkCard
          href="/docs/reference/schema-properties"
          title="Schema Reference"
        />
      </div>
    </main>
  );
}

function LinkCard({ href, title }: { href: string; title: string }) {
  return (
    <Link
      href={href}
      className="p-4 rounded-lg border border-fd-border hover:border-fd-primary/50 hover:bg-fd-accent/50 transition-colors"
    >
      {title}
    </Link>
  );
}
