import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Form Schema DSL</h1>
      <p className="text-fd-muted-foreground mb-8">Internal Documentation</p>
      
      <div className="grid gap-3 w-full max-w-md">
        <LinkCard href="/docs" title="Documentation" />
        <LinkCard href="/docs/concepts/field-types" title="Field Types" />
        <LinkCard href="/docs/concepts/expressions" title="Expressions" />
        <LinkCard href="/docs/concepts/conditional-logic" title="Conditional Logic" />
        <LinkCard href="/docs/recipes/cascading-dropdown" title="Cascading Dropdowns" />
        <LinkCard href="/docs/reference/schema-properties" title="Schema Reference" />
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
