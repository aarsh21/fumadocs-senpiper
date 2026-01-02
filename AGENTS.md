# AGENTS.md - Fumadocs Senpiper Documentation Site

This file contains guidelines for AI coding agents working in this repository.

## Project Overview

A Next.js 16 documentation site built with [Fumadocs](https://fumadocs.dev), using:

- **Framework**: Next.js 16.1.1 with App Router
- **React**: 19.x
- **Styling**: Tailwind CSS 4.x with fumadocs-ui preset
- **Content**: MDX via fumadocs-mdx
- **Package Manager**: Bun (bun.lock present)

## Build/Lint/Test Commands

```bash
# Development
bun run dev           # Start dev server (next dev)

# Build & Type Check
bun run build         # Production build (next build)
bun run types:check   # Full type check: fumadocs-mdx && next typegen && tsc --noEmit

# Linting
bun run lint          # ESLint (uses eslint-config-next/core-web-vitals)

# Post-install (runs automatically)
bun run postinstall   # Generates fumadocs-mdx types
```

**No test framework configured** - there are no test commands or test files.

## Project Structure

```
app/
  (home)/              # Landing page route group
    layout.tsx         # Uses HomeLayout from fumadocs-ui
    page.tsx           # Home page component
  docs/
    [[...slug]]/       # Catch-all docs pages
      page.tsx         # Doc page with MDX rendering
    layout.tsx         # Uses DocsLayout from fumadocs-ui
  api/search/          # Search API route handler
  og/docs/[...slug]/   # OG image generation
  llms-full.txt/       # LLM-friendly text export
  layout.tsx           # Root layout with RootProvider
  global.css           # Tailwind imports + fumadocs presets

content/docs/          # MDX documentation files
lib/
  source.ts            # Fumadocs source loader config
  layout.shared.tsx    # Shared layout options
```

## Code Style Guidelines

### TypeScript

- **Strict mode enabled** - no implicit any, strict null checks
- **Target**: ESNext
- **Module**: ESNext with bundler resolution
- **Path aliases**: `@/*` maps to project root

### Imports

```typescript
// 1. External packages first
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

// 2. fumadocs imports
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { source } from '@/lib/source';

// 3. Local imports using @/ alias
import { baseOptions } from '@/lib/layout.shared';
```

### Components

- **Function components only** - no class components
- **Export default for page/layout components**
- **Named exports for utilities and helpers**

```typescript
// Page component pattern
export default async function Page(props: PageProps<'/docs/[[...slug]]'>) {
  const params = await props.params;
  // ...
}

// Utility function pattern
export function getPageImage(page: InferPageType<typeof source>) {
  // ...
}
```

### Type Annotations

- Use fumadocs-provided types: `PageProps<'/route'>`, `LayoutProps<'/route'>`, `RouteContext<'/route'>`
- Import types with `type` keyword when possible
- Use `InferPageType<typeof source>` for page type inference

```typescript
import type { Metadata } from 'next';
import { type InferPageType, loader } from 'fumadocs-core/source';
```

### Naming Conventions

| Entity | Convention | Example |
|--------|------------|---------|
| Files | kebab-case | `layout.shared.tsx` |
| Components | PascalCase | `HomePage`, `DocsLayout` |
| Functions | camelCase | `getPageImage`, `getLLMText` |
| Constants | camelCase | `source`, `config` |
| Types | PascalCase | `Metadata`, `MDXComponents` |

### JSX/React Patterns

```tsx
// Prefer single quotes in imports, JSX attributes use double quotes
import Link from 'next/link';

// className for styling (Tailwind)
<div className="flex flex-col min-h-screen">

// Spread props pattern for fumadocs layouts
<DocsLayout tree={source.getPageTree()} {...baseOptions()}>
```

### CSS/Styling

- **Tailwind CSS 4.x** with PostCSS
- **fumadocs-ui presets** for consistent documentation styling
- Import order in global.css:

  ```css
  @import 'tailwindcss';
  @import 'fumadocs-ui/css/neutral.css';
  @import 'fumadocs-ui/css/preset.css';
  ```

### MDX Content

- Frontmatter with `title` and `description` required
- Use fumadocs MDX components: `<Cards>`, `<Card>`, etc.
- Files in `content/docs/` directory

```mdx
---
title: Page Title
description: Page description
---

Content goes here...

<Cards>
  <Card title="Example" href="/docs/example" />
</Cards>
```

### Error Handling

```typescript
// Use notFound() for missing pages
const page = source.getPage(params.slug);
if (!page) notFound();
```

### Async/Await

- All page components are async (Next.js 16 pattern)
- Await params before use: `const params = await props.params;`

## Fumadocs-Specific Patterns

### Source Configuration (`lib/source.ts`)

```typescript
import { docs } from 'fumadocs-mdx:collections/server';
import { loader } from 'fumadocs-core/source';

export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});
```

### MDX Components (`mdx-components.tsx`)

```typescript
import defaultMdxComponents from 'fumadocs-ui/mdx';

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...components,
  };
}
```

### Route Handlers

- Use `revalidate = false` for static generation
- Export named functions: `GET`, `POST`, etc.

## ESLint Configuration

- Extends `eslint-config-next/core-web-vitals`
- Ignores: `.next/`, `out/`, `build/`, `.source/`

## Important Files

| File | Purpose |
|------|---------|
| `source.config.ts` | Fumadocs MDX collection config |
| `next.config.mjs` | Next.js config with MDX support |
| `lib/source.ts` | Content source loader |
| `lib/layout.shared.tsx` | Shared layout options |

## Do NOT

- Use `as any` or `@ts-ignore` - fix types properly
- Commit `.source/` directory (generated)
- Modify `next-env.d.ts` (auto-generated)
- Use relative imports when `@/` alias works

vailable resources: fuma-docs,nextjs,tailwindcss
