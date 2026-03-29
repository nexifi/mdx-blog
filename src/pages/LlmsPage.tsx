import { GetServerSideProps } from "next";
import { ContentAPIAdapter } from "../adapters/contentApi";
import { BlogApiClient } from "../client";
import { Article } from "../types";
import { LlmsConfig, generateLlmsTxt } from "../utils/staticSitemap";

/**
 * Configuration pour la page llms.txt
 */
export interface LlmsPageConfig {
  /** URL de base du site (ex: "https://example.com") */
  siteUrl: string;
  /** Chemin du blog (défaut: "/blog") */
  blogPath?: string;
  /** Configuration llms.txt (nom, description, services, etc.) */
  llmsConfig: LlmsConfig;
  /** Générer la version full (llms-full.txt) au lieu de la version concise */
  full?: boolean;
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
 * Composant de page vide pour llms.txt (le texte est retourné directement)
 */
function LlmsPage() {
  return null;
}

/**
 * Factory pour créer getServerSideProps pour la page llms.txt
 *
 * @example
 * ```tsx
 * // pages/llms.txt.tsx
 * import { LlmsPage, createLlmsServerSideProps } from "@nexifi/mdx-blog/server";
 *
 * export default LlmsPage;
 * export const getServerSideProps = createLlmsServerSideProps({
 *   siteUrl: "https://example.com",
 *   blogPath: "/blog",
 *   llmsConfig: {
 *     name: "My Site",
 *     description: "A great site about great things.",
 *     contact: { email: "hello@example.com" },
 *     services: [
 *       { title: "Service A", url: "https://example.com/a", description: "Description A" },
 *     ],
 *   },
 * });
 *
 * // pages/llms-full.txt.tsx
 * import { LlmsPage, createLlmsServerSideProps } from "@nexifi/mdx-blog/server";
 *
 * export default LlmsPage;
 * export const getServerSideProps = createLlmsServerSideProps({
 *   siteUrl: "https://example.com",
 *   blogPath: "/blog",
 *   full: true,
 *   llmsConfig: {
 *     name: "My Site",
 *     description: "A great site about great things.",
 *   },
 * });
 * ```
 */
export function createLlmsServerSideProps(
  config: LlmsPageConfig,
): GetServerSideProps {
  return async ({ res }) => {
    try {
      const blogPath = config.blogPath || "/blog";
      const baseUrl = config.siteUrl.replace(/\/$/, "");
      let articles: Article[] = [];

      // Récupérer les articles selon la méthode choisie
      if (config.useContentAPI && config.contentAPIConfig) {
        const api = new ContentAPIAdapter(config.contentAPIConfig);
        const rawArticles = await api.getAllArticles();
        articles = rawArticles.map((a) =>
          ContentAPIAdapter.transformArticle(a),
        );
      } else if (config.blogAPIConfig) {
        const client = new BlogApiClient({
          endpoints: config.blogAPIConfig.endpoints,
        });
        articles = await client.getArticles();
      }

      // Générer llms.txt / llms-full.txt
      const { llmsTxt, llmsFullTxt } = generateLlmsTxt(
        config.llmsConfig,
        articles,
        baseUrl,
        blogPath,
      );

      const content = config.full ? llmsFullTxt : llmsTxt;

      // Headers
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader(
        "Cache-Control",
        "public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400",
      );
      res.write(content);
      res.end();

      return { props: {} };
    } catch (error) {
      console.error("Error generating llms.txt:", error);

      // Fallback minimal
      const fallback = `# ${config.llmsConfig.name}\n\n> ${config.llmsConfig.description}\n`;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.write(fallback);
      res.end();

      return { props: {} };
    }
  };
}

/**
 * getServerSideProps par défaut utilisant les variables d'environnement
 */
export const getServerSideProps: GetServerSideProps = async (context) => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const apiKey = process.env.CONTENT_MASTER_API_KEY;

  const config: LlmsPageConfig = {
    siteUrl,
    blogPath: "/blog",
    llmsConfig: {
      name: process.env.NEXT_PUBLIC_SITE_NAME || "Blog",
      description:
        process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "Blog articles and content",
    },
  };

  if (apiKey) {
    config.useContentAPI = true;
    config.contentAPIConfig = { apiKey };
  } else {
    config.blogAPIConfig = {
      endpoints: { articles: "/api/articles" },
    };
  }

  return createLlmsServerSideProps(config)(context);
};

export default LlmsPage;
