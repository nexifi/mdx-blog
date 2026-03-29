# Troubleshooting

Common issues and their solutions.

---

## "useBlogClient must be used within a BlogProvider"

**Cause**: A hook (`useArticles`, `useArticle`, etc.) or component (`BlogListPage`, etc.) is rendered outside the `BlogProvider` tree.

**Fix**: Place `BlogProvider` in the **root layout**, not in individual pages.

**Checklist:**
- [ ] Is `BlogProvider` in the root layout (`layout.tsx`, `_app.tsx`, `root.tsx`)?
- [ ] Is the providers wrapper marked `'use client'`? (Next.js App Router)
- [ ] Is there a Suspense/Error boundary between `BlogProvider` and the consumer?

See [[BlogProvider]] for correct placement examples.

---

## "ContentAPIAdapter cannot be used in the browser"

**Cause**: You imported `ContentAPIAdapter` in a client component.

**Fix**: Only use `ContentAPIAdapter` in server-only code:
- API routes (`app/api/`, `pages/api/`)
- Server loaders (Remix `loader`, Astro API routes)
- `getServerSideProps` / `getStaticProps`

```typescript
// ✅ Correct — server-only file
// app/api/blog/route.ts
import { ContentAPIAdapter } from '@nexifi/mdx-blog/server';
```

```typescript
// ❌ Wrong — client component
// 'use client'
import { ContentAPIAdapter } from '@nexifi/mdx-blog/server'; // Will throw!
```

---

## Articles not showing / Empty blog

**Check in order:**

1. **Environment variables set?**
   ```bash
   echo $CONTENT_API_KEY
   echo $CONTENT_API_URL
   ```

2. **API route working?** Visit `/api/blog` in your browser — should return JSON.

3. **Endpoints match?** The endpoints in `BlogProvider` must match your API routes:
   ```tsx
   <BlogProvider config={{
     endpoints: {
       articles: '/api/blog',      // Must match your /api/blog route
       article: '/api/blog/:slug', // Must match your /api/blog/[slug] route
     },
   }}>
   ```

4. **Articles published?** Only articles with `status: 'published'` or `status: 'ready'` are shown.

5. **CORS issues?** Check browser dev tools Network tab for CORS errors.

---

## Tailwind styles not applied

**Cause**: The package's component files are not included in Tailwind's content scan.

**Fix (Tailwind v4):**
```css
@source "../../node_modules/@nexifi/mdx-blog/dist";
```

**Fix (Tailwind v3):**
```js
// tailwind.config.js
content: [
  './node_modules/@nexifi/mdx-blog/**/*.{js,ts,jsx,tsx}',
],
```

---

## "Module not found: @nexifi/mdx-blog/mdx"

**Cause**: The MDX entry point requires ESM-only dependencies that aren't installed.

**Fix:**
```bash
npm install next-mdx-remote @mdx-js/react remark-gfm rehype-highlight
```

> The `/mdx` entry point is ESM-only. Make sure your project supports ES modules (`"type": "module"` in package.json or `.mjs` extension).

---

## "Module not found: @nexifi/mdx-blog/server"

**Cause**: The package isn't installed or the version doesn't include the `/server` export.

**Fix:**
```bash
npm install @nexifi/mdx-blog@latest
```

---

## TypeScript errors

### "Cannot find module '@nexifi/mdx-blog'"

Add the package path to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "moduleResolution": "bundler"  // or "node16"
  }
}
```

### Missing types for components

Make sure you have `@types/react` and `@types/react-dom` installed:

```bash
npm install --save-dev @types/react @types/react-dom
```

---

## Build errors with Next.js

### "Dynamic server usage" error

If you get this error with the blog list page, it's because `useArticles()` makes a client-side fetch. Make sure:

1. The blog list page is a client component (`'use client'`) or uses a client component wrapper
2. The hook is not called during server-side rendering

### "ESM only" warnings

The `@nexifi/mdx-blog/mdx` entry point is ESM-only. If you see CJS/ESM compatibility warnings:

1. Ensure your `next.config.js` uses `transpilePackages`:
   ```js
   const nextConfig = {
     transpilePackages: ['@nexifi/mdx-blog'],
   };
   ```

---

## Performance Issues

### Too many API calls

SWR handles deduplication automatically. Default deduplication intervals:
- Articles: 60 seconds
- Single article: 5 minutes
- Categories: 10 minutes

If you still see excessive calls, check that `BlogProvider` isn't remounting (causing new `BlogApiClient` instances).

### Slow initial load

1. Add caching headers to your API routes (`Cache-Control: public, s-maxage=300`)
2. Use `priority` prop on above-the-fold `BlogImage` components
3. Enable ISR (Incremental Static Regeneration) with `revalidateSeconds` in SSG factories

---

## Still stuck?

1. Check the [GitHub Issues](https://github.com/nexifi/mdx-blog/issues)
2. Look at the [getmax.io](https://getmax.io) reference implementation
3. Review the [[Framework Guides]] for your specific framework
