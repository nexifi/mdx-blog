import { describe, it, expect } from "vitest";
import { generateRSSFeed, generateAtomFeed } from "./rss";
import type { Article } from "../types";

const mockArticles: Article[] = [
  {
    slug: "article-1",
    title: "Premier article",
    date: "2024-06-15T10:00:00Z",
    category: "Guide",
    excerpt: "Un résumé du premier article",
    author: "Jean Dupont",
    tags: ["nuisibles", "prévention"],
    image: "/img/article-1.webp",
    content: "<p>Contenu complet</p>",
    published: true,
  },
  {
    slug: "article-2",
    title: "Deuxième article",
    date: "2024-06-10T08:00:00Z",
    category: "Actualité",
    excerpt: "Un résumé du deuxième",
    published: true,
  },
  {
    slug: "article-draft",
    title: "Draft non publié",
    date: "2024-06-01",
    category: "Draft",
    published: false,
  },
];

const baseConfig = {
  siteUrl: "https://example.com",
  title: "Mon Blog",
  description: "Les derniers articles de mon blog",
};

describe("generateRSSFeed", () => {
  it("should generate valid RSS 2.0 XML", () => {
    const rss = generateRSSFeed(mockArticles, baseConfig);
    expect(rss).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(rss).toContain('<rss version="2.0"');
    expect(rss).toContain("<channel>");
    expect(rss).toContain("</channel>");
    expect(rss).toContain("</rss>");
  });

  it("should include channel metadata", () => {
    const rss = generateRSSFeed(mockArticles, baseConfig);
    expect(rss).toContain("<title>Mon Blog</title>");
    expect(rss).toContain(
      "<description>Les derniers articles de mon blog</description>",
    );
    expect(rss).toContain("<language>fr</language>");
  });

  it("should include published articles", () => {
    const rss = generateRSSFeed(mockArticles, baseConfig);
    expect(rss).toContain("<title>Premier article</title>");
    expect(rss).toContain("<title>Deuxième article</title>");
  });

  it("should exclude unpublished articles", () => {
    const rss = generateRSSFeed(mockArticles, baseConfig);
    expect(rss).not.toContain("Draft non publié");
  });

  it("should include article links with blog path", () => {
    const rss = generateRSSFeed(mockArticles, {
      ...baseConfig,
      blogPath: "/actualites",
    });
    expect(rss).toContain("https://example.com/actualites/article-1");
  });

  it("should include excerpts as description", () => {
    const rss = generateRSSFeed(mockArticles, baseConfig);
    expect(rss).toContain("Un résumé du premier article");
  });

  it("should include content:encoded for articles with content", () => {
    const rss = generateRSSFeed(mockArticles, baseConfig);
    expect(rss).toContain("<content:encoded>");
    expect(rss).toContain("Contenu complet");
  });

  it("should include author via dc:creator", () => {
    const rss = generateRSSFeed(mockArticles, {
      ...baseConfig,
      defaultAuthor: "Équipe",
    });
    expect(rss).toContain("<dc:creator>Jean Dupont</dc:creator>");
    expect(rss).toContain("<dc:creator>Équipe</dc:creator>");
  });

  it("should include categories and tags", () => {
    const rss = generateRSSFeed(mockArticles, baseConfig);
    expect(rss).toContain("<category>Guide</category>");
    expect(rss).toContain("<category>nuisibles</category>");
  });

  it("should include media for articles with images", () => {
    const rss = generateRSSFeed(mockArticles, baseConfig);
    expect(rss).toContain("media:content");
    expect(rss).toContain("https://example.com/img/article-1.webp");
  });

  it("should include atom:link self reference", () => {
    const rss = generateRSSFeed(mockArticles, baseConfig);
    expect(rss).toContain('rel="self"');
    expect(rss).toContain("application/rss+xml");
  });

  it("should respect maxItems", () => {
    const rss = generateRSSFeed(mockArticles, { ...baseConfig, maxItems: 1 });
    // Only first published article (sorted by date desc)
    expect(rss).toContain("Premier article");
    expect(rss).not.toContain("Deuxième article");
  });

  it("should include copyright when provided", () => {
    const rss = generateRSSFeed(mockArticles, {
      ...baseConfig,
      copyright: "© 2024 Test",
    });
    expect(rss).toContain("<copyright>© 2024 Test</copyright>");
  });

  it("should include image/logo when provided", () => {
    const rss = generateRSSFeed(mockArticles, {
      ...baseConfig,
      imageUrl: "/img/logo.png",
    });
    expect(rss).toContain("<image>");
    expect(rss).toContain("https://example.com/img/logo.png");
  });

  it("should strip trailing slash from siteUrl", () => {
    const rss = generateRSSFeed(mockArticles, {
      ...baseConfig,
      siteUrl: "https://example.com/",
    });
    expect(rss).not.toContain("https://example.com//");
  });
});

describe("generateAtomFeed", () => {
  it("should generate valid Atom 1.0 XML", () => {
    const atom = generateAtomFeed(mockArticles, baseConfig);
    expect(atom).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(atom).toContain('<feed xmlns="http://www.w3.org/2005/Atom"');
    expect(atom).toContain("</feed>");
  });

  it("should include feed metadata", () => {
    const atom = generateAtomFeed(mockArticles, baseConfig);
    expect(atom).toContain("<title>Mon Blog</title>");
    expect(atom).toContain(
      "<subtitle>Les derniers articles de mon blog</subtitle>",
    );
  });

  it("should include published articles as entries", () => {
    const atom = generateAtomFeed(mockArticles, baseConfig);
    expect(atom).toContain("<entry>");
    expect(atom).toContain("<title>Premier article</title>");
    expect(atom).toContain("<title>Deuxième article</title>");
  });

  it("should exclude unpublished articles", () => {
    const atom = generateAtomFeed(mockArticles, baseConfig);
    expect(atom).not.toContain("Draft non publié");
  });

  it("should include self link", () => {
    const atom = generateAtomFeed(mockArticles, baseConfig);
    expect(atom).toContain('rel="self"');
    expect(atom).toContain("application/atom+xml");
  });

  it("should include author name", () => {
    const atom = generateAtomFeed(mockArticles, {
      ...baseConfig,
      defaultAuthor: "Team",
    });
    expect(atom).toContain("<name>Jean Dupont</name>");
    expect(atom).toContain("<name>Team</name>");
  });

  it("should include summary from excerpt", () => {
    const atom = generateAtomFeed(mockArticles, baseConfig);
    expect(atom).toContain("<summary>Un résumé du premier article</summary>");
  });

  it("should include category terms", () => {
    const atom = generateAtomFeed(mockArticles, baseConfig);
    expect(atom).toContain('term="Guide"');
    expect(atom).toContain('term="nuisibles"');
  });

  it("should use custom feedId", () => {
    const atom = generateAtomFeed(mockArticles, {
      ...baseConfig,
      feedId: "urn:blog:test",
    });
    expect(atom).toContain("<id>urn:blog:test</id>");
  });
});

describe("CDATA security", () => {
  it("should escape ]]> sequences in RSS content to prevent CDATA breakout", () => {
    const maliciousArticles: Article[] = [
      {
        slug: "xss-test",
        title: "Test",
        date: "2024-06-15T10:00:00Z",
        category: "Test",
        content:
          "<p>Hello]]></content:encoded><item><title>INJECTED</title></item><content:encoded><![CDATA[</p>",
        published: true,
      },
    ];

    const rss = generateRSSFeed(maliciousArticles, {
      siteUrl: "https://example.com",
      title: "Test",
      description: "Test",
    });

    // The ]]> should be escaped, so no raw CDATA breakout
    expect(rss).not.toContain("]]></content:encoded><item>");
    expect(rss).toContain("]]]]><![CDATA[>");
  });

  it("should escape ]]> sequences in Atom content", () => {
    const maliciousArticles: Article[] = [
      {
        slug: "xss-test",
        title: "Test",
        date: "2024-06-15T10:00:00Z",
        category: "Test",
        content: "breakout]]>injected",
        published: true,
      },
    ];

    const atom = generateAtomFeed(maliciousArticles, {
      siteUrl: "https://example.com",
      title: "Test",
      description: "Test",
    });

    expect(atom).not.toMatch(/]]>[^<]*injected/);
    expect(atom).toContain("]]]]><![CDATA[>");
  });
});
