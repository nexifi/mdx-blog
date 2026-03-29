// Types
export type {
  Article,
  ArticleMetadata,
  BlogApiConfig,
  PaginatedResult,
  PaginationOptions,
  ValidationError,
} from "./types";

// Client API
export { BlogApiClient } from "./client";

// Provider & Context
export { BlogProvider, useBlogClient, useLabels } from "./provider";

// i18n Labels
export type { Labels } from "./i18n/defaults";
export { defaultLabels, mergeLabels } from "./i18n/defaults";

// Hooks
export {
  useArticles,
  useArticle,
  useCategories,
  useRelatedArticles,
  usePagination,
  useArticlesByTag,
  useSearch,
} from "./hooks";

// Adapters — server-side only, use "@nexifi/mdx-blog/server"
export type { ContentAPIConfig } from "./adapters/contentApi";

// UI Components
export { BlogListPage } from "./components/BlogListPage";
export { ArticleLayout } from "./components/ArticleLayout";

// MDX-dependent components (ESM-only) — use "@nexifi/mdx-blog/mdx" sub-path:
// BlogArticlePage, createGetStaticProps, createGetStaticPaths, MDXProvider, ArticleCTA, Alert
export {
  ArticlePlaceholder,
  getIconForCategory,
} from "./components/ArticlePlaceholder";

// Image Component
export { BlogImage } from "./components/BlogImage";
export type { BlogImageProps } from "./components/BlogImage";

// SEO Components
export { ArticleSchema, BlogListSchema } from "./components/ArticleSchema";
export type { SchemaConfig } from "./components/ArticleSchema";
export { ArticleHead, BlogListHead } from "./components/ArticleHead";
export type { SEOConfig } from "./components/ArticleHead";

// Sitemap Utilities
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

// Static Sitemap — build-time only, use "@nexifi/mdx-blog/server"
export type {
  StaticSitemapConfig,
  BuildTimeSEOConfig,
  LlmsConfig,
} from "./utils/staticSitemap";

// Sitemap/Robots/LLMs Pages (SSR, Pages Router) — use "@nexifi/mdx-blog/server"
export type { SitemapPageConfig } from "./pages/SitemapPage";
export type { RobotsPageConfig } from "./pages/RobotsPage";
export type { LlmsPageConfig } from "./pages/LlmsPage";

// MDX Widgets
export {
  Newsletter,
  TableOfContents,
  AuthorBio,
  ProductCard,
  RelatedPosts,
  StatsBox,
  FeatureList,
} from "./components/Widgets";

// Security utilities
export { sanitizeSlug, fetchWithTimeout, safeJsonLd } from "./utils/security";

// Image utilities
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

// XML utilities
export { escapeXml } from "./utils/xml";

// RSS/Atom Feed Generation
export { generateRSSFeed, generateAtomFeed } from "./utils/rss";
export type { RSSConfig, AtomConfig } from "./utils/rss";
