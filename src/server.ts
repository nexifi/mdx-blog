/**
 * Server-only entry point for @nexifi/mdx-blog
 *
 * This module exports ONLY Node.js-compatible utilities (no React, no Next.js).
 * Safe to use in build scripts, CLI tools, and API routes under any Node.js version.
 *
 * Usage:
 *   const { ContentAPIAdapter } = require("@nexifi/mdx-blog/server");
 *   // or
 *   import { ContentAPIAdapter } from "@nexifi/mdx-blog/server";
 */

// Types (no runtime cost)
export type {
  Article,
  ArticleMetadata,
  BlogApiConfig,
  PaginatedResult,
  PaginationOptions,
  ValidationError,
} from "./types";
export { ArticleMetadataSchema } from "./types";

// Content API Adapter (server-side HTTP client)
export { ContentAPIAdapter } from "./adapters/contentApi";
export type { ContentAPIConfig } from "./adapters/contentApi";

// Security utilities
export { sanitizeSlug, fetchWithTimeout, safeJsonLd } from "./utils/security";

// XML utilities
export { escapeXml } from "./utils/xml";

// Sitemap utilities (pure functions, no React)
export {
  generateSitemap,
  buildSitemapXML,
  generateSitemapIndex,
  getArticleSitemapEntries,
  generateRobotsTxt,
} from "./utils/sitemap";
export type {
  SitemapConfig,
  SitemapEntry,
  SitemapImage,
  ChangeFrequency,
} from "./utils/sitemap";

// Static sitemap generation (build time)
export {
  generateStaticSitemap,
  generateSitemapOnBuild,
  generateBuildTimeSEO,
  generateLlmsTxt,
} from "./utils/staticSitemap";
export type {
  StaticSitemapConfig,
  BuildTimeSEOConfig,
  LlmsConfig,
} from "./utils/staticSitemap";

// RSS/Atom feed generation
export { generateRSSFeed, generateAtomFeed } from "./utils/rss";
export type { RSSConfig, AtomConfig } from "./utils/rss";

// Markdown → HTML rendering (server-safe, no RSC streaming issues)
export {
  renderMarkdown,
  renderMarkdownSync,
} from "./utils/markdown";
export type { RenderMarkdownOptions } from "./utils/markdown";

// Image utilities (pure functions, no React)
export {
  resolveImageUrl,
  generateSrcSet,
  generateSizes,
  computeHeight,
  getOGImageDimensions,
  buildImageObject,
  isExternalImage,
  getExternalOrigin,
  DEFAULT_WIDTHS,
  ASPECT_RATIOS,
} from "./utils/image";
export type {
  ImageSource,
  ImageLoader,
  ImageLoaderParams,
} from "./utils/image";

// Sitemap Page (SSR — Pages Router)
export {
  default as SitemapPage,
  createSitemapServerSideProps,
  getServerSideProps as sitemapGetServerSideProps,
} from "./pages/SitemapPage";
export type { SitemapPageConfig } from "./pages/SitemapPage";

// Robots.txt Page (SSR — Pages Router)
export {
  default as RobotsPage,
  createRobotsServerSideProps,
  getServerSideProps as robotsGetServerSideProps,
} from "./pages/RobotsPage";
export type { RobotsPageConfig } from "./pages/RobotsPage";

// LLMs.txt Page (SSR — Pages Router)
export {
  default as LlmsPage,
  createLlmsServerSideProps,
  getServerSideProps as llmsGetServerSideProps,
} from "./pages/LlmsPage";
export type { LlmsPageConfig } from "./pages/LlmsPage";
