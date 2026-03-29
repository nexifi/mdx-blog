import { Article } from "../types";
import { generateSitemap, SitemapConfig, generateRobotsTxt } from "./sitemap";
import { escapeXml } from "./xml";

/**
 * Génère le sitemap.xml au build time (pour le placer dans /public)
 *
 * @example
 * ```typescript
 * // scripts/generate-sitemap.ts (à exécuter avant le build)
 * import { generateStaticSitemap } from "@nexifi/mdx-blog";
 * import { writeFileSync } from "fs";
 *
 * async function main() {
 *   const sitemap = await generateStaticSitemap({
 *     siteUrl: "https://example.com",
 *     blogPath: "/blog",
 *     fetchArticles: async () => {
 *       // Récupérer vos articles depuis l'API
 *       const res = await fetch("https://api.example.com/articles");
 *       return res.json();
 *     },
 *     additionalPages: [
 *       { path: "/", priority: 1.0 },
 *       { path: "/contact", priority: 0.8 },
 *     ],
 *   });
 *
 *   writeFileSync("public/sitemap.xml", sitemap);
 *   console.log("✅ sitemap.xml generated!");
 * }
 *
 * main();
 * ```
 */
export interface StaticSitemapConfig extends SitemapConfig {
  /** Fonction pour récupérer les articles */
  fetchArticles: () => Promise<Article[]>;
  /** Pages statiques additionnelles */
  additionalPages?: Array<{
    path: string;
    priority?: number;
    changefreq?:
      | "always"
      | "hourly"
      | "daily"
      | "weekly"
      | "monthly"
      | "yearly"
      | "never";
    lastmod?: string;
  }>;
}

/**
 * Configuration complète pour la génération SEO au build time
 */
export interface BuildTimeSEOConfig {
  /** URL de base du site */
  siteUrl: string;
  /** URL de base de l'API Content Master (si différent du défaut) */
  apiUrl?: string;
  /** Clé API pour l'authentification */
  apiKey?: string;
  /** Chemin du blog */
  blogPath?: string;
  /** Dossier de sortie (par défaut: ./public) */
  outputDir?: string;
  /** Pages statiques à inclure */
  staticPages?: Array<{
    path: string;
    priority?: number;
    changefreq?:
      | "always"
      | "hourly"
      | "daily"
      | "weekly"
      | "monthly"
      | "yearly"
      | "never";
  }>;
  /** Additional dynamic pages */
  dynamicPages?: Array<{
    path: string;
    priority?: number;
    changefreq?:
      | "always"
      | "hourly"
      | "daily"
      | "weekly"
      | "monthly"
      | "yearly"
      | "never";
    lastmod?: string;
  }>;
  /** Chemins à interdire dans robots.txt */
  disallowPaths?: string[];
  /** Chemins à autoriser dans robots.txt */
  allowPaths?: string[];
  /** Délai de crawl pour robots.txt */
  crawlDelay?: number;
  /** Configuration pour la génération de llms.txt */
  llmsConfig?: LlmsConfig;
}

/**
 * Configuration for llms.txt generation (llmstxt.org standard)
 */
export interface LlmsConfig {
  /** Site / company name */
  name: string;
  /** Short description (1-2 sentences) */
  description: string;
  /** Contact information */
  contact?: {
    phone?: string;
    email?: string;
    address?: string;
    hours?: string;
    whatsapp?: string;
  };
  /** Services offered */
  services?: Array<{
    title: string;
    url: string;
    description?: string;
  }>;
  /** Content / guide pages */
  contentPages?: Array<{
    title: string;
    url: string;
    description?: string;
  }>;
  /** Section title for entity details (default: "Entities") */
  entitySectionTitle?: string;
  /** Contact page links */
  contactLinks?: Array<{ label: string; url: string }>;
  /** Extended content for llms-full.txt */
  fullContent?: {
    about?: string;
    certifications?: string[];
    serviceArea?: string;
    process?: Array<{ step: string; description: string }>;
    faq?: Array<{ question: string; answer: string }>;
    entityDetails?: Array<{
      name: string;
      url: string;
      description: string;
      signs?: string;
      methods?: string;
    }>;
  };
}

/**
 * Génère un sitemap statique au build time
 */
export async function generateStaticSitemap(
  config: StaticSitemapConfig,
): Promise<string> {
  const articles = await config.fetchArticles();

  let sitemap = generateSitemap(articles, {
    siteUrl: config.siteUrl,
    blogPath: config.blogPath,
    defaultChangeFreq: config.defaultChangeFreq,
    defaultPriority: config.defaultPriority,
  });

  // Ajouter les pages statiques
  if (config.additionalPages && config.additionalPages.length > 0) {
    const baseUrl = config.siteUrl.replace(/\/$/, "");

    const additionalEntries = config.additionalPages
      .map((page) => {
        let entry = `  <url>\n    <loc>${escapeXml(`${baseUrl}${page.path}`)}</loc>`;
        if (page.lastmod) {
          entry += `\n    <lastmod>${escapeXml(page.lastmod)}</lastmod>`;
        }
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

    sitemap = sitemap.replace("</urlset>", `${additionalEntries}\n</urlset>`);
  }

  return sitemap;
}

/**
 * Script helper pour Next.js - à utiliser dans next.config.js ou un script prebuild
 *
 * @example
 * ```javascript
 * // next.config.js
 * const { generateSitemapOnBuild } = require("@nexifi/mdx-blog");
 *
 * module.exports = {
 *   webpack: (config, { isServer }) => {
 *     if (isServer) {
 *       generateSitemapOnBuild({
 *         siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
 *         apiKey: process.env.CONTENT_MASTER_API_KEY,
 *       });
 *     }
 *     return config;
 *   },
 * };
 * ```
 */
export async function generateSitemapOnBuild(options: {
  siteUrl: string;
  apiUrl?: string;
  apiKey?: string;
  blogPath?: string;
  outputPath?: string;
  additionalPages?: Array<{
    path: string;
    priority?: number;
    changefreq?: string;
  }>;
}): Promise<void> {
  const fs = await import("fs");
  const path = await import("path");

  try {
    let articles: Article[] = [];

    // Récupérer les articles
    if (options.apiKey) {
      const { ContentAPIAdapter } = await import("../adapters/contentApi");
      const api = new ContentAPIAdapter({
        apiKey: options.apiKey,
        ...(options.apiUrl ? { baseUrl: options.apiUrl } : {}),
      });
      const rawArticles = await api.getAllArticles();
      articles = rawArticles.map((a) => ContentAPIAdapter.transformArticle(a));
    } else {
      // Fallback : essayer l'API locale (peut ne pas fonctionner au build)
      console.warn(
        "⚠️ No Content API configured, sitemap will only include static pages",
      );
    }

    const sitemap = await generateStaticSitemap({
      siteUrl: options.siteUrl,
      blogPath: options.blogPath || "/blog",
      fetchArticles: async () => articles,
      additionalPages: (options.additionalPages || []).map((p) => ({
        path: p.path,
        priority: p.priority,
        changefreq: p.changefreq as any,
      })),
    });

    const outputPath =
      options.outputPath || path.join(process.cwd(), "public", "sitemap.xml");
    fs.writeFileSync(outputPath, sitemap, "utf-8");

    console.log(`✅ Sitemap generated: ${outputPath}`);
  } catch (error) {
    console.error("❌ Error generating sitemap:", error);
  }
}

/**
 * Génère à la fois le sitemap.xml et le robots.txt au build time
 * Fonction complète pour la génération SEO automatique
 *
 * @example
 * ```typescript
 * // scripts/generate-seo.js
 * const { generateBuildTimeSEO } = require("@nexifi/mdx-blog");
 *
 * generateBuildTimeSEO({
 *   siteUrl: "https://example.com",
 *   apiKey: process.env.CONTENT_API_KEY,
 *   blogPath: "/actualites",
 *   staticPages: [
 *     { path: "/", priority: 1.0, changefreq: "daily" },
 *     { path: "/services", priority: 0.9, changefreq: "weekly" },
 *   ],
 *   dynamicPages: entitySlugs.map(slug => ({
 *     path: `/entities/${slug}`,
 *     priority: 0.9,
 *     changefreq: "weekly"
 *   })),
 *   disallowPaths: ["/admin/*", "/api/*"],
 * });
 * ```
 */
export async function generateBuildTimeSEO(
  config: BuildTimeSEOConfig,
): Promise<{
  sitemap: string;
  robots: string;
  stats: {
    staticPages: number;
    dynamicPages: number;
    articles: number;
    total: number;
  };
}> {
  const fs = await import("fs");
  const path = await import("path");

  const {
    siteUrl,
    apiUrl,
    apiKey,
    blogPath = "/blog",
    outputDir = path.join(process.cwd(), "public"),
    staticPages = [],
    dynamicPages = [],
    disallowPaths = ["/admin/*", "/api/*"],
    allowPaths = ["/"],
    crawlDelay,
  } = config;

  const baseUrl = siteUrl.replace(/\/$/, "");
  const now = new Date().toISOString().split("T")[0];

  console.log("\n🚀 Génération des fichiers SEO...\n");
  console.log(`📍 Site URL: ${baseUrl}`);
  console.log(`📁 Dossier de sortie: ${outputDir}\n`);

  // Récupérer les articles depuis l'API
  let articles: Article[] = [];
  if (apiKey) {
    try {
      const { ContentAPIAdapter } = await import("../adapters/contentApi");
      const api = new ContentAPIAdapter({
        apiKey: apiKey,
        ...(apiUrl ? { baseUrl: apiUrl } : {}),
      });
      console.log("📚 Récupération des articles depuis l'API...");
      const rawArticles = await api.getAllArticles();
      articles = rawArticles.map((a) => ContentAPIAdapter.transformArticle(a));
      console.log(`✅ ${articles.length} articles récupérés\n`);
    } catch (error) {
      console.warn(
        "⚠️ Erreur API, les articles ne seront pas inclus:",
        (error as Error).message,
      );
    }
  } else {
    console.warn("⚠️ Configuration API manquante, pas d'articles inclus\n");
  }

  // Construire les entrées du sitemap
  const entries: Array<{
    loc: string;
    lastmod: string;
    changefreq: string;
    priority: number;
  }> = [];

  // 1. Pages statiques
  console.log("📄 Ajout des pages statiques...");
  staticPages.forEach((page) => {
    entries.push({
      loc: `${baseUrl}${page.path}`,
      lastmod: now,
      changefreq: page.changefreq || "weekly",
      priority: page.priority || 0.7,
    });
  });

  // 2. Dynamic pages
  console.log("🔗 Ajout des pages dynamiques...");
  dynamicPages.forEach((page) => {
    entries.push({
      loc: `${baseUrl}${page.path}`,
      lastmod: page.lastmod || now,
      changefreq: page.changefreq || "weekly",
      priority: page.priority || 0.8,
    });
  });

  // 3. Articles
  console.log("📰 Ajout des articles...");
  articles.forEach((article) => {
    const articleDate = article.date ? article.date.split("T")[0] : now;
    entries.push({
      loc: `${baseUrl}${blogPath}/${article.slug}`,
      lastmod: articleDate,
      changefreq: "weekly",
      priority: 0.8,
    });
  });

  // Générer le XML du sitemap
  const sitemapXML = buildSitemapXMLFromEntries(entries);

  // Générer le robots.txt
  const robotsTxt = generateRobotsTxt(siteUrl, {
    sitemapPath: "/sitemap.xml",
    disallowPaths,
    allowPaths,
    crawlDelay,
  });

  // Générer llms.txt si configuré
  let llmsTxt = "";
  let llmsFullTxt = "";
  const { llmsConfig } = config;
  if (llmsConfig) {
    const result = generateLlmsTxt(llmsConfig, articles, baseUrl, blogPath);
    llmsTxt = result.llmsTxt;
    llmsFullTxt = result.llmsFullTxt;
  }

  // Écrire les fichiers
  const sitemapPath = path.join(outputDir, "sitemap.xml");
  const robotsPath = path.join(outputDir, "robots.txt");

  fs.writeFileSync(sitemapPath, sitemapXML, "utf-8");
  fs.writeFileSync(robotsPath, robotsTxt, "utf-8");

  if (llmsConfig) {
    fs.writeFileSync(path.join(outputDir, "llms.txt"), llmsTxt, "utf-8");
    fs.writeFileSync(
      path.join(outputDir, "llms-full.txt"),
      llmsFullTxt,
      "utf-8",
    );
  }

  const stats = {
    staticPages: staticPages.length,
    dynamicPages: dynamicPages.length,
    articles: articles.length,
    total: entries.length,
  };

  console.log("\n📊 Résumé:");
  console.log(`   - Pages statiques: ${stats.staticPages}`);
  console.log(`   - Pages dynamiques: ${stats.dynamicPages}`);
  console.log(`   - Articles: ${stats.articles}`);
  console.log(`   - Total URLs: ${stats.total}`);
  console.log("\n✅ sitemap.xml créé");
  console.log("✅ robots.txt créé");
  if (llmsConfig) {
    console.log("✅ llms.txt créé");
    console.log("✅ llms-full.txt créé");
  }
  console.log("\n✨ Génération SEO terminée avec succès!\n");

  return {
    sitemap: sitemapXML,
    robots: robotsTxt,
    stats,
  };
}

/**
 * Helper pour construire le XML du sitemap à partir des entrées
 */
function buildSitemapXMLFromEntries(
  entries: Array<{
    loc: string;
    lastmod?: string;
    changefreq?: string;
    priority?: number;
  }>,
): string {
  const urls = entries
    .map((entry) => {
      let url = `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>`;
      if (entry.lastmod) {
        url += `\n    <lastmod>${escapeXml(entry.lastmod)}</lastmod>`;
      }
      if (entry.changefreq) {
        url += `\n    <changefreq>${escapeXml(entry.changefreq)}</changefreq>`;
      }
      if (entry.priority !== undefined) {
        url += `\n    <priority>${entry.priority.toFixed(1)}</priority>`;
      }
      url += `\n  </url>`;
      return url;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

/**
 * Génère les fichiers llms.txt et llms-full.txt
 */
function generateLlmsTxt(
  config: LlmsConfig,
  articles: Article[],
  baseUrl: string,
  blogPath: string,
): { llmsTxt: string; llmsFullTxt: string } {
  const { name, description, contact, services, contentPages, fullContent } =
    config;

  // Configurable section headers
  const entitySectionTitle = config.entitySectionTitle ?? "Entities";
  const contactLinks = config.contactLinks ?? [];

  // === llms.txt (version concise) ===
  let llms = `# ${name}\n\n> ${description}\n`;

  if (contact) {
    llms += `\n## Key Information\n\n`;
    if (contact.phone) llms += `- **Phone** : ${contact.phone}\n`;
    if (contact.email) llms += `- **Email** : ${contact.email}\n`;
    if (contact.address) llms += `- **Address** : ${contact.address}\n`;
    if (contact.hours) llms += `- **Hours** : ${contact.hours}\n`;
    if (fullContent?.certifications?.length) {
      llms += `- **Certifications** : ${fullContent.certifications.join(", ")}\n`;
    }
  }

  if (services?.length) {
    llms += `\n## Services\n\n`;
    services.forEach((s) => {
      llms += `- [${s.title}](${s.url})`;
      if (s.description) llms += ` : ${s.description}`;
      llms += `\n`;
    });
  }

  if (fullContent?.entityDetails?.length) {
    llms += `\n## ${entitySectionTitle}\n\n`;
    fullContent.entityDetails.forEach((p) => {
      llms += `- [${p.name}](${p.url})`;
      if (p.description) llms += ` : ${p.description}`;
      llms += `\n`;
    });
  }

  if (contentPages?.length) {
    llms += `\n## Guides & Resources\n\n`;
    contentPages.forEach((p) => {
      llms += `- [${p.title}](${p.url})`;
      if (p.description) llms += ` : ${p.description}`;
      llms += `\n`;
    });
  }

  if (articles.length > 0) {
    llms += `\n## Blog\n\n`;
    llms += `- [Tous les articles](${baseUrl}${blogPath}) : ${articles.length} articles\n`;
  }

  if (contact) {
    llms += `\n## Contact\n\n`;
    contactLinks.forEach((link) => {
      llms += `- [${link.label}](${link.url})\n`;
    });
    if (contactLinks.length === 0) {
      if (contact.phone) llms += `- **Phone** : ${contact.phone}\n`;
      if (contact.email) llms += `- **Email** : ${contact.email}\n`;
    }
  }

  llms += `\n## Informations complémentaires\n\n`;
  llms += `- [Version détaillée pour LLMs](${baseUrl}/llms-full.txt)\n`;

  // === llms-full.txt (version détaillée) ===
  let full = `# ${name} — Informations complètes\n\n> ${description}\n`;

  full += `\n---\n\n## À propos\n\n`;
  if (fullContent?.about) {
    full += `${fullContent.about}\n\n`;
  }
  if (contact) {
    if (contact.phone) full += `- **Phone** : ${contact.phone}\n`;
    if (contact.email) full += `- **Email** : ${contact.email}\n`;
    if (contact.address) full += `- **Address** : ${contact.address}\n`;
    if (contact.hours) full += `- **Hours** : ${contact.hours}\n`;
    if (contact.whatsapp) full += `- **WhatsApp** : ${contact.whatsapp}\n`;
    full += `- **Site web** : ${baseUrl}\n`;
  }
  if (fullContent?.certifications?.length) {
    full += `- **Certifications** : ${fullContent.certifications.join(", ")}\n`;
  }
  if (fullContent?.serviceArea) {
    full += `\n### Service Area\n\n${fullContent.serviceArea}\n`;
  }
  if (fullContent?.process?.length) {
    full += `\n### Process\n\n`;
    fullContent.process.forEach((p, i) => {
      full += `${i + 1}. **${p.step}** — ${p.description}\n`;
    });
  }

  if (services?.length) {
    full += `\n---\n\n## Services\n\n`;
    services.forEach((s) => {
      full += `### ${s.title}\n\n`;
      if (s.url) full += `URL : ${s.url}\n\n`;
      if (s.description) full += `${s.description}\n\n`;
    });
  }

  if (fullContent?.entityDetails?.length) {
    full += `---\n\n## ${entitySectionTitle}\n\n`;
    fullContent.entityDetails.forEach((p) => {
      full += `### ${p.name}\n\n`;
      if (p.url) full += `URL : ${p.url}\n\n`;
      full += `${p.description}\n\n`;
      if (p.signs) full += `**Signs** : ${p.signs}\n\n`;
      if (p.methods) full += `**Methods** : ${p.methods}\n\n`;
    });
  }

  if (contentPages?.length) {
    full += `---\n\n## Guides & Resources\n\n`;
    contentPages.forEach((p) => {
      full += `### ${p.title}\n\n`;
      if (p.url) full += `URL : ${p.url}\n\n`;
      if (p.description) full += `${p.description}\n\n`;
    });
  }

  if (articles.length > 0) {
    full += `---\n\n## Blog — Articles\n\n`;
    full += `URL : ${baseUrl}${blogPath}\n\n`;
    full += `${articles.length} articles :\n\n`;
    articles.forEach((a) => {
      full += `- [${a.title}](${baseUrl}${blogPath}/${a.slug})\n`;
    });
  }

  if (fullContent?.faq?.length) {
    full += `\n---\n\n## FAQ\n\n`;
    fullContent.faq.forEach((f) => {
      full += `**${f.question}**\n${f.answer}\n\n`;
    });
  }

  if (contact) {
    full += `---\n\n## Contact\n\n`;
    if (contact.phone) full += `- **Phone** : ${contact.phone}\n`;
    if (contact.email) full += `- **Email** : ${contact.email}\n`;
    if (contact.whatsapp) full += `- **WhatsApp** : ${contact.whatsapp}\n`;
    if (contact.address) full += `- **Address** : ${contact.address}\n`;
    contactLinks.forEach((link) => {
      full += `- **${link.label}** : ${link.url}\n`;
    });
  }

  return { llmsTxt: llms, llmsFullTxt: full };
}

export default generateStaticSitemap;
