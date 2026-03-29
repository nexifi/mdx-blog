import { describe, it, expect, vi } from "vitest";
import { generateStaticSitemap } from "./staticSitemap";
import type { Article } from "../types";

const mockArticles: Article[] = [
  {
    slug: "article-1",
    title: "Article 1",
    date: "2024-06-15",
    category: "Guide",
    published: true,
  },
  {
    slug: "article-2",
    title: "Article 2",
    date: "2024-06-10",
    category: "News",
    published: true,
  },
];

describe("generateStaticSitemap", () => {
  it("should generate sitemap XML with articles", async () => {
    const sitemap = await generateStaticSitemap({
      siteUrl: "https://example.com",
      blogPath: "/blog",
      fetchArticles: async () => mockArticles,
    });

    expect(sitemap).toContain("<?xml");
    expect(sitemap).toContain("<urlset");
    expect(sitemap).toContain("https://example.com/blog/article-1");
    expect(sitemap).toContain("https://example.com/blog/article-2");
    expect(sitemap).toContain("</urlset>");
  });

  it("should include additional pages", async () => {
    const sitemap = await generateStaticSitemap({
      siteUrl: "https://example.com",
      blogPath: "/blog",
      fetchArticles: async () => [],
      additionalPages: [
        { path: "/", priority: 1.0, changefreq: "daily" },
        { path: "/contact", priority: 0.8 },
        { path: "/about", lastmod: "2024-01-01" },
      ],
    });

    expect(sitemap).toContain("https://example.com/");
    expect(sitemap).toContain("<priority>1.0</priority>");
    expect(sitemap).toContain("<changefreq>daily</changefreq>");
    expect(sitemap).toContain("https://example.com/contact");
    expect(sitemap).toContain("https://example.com/about");
    expect(sitemap).toContain("<lastmod>2024-01-01</lastmod>");
  });

  it("should handle empty articles", async () => {
    const sitemap = await generateStaticSitemap({
      siteUrl: "https://example.com",
      blogPath: "/blog",
      fetchArticles: async () => [],
    });

    expect(sitemap).toContain("<?xml");
    expect(sitemap).toContain("<urlset");
    expect(sitemap).toContain("</urlset>");
  });

  it("should strip trailing slash from siteUrl", async () => {
    const sitemap = await generateStaticSitemap({
      siteUrl: "https://example.com/",
      blogPath: "/blog",
      fetchArticles: async () => mockArticles,
    });

    expect(sitemap).not.toContain("https://example.com//");
  });

  it("should call fetchArticles", async () => {
    const fetchArticles = vi.fn().mockResolvedValue(mockArticles);

    await generateStaticSitemap({
      siteUrl: "https://example.com",
      blogPath: "/blog",
      fetchArticles,
    });

    expect(fetchArticles).toHaveBeenCalledOnce();
  });

  it("should propagate errors from fetchArticles", async () => {
    const fetchArticles = vi.fn().mockRejectedValue(new Error("API down"));

    await expect(
      generateStaticSitemap({
        siteUrl: "https://example.com",
        blogPath: "/blog",
        fetchArticles,
      }),
    ).rejects.toThrow("API down");
  });
});
