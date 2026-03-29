import { GetServerSideProps } from "next";
import { generateRobotsTxt } from "../utils/sitemap";

/**
 * Configuration pour la page robots.txt
 */
export interface RobotsPageConfig {
  /** URL de base du site */
  siteUrl: string;
  /** Chemin du sitemap (défaut: /sitemap.xml) */
  sitemapPath?: string;
  /** Chemins à bloquer */
  disallowPaths?: string[];
  /** Chemins à autoriser explicitement */
  allowPaths?: string[];
  /** Délai entre les requêtes (en secondes) */
  crawlDelay?: number;
  /** User-agents spécifiques avec leurs règles */
  userAgents?: Array<{
    name: string;
    disallow?: string[];
    allow?: string[];
  }>;
}

/**
 * Composant de page vide pour robots.txt (le texte est retourné directement)
 */
function RobotsPage() {
  return null;
}

/**
 * Factory pour créer getServerSideProps pour la page robots.txt
 *
 * @example
 * ```tsx
 * // pages/robots.txt.tsx
 * export { default, getServerSideProps } from "@nexifi/mdx-blog/robots";
 *
 * // Ou avec configuration personnalisée :
 * import { RobotsPage, createRobotsServerSideProps } from "@nexifi/mdx-blog";
 *
 * export default RobotsPage;
 * export const getServerSideProps = createRobotsServerSideProps({
 *   siteUrl: "https://example.com",
 *   disallowPaths: ["/api/", "/admin/"],
 * });
 * ```
 */
export function createRobotsServerSideProps(
  config: RobotsPageConfig
): GetServerSideProps {
  return async ({ res }) => {
    try {
      let robotsTxt = "";

      // Si des user-agents spécifiques sont configurés
      if (config.userAgents && config.userAgents.length > 0) {
        robotsTxt = config.userAgents
          .map((ua) => {
            let block = `User-agent: ${ua.name}\n`;
            if (ua.allow) {
              block += ua.allow.map((p) => `Allow: ${p}`).join("\n") + "\n";
            }
            if (ua.disallow) {
              block += ua.disallow.map((p) => `Disallow: ${p}`).join("\n") + "\n";
            }
            return block;
          })
          .join("\n");

        // Ajouter le sitemap à la fin
        const sitemapUrl = `${config.siteUrl.replace(/\/$/, "")}${config.sitemapPath || "/sitemap.xml"}`;
        robotsTxt += `\nSitemap: ${sitemapUrl}\n`;
      } else {
        // Utiliser le générateur par défaut
        robotsTxt = generateRobotsTxt(config.siteUrl, {
          sitemapPath: config.sitemapPath,
          disallowPaths: config.disallowPaths,
          allowPaths: config.allowPaths,
          crawlDelay: config.crawlDelay,
        });
      }

      // Headers
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
      res.write(robotsTxt);
      res.end();

      return { props: {} };
    } catch (error) {
      console.error("Error generating robots.txt:", error);

      // Fallback minimal
      const fallback = `User-agent: *\nAllow: /\n\nSitemap: ${config.siteUrl}/sitemap.xml\n`;
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

  const config: RobotsPageConfig = {
    siteUrl,
    sitemapPath: "/sitemap.xml",
    disallowPaths: [
      "/api/",
      "/_next/",
      "/admin/",
      "/private/",
    ],
    allowPaths: [
      "/api/og/", // Open Graph images
    ],
  };

  return createRobotsServerSideProps(config)(context);
};

export default RobotsPage;
