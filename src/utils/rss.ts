import { Article } from "../types";
import { escapeXml } from "./xml";

/**
 * Escapes CDATA end sequences to prevent XML injection.
 * Splits `]]>` into `]]]]><![CDATA[>` so the CDATA section isn't prematurely closed.
 */
function escapeCData(str: string): string {
  return str.replace(/]]>/g, "]]]]><![CDATA[>");
}

/**
 * Configuration pour la génération du flux RSS
 */
export interface RSSConfig {
  /** URL de base du site */
  siteUrl: string;
  /** Titre du flux RSS */
  title: string;
  /** Description du flux */
  description: string;
  /** Chemin du blog (défaut: /blog) */
  blogPath?: string;
  /** Langue du flux (défaut: fr) */
  language?: string;
  /** URL de l'image/logo du site */
  imageUrl?: string;
  /** Nom de l'auteur par défaut */
  defaultAuthor?: string;
  /** Copyright */
  copyright?: string;
  /** Catégories du flux */
  categories?: string[];
  /** Nombre max d'articles (défaut: 50) */
  maxItems?: number;
}

/**
 * Configuration pour le flux Atom
 */
export interface AtomConfig extends RSSConfig {
  /** ID unique du flux (défaut: siteUrl) */
  feedId?: string;
  /** Nom du sous-titre (= description) */
  subtitle?: string;
}

/**
 * Génère un flux RSS 2.0 XML à partir d'articles
 *
 * @example
 * ```typescript
 * // Dans une API route Next.js: pages/api/rss.xml.ts
 * import { generateRSSFeed } from '@nexifi/mdx-blog';
 *
 * export default async function handler(req, res) {
 *   const articles = await getArticles();
 *   const rss = generateRSSFeed(articles, {
 *     siteUrl: 'https://example.com',
 *     title: 'Mon Blog',
 *     description: 'Les derniers articles',
 *     blogPath: '/blog',
 *   });
 *
 *   res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
 *   res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
 *   res.write(rss);
 *   res.end();
 * }
 * ```
 */
export function generateRSSFeed(
  articles: Article[],
  config: RSSConfig,
): string {
  const {
    siteUrl,
    title,
    description,
    blogPath = "/blog",
    language = "fr",
    imageUrl,
    defaultAuthor,
    copyright,
    categories = [],
    maxItems = 50,
  } = config;

  const baseUrl = siteUrl.replace(/\/$/, "");
  const feedUrl = `${baseUrl}/rss.xml`;
  const blogUrl = `${baseUrl}${blogPath}`;

  const publishedArticles = articles
    .filter((a) => a.published !== false)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, maxItems);

  const lastBuildDate =
    publishedArticles.length > 0
      ? formatRFC822Date(publishedArticles[0].date)
      : formatRFC822Date(new Date().toISOString());

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${escapeXml(blogUrl)}</link>
    <description>${escapeXml(description)}</description>
    <language>${language}</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>
    <generator>@nexifi/mdx-blog</generator>`;

  if (copyright) {
    xml += `\n    <copyright>${escapeXml(copyright)}</copyright>`;
  }

  if (imageUrl) {
    xml += `
    <image>
      <url>${escapeXml(imageUrl.startsWith("http") ? imageUrl : `${baseUrl}${imageUrl}`)}</url>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(blogUrl)}</link>
    </image>`;
  }

  for (const cat of categories) {
    xml += `\n    <category>${escapeXml(cat)}</category>`;
  }

  for (const article of publishedArticles) {
    const articleUrl = `${blogUrl}/${article.slug}`;
    const pubDate = formatRFC822Date(article.date);
    const author = article.author || defaultAuthor;

    xml += `
    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${escapeXml(articleUrl)}</link>
      <guid isPermaLink="true">${escapeXml(articleUrl)}</guid>
      <pubDate>${pubDate}</pubDate>`;

    if (article.excerpt) {
      xml += `\n      <description>${escapeXml(article.excerpt)}</description>`;
    }

    if (article.content) {
      xml += `\n      <content:encoded><![CDATA[${escapeCData(article.content)}]]></content:encoded>`;
    }

    if (author) {
      xml += `\n      <dc:creator>${escapeXml(author)}</dc:creator>`;
    }

    if (article.category) {
      xml += `\n      <category>${escapeXml(article.category)}</category>`;
    }

    if (article.tags) {
      for (const tag of article.tags) {
        xml += `\n      <category>${escapeXml(tag)}</category>`;
      }
    }

    if (article.image) {
      const imgUrl = article.image.startsWith("http")
        ? article.image
        : `${baseUrl}${article.image}`;
      xml += `\n      <media:content url="${escapeXml(imgUrl)}" medium="image"/>`;
      xml += `\n      <enclosure url="${escapeXml(imgUrl)}" type="image/jpeg" length="0"/>`;
    }

    xml += `\n    </item>`;
  }

  xml += `
  </channel>
</rss>`;

  return xml;
}

/**
 * Génère un flux Atom 1.0 XML à partir d'articles
 *
 * @example
 * ```typescript
 * const atom = generateAtomFeed(articles, {
 *   siteUrl: 'https://example.com',
 *   title: 'Mon Blog',
 *   description: 'Les derniers articles',
 * });
 * ```
 */
export function generateAtomFeed(
  articles: Article[],
  config: AtomConfig,
): string {
  const {
    siteUrl,
    title,
    description,
    blogPath = "/blog",
    language = "fr",
    feedId,
    maxItems = 50,
    defaultAuthor,
  } = config;

  const baseUrl = siteUrl.replace(/\/$/, "");
  const feedUrl = `${baseUrl}/atom.xml`;
  const blogUrl = `${baseUrl}${blogPath}`;

  const publishedArticles = articles
    .filter((a) => a.published !== false)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, maxItems);

  const updated =
    publishedArticles.length > 0
      ? new Date(publishedArticles[0].date).toISOString()
      : new Date().toISOString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="${language}">
  <title>${escapeXml(title)}</title>
  <subtitle>${escapeXml(description)}</subtitle>
  <link href="${escapeXml(feedUrl)}" rel="self" type="application/atom+xml"/>
  <link href="${escapeXml(blogUrl)}" rel="alternate" type="text/html"/>
  <id>${escapeXml(feedId || baseUrl)}</id>
  <updated>${updated}</updated>
  <generator uri="https://github.com/nexifi-io/mdx-blog">@nexifi/mdx-blog</generator>`;

  for (const article of publishedArticles) {
    const articleUrl = `${blogUrl}/${article.slug}`;
    const articleDate = new Date(article.date).toISOString();
    const author = article.author || defaultAuthor || "Author";

    xml += `
  <entry>
    <title>${escapeXml(article.title)}</title>
    <link href="${escapeXml(articleUrl)}" rel="alternate" type="text/html"/>
    <id>${escapeXml(articleUrl)}</id>
    <published>${articleDate}</published>
    <updated>${articleDate}</updated>
    <author>
      <name>${escapeXml(author)}</name>
    </author>`;

    if (article.excerpt) {
      xml += `\n    <summary>${escapeXml(article.excerpt)}</summary>`;
    }

    if (article.content) {
      xml += `\n    <content type="html"><![CDATA[${escapeCData(article.content)}]]></content>`;
    }

    if (article.category) {
      xml += `\n    <category term="${escapeXml(article.category)}"/>`;
    }

    if (article.tags) {
      for (const tag of article.tags) {
        xml += `\n    <category term="${escapeXml(tag)}"/>`;
      }
    }

    xml += `\n  </entry>`;
  }

  xml += `\n</feed>`;

  return xml;
}

/**
 * Formats an ISO date string to RFC 822 format (required by RSS 2.0)
 * Example: "Mon, 01 Jan 2024 00:00:00 GMT"
 */
function formatRFC822Date(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return new Date().toUTCString();
    }
    return date.toUTCString();
  } catch {
    return new Date().toUTCString();
  }
}
