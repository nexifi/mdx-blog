import { GetServerSideProps } from "next";
import { generateSitemap, SitemapConfig } from "../utils/sitemap";
import { escapeXml } from "../utils/xml";
import { ContentAPIAdapter } from "../adapters/contentApi";
import { BlogApiClient } from "../client";
import { Article } from "../types";

/**
 * Configuration pour la page sitemap
 */
export interface SitemapPageConfig extends SitemapConfig {
  /** Pages statiques additionnelles à inclure */
  additionalPages?: Array<{
    path: string;
    priority?: number;
    changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  }>;
  /** Utiliser ContentAPIAdapter (true) ou BlogApiClient (false) */
  useContentAPI?: boolean;
  /** Config pour ContentAPIAdapter */
  contentAPIConfig?: {
    apiKey: string;
  };
  /** Config pour BlogApiClient */
  blogAPIConfig?: {
    endpoints?: {
      articles?: string;
    };
  };
}

/**
 * Composant de page vide pour le sitemap (le XML est retourné directement)
 */
function SitemapPage() {
  return null;
}

/**
 * Factory pour créer getServerSideProps pour la page sitemap
 * Le sitemap est généré à chaque requête mais avec cache HTTP
 *
 * @example
 * ```tsx
 * // pages/sitemap.xml.tsx
 * export { default, getServerSideProps } from "@nexifi/mdx-blog/sitemap";
 *
 * // Ou avec configuration personnalisée :
 * import { SitemapPage, createSitemapServerSideProps } from "@nexifi/mdx-blog";
 *
 * export default SitemapPage;
 * export const getServerSideProps = createSitemapServerSideProps({
 *   siteUrl: "https://example.com",
 *   blogPath: "/blog",
 *   additionalPages: [
 *     { path: "/", priority: 1.0 },
 *     { path: "/contact", priority: 0.8 },
 *   ],
 * });
 * ```
 */
export function createSitemapServerSideProps(
  config: SitemapPageConfig
): GetServerSideProps {
  return async ({ res }) => {
    try {
      let articles: Article[] = [];

      // Récupérer les articles selon la méthode choisie
      if (config.useContentAPI && config.contentAPIConfig) {
        const api = new ContentAPIAdapter(config.contentAPIConfig);
        const rawArticles = await api.getAllArticles();
        articles = rawArticles.map((a) => ContentAPIAdapter.transformArticle(a));
      } else if (config.blogAPIConfig) {
        const client = new BlogApiClient({
          endpoints: config.blogAPIConfig.endpoints,
        });
        articles = await client.getArticles();
      }

      // Générer le sitemap
      let sitemap = generateSitemap(articles, {
        siteUrl: config.siteUrl,
        blogPath: config.blogPath,
        defaultChangeFreq: config.defaultChangeFreq,
        defaultPriority: config.defaultPriority,
      });

      // Ajouter les pages statiques si configurées
      if (config.additionalPages && config.additionalPages.length > 0) {
        sitemap = injectAdditionalPages(sitemap, config.siteUrl, config.additionalPages);
      }

      // Headers pour le cache et le content-type
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400");
      res.write(sitemap);
      res.end();

      return { props: {} };
    } catch (error) {
      console.error("Error generating sitemap:", (error as Error).message);
      
      // Retourner un sitemap minimal en cas d'erreur
      const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${config.siteUrl}</loc>
    <priority>1.0</priority>
  </url>
</urlset>`;

      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      res.write(fallbackSitemap);
      res.end();

      return { props: {} };
    }
  };
}

/**
 * Helper pour injecter des pages additionnelles dans le sitemap
 */
function injectAdditionalPages(
  sitemap: string,
  siteUrl: string,
  pages: Array<{ path: string; priority?: number; changefreq?: string }>
): string {
  const baseUrl = siteUrl.replace(/\/$/, "");

  const additionalEntries = pages
    .map((page) => {
      let entry = `  <url>\n    <loc>${escapeXml(`${baseUrl}${page.path}`)}</loc>`;
      if (page.changefreq) {
        entry += `\n    <changefreq>${escapeXml(page.changefreq)}</changefreq>`;
      }
      if (page.priority !== undefined) {
        entry += `\n    <priority>${page.priority.toFixed(1)}</priority>`;
      }
      entry += `\n  </url>`;
      return entry;
    })
    .join("\n");

  // Insérer avant la fermeture </urlset>
  return sitemap.replace("</urlset>", `${additionalEntries}\n</urlset>`);
}

/**
 * getServerSideProps par défaut utilisant les variables d'environnement
 * Utilise automatiquement NEXT_PUBLIC_SITE_URL et CONTENT_MASTER_API_KEY
 */
export const getServerSideProps: GetServerSideProps = async (context) => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const apiKey = process.env.CONTENT_MASTER_API_KEY;

  const config: SitemapPageConfig = {
    siteUrl,
    blogPath: "/blog",
    defaultChangeFreq: "weekly",
    defaultPriority: 0.7,
    additionalPages: [
      { path: "/", priority: 1.0, changefreq: "daily" },
    ],
  };

  // Si on a une clé API Content Master, l'utiliser
  if (apiKey) {
    config.useContentAPI = true;
    config.contentAPIConfig = {
      apiKey,
    };
  } else {
    // Sinon, utiliser l'API locale
    config.blogAPIConfig = {
      endpoints: {
        articles: "/api/articles",
      },
    };
  }

  return createSitemapServerSideProps(config)(context);
};

export default SitemapPage;
