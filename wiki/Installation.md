# Installation

## Core Dependencies

These are always required:

```bash
npm install @nexifi/mdx-blog react react-dom swr
```

| Package | Role |
|---------|------|
| `@nexifi/mdx-blog` | The blog toolkit |
| `react` | React library (peer dependency) |
| `react-dom` | React DOM renderer (peer dependency) |
| `swr` | SWR data fetching (peer dependency) |

## Framework-Specific Dependencies

Install only the dependencies for your framework:

### Next.js

```bash
npm install next
```

### Remix

```bash
npm install @remix-run/react
```

### Astro

```bash
npm install @astrojs/react
```

### Nuxt (with React islands)

```bash
npm install @nuxtjs/react
```

### SvelteKit

```bash
npm install @sveltejs/kit
```

## Optional — MDX Rendering

If you want to render MDX content (not just HTML):

```bash
npm install next-mdx-remote @mdx-js/react remark-gfm rehype-highlight
```

These unlock the `@nexifi/mdx-blog/mdx` entry point:

| Package | Role |
|---------|------|
| `next-mdx-remote` | Remote MDX rendering |
| `@mdx-js/react` | MDX React integration |
| `remark-gfm` | GitHub Flavored Markdown |
| `rehype-highlight` | Syntax highlighting |

## Package Exports

The package provides three entry points with conditional exports:

```json
{
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/index.js",
    "require": "./dist/index.cjs"
  },
  "./server": {
    "types": "./dist/server.d.ts",
    "import": "./dist/server.js",
    "require": "./dist/server.cjs"
  },
  "./mdx": {
    "types": "./dist/mdx.d.ts",
    "import": "./dist/mdx.js"
  }
}
```

| Entry Point | Environment | Format |
|------------|-------------|--------|
| `@nexifi/mdx-blog` | Client + Server | ESM + CJS |
| `@nexifi/mdx-blog/server` | Server only | ESM + CJS |
| `@nexifi/mdx-blog/mdx` | Client (ESM only) | ESM only |

> ⚠️ `@nexifi/mdx-blog/mdx` is **ESM-only** because `next-mdx-remote` and related packages are ESM-only. CJS `require()` is not supported for this entry point.

## Environment Variables

```env
# Required — ContentMaster API credentials
CONTENT_API_KEY=ak_xxxxxxxxxxxxx
CONTENT_API_URL=https://api-growthos.nexifi.com/api/contentmaster/projects/<PROJECT_ID>/articles

# Recommended — Used for SEO, sitemaps, OG tags
NEXT_PUBLIC_SITE_URL=https://yoursite.com
```

### API Key Format

The API key must match one of these formats:
- `ak_*` — Standard API key
- `cm_live_*` — ContentMaster live key
- `cm_test_*` — ContentMaster test key

## Tailwind CSS Configuration

The package components use Tailwind CSS utility classes. You must include the package in your Tailwind content configuration.

### Tailwind v4 (CSS-based)

Tailwind v4 does **not** use a `tailwind.config.js` file. Add a `@source` directive in your main CSS:

```css
/* app/globals.css */
@import "tailwindcss";

/* Include @nexifi/mdx-blog component styles */
@source "../../node_modules/@nexifi/mdx-blog/dist";
```

> Adjust the relative path based on where your CSS file is located relative to `node_modules`.

### Tailwind v3 (JS config)

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './node_modules/@nexifi/mdx-blog/**/*.{js,ts,jsx,tsx}',
  ],
  // ...
};
```

## TypeScript

The package ships with full TypeScript declarations. No `@types/` package needed.

If your project uses TypeScript, import types directly:

```typescript
import type { Article, ArticleMetadata, BlogApiConfig } from '@nexifi/mdx-blog';
```

## Verification

After installation, verify everything works:

```bash
# Check the package is installed
npm ls @nexifi/mdx-blog

# Check TypeScript types resolve
npx tsc --noEmit
```
