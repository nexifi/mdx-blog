import { describe, it, expect } from "vitest";
import {
  generateSitemap,
  buildSitemapXML,
  generateRobotsTxt,
  getArticleSitemapEntries,
} from "./sitemap";
import { Article } from "../types";

const mockArticle: Article = {
  slug: "test-article",
  title: "Test Article",
  date: "2024-01-15",
  category: "Test",
  excerpt: "A test article",
  content: "Hello world",
};

describe("generateSitemap", () => {
  it("should generate valid XML", () => {
    const result = generateSitemap([mockArticle], {
      siteUrl: "https://example.com",
      blogPath: "/blog",
    });
    expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(result).toContain("<urlset");
    expect(result).toContain("</urlset>");
  });

  it("should include blog path and article slug", () => {
    const result = generateSitemap([mockArticle], {
      siteUrl: "https://example.com",
      blogPath: "/blog",
    });
    expect(result).toContain("https://example.com/blog/test-article");
  });

  it("should include blog index page", () => {
    const result = generateSitemap([], {
      siteUrl: "https://example.com",
      blogPath: "/blog",
    });
    expect(result).toContain("https://example.com/blog");
  });

  it("should strip trailing slash from siteUrl", () => {
    const result = generateSitemap([mockArticle], {
      siteUrl: "https://example.com/",
      blogPath: "/blog",
    });
    expect(result).not.toContain("https://example.com//blog");
  });

  it("should escape XML special characters in URLs", () => {
    const article: Article = {
      ...mockArticle,
      slug: "test&article",
    };
    const result = generateSitemap([article], {
      siteUrl: "https://example.com",
      blogPath: "/blog",
    });
    expect(result).toContain("test&amp;article");
  });

  it("should filter out unpublished articles", () => {
    const articles: Article[] = [
      mockArticle,
      { ...mockArticle, slug: "draft", published: false },
    ];
    const result = generateSitemap(articles, {
      siteUrl: "https://example.com",
      blogPath: "/blog",
    });
    expect(result).toContain("test-article");
    expect(result).not.toContain("draft");
  });
});

describe("generateRobotsTxt", () => {
  it("should include sitemap URL", () => {
    const result = generateRobotsTxt("https://example.com");
    expect(result).toContain("Sitemap: https://example.com/sitemap.xml");
  });

  it("should include User-agent", () => {
    const result = generateRobotsTxt("https://example.com");
    expect(result).toContain("User-agent: *");
  });

  it("should include disallow paths", () => {
    const result = generateRobotsTxt("https://example.com", {
      disallowPaths: ["/admin/*", "/api/*"],
    });
    expect(result).toContain("Disallow: /admin/*");
    expect(result).toContain("Disallow: /api/*");
  });

  it("should reference @nexifi/mdx-blog", () => {
    const result = generateRobotsTxt("https://example.com");
    expect(result).toContain("@nexifi/mdx-blog");
  });
});

describe("getArticleSitemapEntries", () => {
  it("should return entries with correct paths", () => {
    const entries = getArticleSitemapEntries([mockArticle], "/blog");
    expect(entries).toHaveLength(1);
    expect(entries[0].loc).toBe("/blog/test-article");
  });

  it("should use default /blog path", () => {
    const entries = getArticleSitemapEntries([mockArticle]);
    expect(entries[0].loc).toBe("/blog/test-article");
  });

  it("should filter unpublished articles", () => {
    const entries = getArticleSitemapEntries([
      mockArticle,
      { ...mockArticle, slug: "draft", published: false },
    ]);
    expect(entries).toHaveLength(1);
  });
});

describe("buildSitemapXML", () => {
  it("should build valid XML with entries", () => {
    const xml = buildSitemapXML([
      { loc: "https://example.com/page1", priority: 0.8 },
    ]);
    expect(xml).toContain("https://example.com/page1");
    expect(xml).toContain("<priority>0.8</priority>");
  });
});
