/**
 * @nexifi/mdx-blog/mdx — ESM-only entry point
 *
 * This sub-path export contains components that depend on ESM-only packages
 * (next-mdx-remote, @mdx-js/react, remark-gfm, rehype-highlight).
 *
 * ⚠️ Only available via ESM `import`. CJS `require()` is NOT supported
 * because the underlying dependencies are ESM-only.
 *
 * Usage:
 *   import { BlogArticlePage, MDXProvider } from "@nexifi/mdx-blog/mdx";
 */

// MDX Article Page (depends on next-mdx-remote + remark-gfm + rehype-highlight)
export {
  BlogArticlePage,
  createGetStaticProps,
  createGetStaticPaths,
} from "./components/BlogArticlePage";
export type { StaticGenerationConfig } from "./components/BlogArticlePage";

// MDX Provider (depends on @mdx-js/react)
export { MDXProvider, ArticleCTA, Alert } from "./components/MDXProvider";
