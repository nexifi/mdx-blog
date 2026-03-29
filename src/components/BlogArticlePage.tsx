import React from "react";
import { GetStaticProps, GetStaticPaths } from "next";
import { serialize } from "next-mdx-remote/serialize";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { BlogApiClient } from "../client";
import { Article } from "../types";
import { ArticleLayout } from "./ArticleLayout";
import { MDXProvider } from "./MDXProvider";
import { ArticleSchema, SchemaConfig } from "./ArticleSchema";
import { ArticleHead, SEOConfig } from "./ArticleHead";

interface BlogArticlePageProps {
  article: Article;
  mdxSource: MDXRemoteSerializeResult;
  relatedArticles: Article[];
  // Props de personnalisation
  siteTitle?: string;
  blogPath?: string;
  homePath?: string;
  showBreadcrumb?: boolean;
  showBackButton?: boolean;
  showShareButtons?: boolean;
  showTags?: boolean;
  showRelatedArticles?: boolean;
  // Props SEO (optionnel - si fourni, active les meta tags et schema.org)
  seoConfig?: SEOConfig;
  schemaConfig?: SchemaConfig;
  /** Custom image component (e.g., next/image) */
  ImageComponent?: React.ComponentType<any>;
  /** Site URL for resolving relative image paths */
  siteUrl?: string;
}

export function BlogArticlePage({
  article,
  mdxSource,
  relatedArticles,
  siteTitle,
  blogPath = "/blog",
  homePath = "/",
  showBreadcrumb = true,
  showBackButton = true,
  showShareButtons = true,
  showTags = true,
  showRelatedArticles = true,
  seoConfig,
  schemaConfig,
  ImageComponent,
  siteUrl,
}: BlogArticlePageProps) {
  return (
    <>
      {/* SEO Meta Tags */}
      {seoConfig && (
        <ArticleHead
          article={article}
          config={{
            ...seoConfig,
            blogPath,
          }}
        />
      )}

      {/* Schema.org JSON-LD */}
      {schemaConfig && (
        <ArticleSchema
          article={article}
          config={{
            ...schemaConfig,
            blogPath,
          }}
        />
      )}

      <ArticleLayout
        article={article}
        relatedArticles={relatedArticles}
        siteTitle={siteTitle}
        blogPath={blogPath}
        homePath={homePath}
        showBreadcrumb={showBreadcrumb}
        showBackButton={showBackButton}
        showShareButtons={showShareButtons}
        showTags={showTags}
        showRelatedArticles={showRelatedArticles}
        ImageComponent={ImageComponent}
        siteUrl={siteUrl}
      >
        <MDXProvider>
          <MDXRemote {...mdxSource} />
        </MDXProvider>
      </ArticleLayout>
    </>
  );
}

/**
 * Configuration for static generation factory functions
 */
export interface StaticGenerationConfig {
  /** API endpoint for articles list */
  articlesEndpoint?: string;
  /** API endpoint pattern for single article (use :slug placeholder) */
  articleEndpoint?: string;
  /** ISR revalidation interval in seconds (default: 3600) */
  revalidateSeconds?: number;
  /** Number of related articles to fetch (default: 3) */
  relatedCount?: number;
}

/**
 * Factory: creates a getStaticPaths function for Next.js
 *
 * @example
 * ```ts
 * export const getStaticPaths = createGetStaticPaths({
 *   articlesEndpoint: "/api/articles",
 * });
 * ```
 */
export function createGetStaticPaths(
  config: StaticGenerationConfig = {}
): GetStaticPaths {
  return async () => {
    const client = new BlogApiClient({
      endpoints: {
        articles: config.articlesEndpoint || "/api/articles",
      },
    });

    try {
      const articles = await client.getArticles();

      const paths = articles.map((article) => ({
        params: { slug: article.slug },
      }));

      return {
        paths,
        fallback: "blocking",
      };
    } catch (error) {
      console.error("Error in getStaticPaths:", error);
      return {
        paths: [],
        fallback: "blocking",
      };
    }
  };
}

/**
 * Factory: creates a getStaticProps function for Next.js
 *
 * @example
 * ```ts
 * export const getStaticProps = createGetStaticProps({
 *   articlesEndpoint: "/api/articles",
 *   articleEndpoint: "/api/articles/:slug",
 *   revalidateSeconds: 3600,
 * });
 * ```
 */
export function createGetStaticProps(
  config: StaticGenerationConfig = {}
): GetStaticProps {
  return async ({ params }) => {
    const slug = params?.slug as string;

    const client = new BlogApiClient({
      endpoints: {
        articles: config.articlesEndpoint || "/api/articles",
        article: config.articleEndpoint || "/api/articles/:slug",
      },
    });

    try {
      const article = await client.getArticle(slug);

      if (!article) {
        return {
          notFound: true,
        };
      }

      // Compile MDX content
      const mdxSource = await serialize(article.content || "", {
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeHighlight],
        },
      });

      // Fetch related articles
      const relatedArticles = await client.getRelatedArticles(
        slug,
        config.relatedCount ?? 3
      );

      return {
        props: {
          article: {
            slug: article.slug,
            title: article.title,
            date: article.date,
            category: article.category,
            excerpt: article.excerpt || "",
            author: article.author || null,
            authorTitle: article.authorTitle || null,
            authorImage: article.authorImage || null,
            image: article.image || null,
            tags: article.tags || [],
            readTime: article.readTime || null,
          },
          mdxSource,
          relatedArticles,
        },
        revalidate: config.revalidateSeconds ?? 3600,
      };
    } catch (error) {
      console.error("Error in getStaticProps:", error);
      return {
        notFound: true,
      };
    }
  };
}

/**
 * @deprecated Use `createGetStaticPaths(config)` instead
 */
export const getStaticPaths: GetStaticPaths = createGetStaticPaths();

/**
 * @deprecated Use `createGetStaticProps(config)` instead
 */
export const getStaticProps: GetStaticProps = createGetStaticProps();

export default BlogArticlePage;
