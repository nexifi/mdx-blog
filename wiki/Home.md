# @nexifi/mdx-blog

> **Complete headless blog toolkit for React** — API client, hooks, SEO, sitemap, RSS, MDX widgets.  
> Works with Next.js, Remix, Astro, Nuxt, SvelteKit, and any React app.

[![npm version](https://img.shields.io/npm/v/@nexifi/mdx-blog)](https://www.npmjs.com/package/@nexifi/mdx-blog)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/nexifi/mdx-blog/blob/main/LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)

---

## What is @nexifi/mdx-blog?

`@nexifi/mdx-blog` is a framework-agnostic, headless blog toolkit that provides everything you need to add a fully-featured blog to your React application:

- 🔌 **API Client** with SWR-based React hooks for data fetching
- 🖥️ **Server Adapter** (`ContentAPIAdapter`) for secure API key authentication
- 🧩 **Pre-built UI Components** — blog list, article layout, image handling
- 📝 **7 MDX Widgets** — Newsletter, ToC, AuthorBio, ProductCard, RelatedPosts, StatsBox, FeatureList
- 🔍 **SEO** — JSON-LD structured data, meta tags, sitemap, robots.txt, llms.txt
- 📡 **RSS/Atom** feed generation
- 🌐 **i18n** — all UI strings overridable (French defaults)
- 🔒 **Security** — XSS-safe JSON-LD, slug sanitization, fetch timeout, XML injection protection

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Your Application                    │
├──────────────┬───────────────────┬────────────────────┤
│  Blog Pages  │   API Routes      │   Build Scripts    │
│  (React)     │   (Server)        │   (Node.js)        │
├──────────────┼───────────────────┼────────────────────┤
│  @nexifi/    │  @nexifi/         │  @nexifi/          │
│  mdx-blog    │  mdx-blog/server  │  mdx-blog/server   │
│              │                   │                    │
│  • Hooks     │  • ContentAPI     │  • Sitemap         │
│  • Components│    Adapter        │  • RSS/Atom        │
│  • SEO       │  • Security       │  • llms.txt        │
│  • Widgets   │                   │  • Static gen      │
│  • Images    │                   │                    │
└──────────────┴───────────────────┴────────────────────┘
```

## Quick Links

| Section | Description |
|---------|-------------|
| [[Getting Started]] | Installation, setup, and first steps |
| [[Installation]] | Detailed install instructions per framework |
| [[BlogProvider]] | Configuring the React context provider |
| [[API Routes]] | Setting up server-side API routes |
| [[Hooks]] | React hooks reference (`useArticles`, `useArticle`, etc.) |
| [[Components]] | UI components (`BlogListPage`, `ArticleLayout`, etc.) |
| [[MDX Widgets]] | The 7 MDX content widgets |
| [[BlogImage]] | Responsive image component |
| [[SEO]] | JSON-LD, meta tags, structured data |
| [[Sitemap]] | XML sitemap, robots.txt, sitemap index |
| [[RSS & Atom Feeds]] | Feed generation |
| [[llms.txt]] | AI discoverability (llmstxt.org standard) |
| [[Internationalization]] | i18n labels system |
| [[Security]] | XSS protection, slug sanitization, timeouts |
| [[Server Utilities]] | `ContentAPIAdapter`, image utils, XML escaping |
| [[SSG Factories]] | Static generation for Pages Router |
| [[MDX Rendering]] | MDXProvider, BlogArticlePage, custom components |
| [[Framework Guides]] | Next.js, Remix, Astro, Nuxt, SvelteKit |
| [[Types Reference]] | TypeScript interfaces and types |
| [[Changelog]] | Version history |

## Supported Frameworks

| Framework | Status | Notes |
|-----------|--------|-------|
| **Next.js** (App Router) | ✅ Full support | React components + Route Handlers |
| **Next.js** (Pages Router) | ✅ Full support | React components + API routes + SSG factories |
| **Remix** v2 | ✅ Full support | React components + loaders/actions |
| **Astro** v4+ | ✅ Full support | React components via `@astrojs/react` + API endpoints |
| **Nuxt** v3 | ✅ Supported | React components via islands + server routes |
| **SvelteKit** v2 | ⚙️ Server utilities | ContentAPIAdapter, sitemap, RSS (custom UI for Svelte) |
| **Plain React** | ✅ Full support | React components + any API layer |

## Reference Implementation

[**getmax.io**](https://getmax.io) is the canonical production implementation. Study its patterns when integrating into similar projects.

| Aspect | Details |
|--------|---------|
| URL | [getmax.io](https://getmax.io) |
| Framework | Next.js 15, App Router |
| i18n | Locale-prefixed routes: `/fr/blog`, `/en/blog` |
| Styling | Tailwind CSS v4 |
| Structure | `src/app/[locale]/blog/page.tsx` + `src/app/[locale]/blog/[slug]/page.tsx` |

## Entry Points

| Import | When to use |
|--------|-------------|
| `@nexifi/mdx-blog` | Client-side: components, hooks, provider, types, SEO, images, widgets |
| `@nexifi/mdx-blog/server` | Server-side only: ContentAPIAdapter, sitemap, RSS, security |
| `@nexifi/mdx-blog/mdx` | MDX rendering: BlogArticlePage, MDXProvider, SSG factories (ESM only) |
