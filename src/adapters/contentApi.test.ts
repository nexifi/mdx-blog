import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ContentAPIAdapter } from "./contentApi";
import type { ContentAPIConfig } from "./contentApi";

// Mock security utils
vi.mock("../utils/security", () => ({
  sanitizeSlug: (s: string) => s.replace(/[^a-z0-9-]/g, ""),
  fetchWithTimeout: vi.fn(),
}));

// We need to suppress the "window" guard since we're in jsdom.
// The constructor checks `typeof window !== 'undefined'` and throws.
// Override it for testing purposes.
const originalWindow = globalThis.window;
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  // Temporarily remove window to allow server-side instantiation
  // @ts-ignore
  delete globalThis.window;
  // Suppress expected console.error from error handling paths
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  globalThis.window = originalWindow;
  consoleErrorSpy.mockRestore();
});

function createAdapter(overrides: Partial<ContentAPIConfig> = {}) {
  return new ContentAPIAdapter({
    apiKey: "cm_live_test123",
    ...overrides,
  });
}

describe("ContentAPIAdapter", () => {
  describe("constructor", () => {
    it("should create instance with valid cm_live_ key", () => {
      const adapter = createAdapter({ apiKey: "cm_live_abc" });
      expect(adapter).toBeDefined();
    });

    it("should create instance with valid cm_test_ key", () => {
      const adapter = createAdapter({ apiKey: "cm_test_abc" });
      expect(adapter).toBeDefined();
    });

    it("should create instance with valid ak_ key", () => {
      const adapter = createAdapter({ apiKey: "ak_abc123" });
      expect(adapter).toBeDefined();
    });

    it("should throw for missing apiKey", () => {
      expect(() => new ContentAPIAdapter({ apiKey: "" })).toThrow(
        "ContentAPIAdapter requires apiKey",
      );
    });

    it("should throw for invalid apiKey format", () => {
      expect(() => new ContentAPIAdapter({ apiKey: "invalid_key" })).toThrow(
        "Invalid API key format",
      );
    });

    it("should throw in browser environment", () => {
      // Restore window for this test
      globalThis.window = originalWindow;
      expect(() => new ContentAPIAdapter({ apiKey: "cm_live_x" })).toThrow(
        "must only be used server-side",
      );
      // Remove again for subsequent tests
      // @ts-ignore
      delete globalThis.window;
    });

    it("should strip trailing slashes from baseUrl", () => {
      const adapter = createAdapter({ baseUrl: "https://api.test.com///" });
      expect(adapter).toBeDefined();
    });

    it("should handle baseUrl ending with /articles", () => {
      const adapter = createAdapter({
        baseUrl: "https://api.test.com/articles",
      });
      expect(adapter).toBeDefined();
    });
  });

  describe("transformArticle (static)", () => {
    it("should generate slug from title", () => {
      const result = ContentAPIAdapter.transformArticle({
        title: "Mon Article Génial",
        content: "<p>Hello</p>",
      });
      expect(result.slug).toBe("mon-article-genial");
    });

    it("should use id as fallback slug when no title", () => {
      const result = ContentAPIAdapter.transformArticle({
        id: "abc-123",
        content: "",
      });
      expect(result.slug).toBe("abc-123");
    });

    it("should extract category from first tag", () => {
      const result = ContentAPIAdapter.transformArticle({
        title: "Test",
        tags: ["Guide", "Tips"],
      });
      expect(result.category).toBe("Guide");
    });

    it('should default category to "Article"', () => {
      const result = ContentAPIAdapter.transformArticle({
        title: "Test",
      });
      expect(result.category).toBe("Article");
    });

    it("should create excerpt from content when not provided", () => {
      const content = "<p>" + "A".repeat(300) + "</p>";
      const result = ContentAPIAdapter.transformArticle({
        title: "Test",
        content,
      });
      expect(result.excerpt).toContain("...");
      expect(result.excerpt!.length).toBeLessThan(250);
    });

    it("should use excerpt when provided", () => {
      const result = ContentAPIAdapter.transformArticle({
        title: "Test",
        excerpt: "Custom excerpt",
      });
      expect(result.excerpt).toBe("Custom excerpt");
    });

    it("should use metaDescription as excerpt fallback", () => {
      const result = ContentAPIAdapter.transformArticle({
        title: "Test",
        metaDescription: "SEO description",
      });
      expect(result.excerpt).toBe("SEO description");
    });

    it("should use publishedAt for date", () => {
      const result = ContentAPIAdapter.transformArticle({
        title: "Test",
        publishedAt: "2024-06-15",
      });
      expect(result.date).toBe("2024-06-15");
    });

    it("should use createdAt as date fallback", () => {
      const result = ContentAPIAdapter.transformArticle({
        title: "Test",
        createdAt: "2024-01-01",
      });
      expect(result.date).toBe("2024-01-01");
    });

    it("should use featuredImage as image", () => {
      const result = ContentAPIAdapter.transformArticle({
        title: "Test",
        featuredImage: "/img/hero.webp",
      });
      expect(result.image).toBe("/img/hero.webp");
    });

    it('should default author to "Author"', () => {
      const result = ContentAPIAdapter.transformArticle({
        title: "Test",
      });
      expect(result.author).toBe("Author");
    });

    it("should strip accents from slug", () => {
      const result = ContentAPIAdapter.transformArticle({
        title: "Café résumé naïf",
      });
      expect(result.slug).toBe("cafe-resume-naif");
    });
  });

  describe("getAllArticles", () => {
    it("should fetch and filter published articles", async () => {
      const { fetchWithTimeout } = await import("../utils/security");
      const mockFetch = vi.mocked(fetchWithTimeout);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          { title: "Published", status: "published" },
          { title: "Draft", status: "draft" },
          { title: "Ready", status: "ready" },
          { title: "Approved", status: "approved" },
        ],
      } as any);

      const adapter = createAdapter();
      const articles = await adapter.getAllArticles();

      expect(articles).toHaveLength(3);
      expect(articles.map((a: any) => a.title)).toEqual([
        "Published",
        "Ready",
        "Approved",
      ]);
    });

    it("should handle API response with nested data", async () => {
      const { fetchWithTimeout } = await import("../utils/security");
      const mockFetch = vi.mocked(fetchWithTimeout);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            items: [{ title: "Nested", status: "published" }],
          },
        }),
      } as any);

      const adapter = createAdapter();
      const articles = await adapter.getAllArticles();
      expect(articles).toHaveLength(1);
    });

    it("should handle API response with data object (no items)", async () => {
      const { fetchWithTimeout } = await import("../utils/security");
      const mockFetch = vi.mocked(fetchWithTimeout);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: [{ title: "Direct data", status: "published" }],
        }),
      } as any);

      const adapter = createAdapter();
      const articles = await adapter.getAllArticles();
      expect(articles).toHaveLength(1);
      expect(articles[0].title).toBe("Direct data");
    });

    it("should handle API response with articles key", async () => {
      const { fetchWithTimeout } = await import("../utils/security");
      const mockFetch = vi.mocked(fetchWithTimeout);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          articles: [{ title: "Via articles key", status: "ready" }],
        }),
      } as any);

      const adapter = createAdapter();
      const articles = await adapter.getAllArticles();
      expect(articles).toHaveLength(1);
      expect(articles[0].title).toBe("Via articles key");
    });

    it("should return empty array when no matching key found", async () => {
      const { fetchWithTimeout } = await import("../utils/security");
      const mockFetch = vi.mocked(fetchWithTimeout);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ something: "else" }),
      } as any);

      const adapter = createAdapter();
      const articles = await adapter.getAllArticles();
      expect(articles).toHaveLength(0);
    });

    it("should throw on non-ok response", async () => {
      const { fetchWithTimeout } = await import("../utils/security");
      const mockFetch = vi.mocked(fetchWithTimeout);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as any);

      const adapter = createAdapter();
      await expect(adapter.getAllArticles()).rejects.toThrow(
        "Failed to fetch articles",
      );
    });

    it("should throw on 401 unauthorized", async () => {
      const { fetchWithTimeout } = await import("../utils/security");
      const mockFetch = vi.mocked(fetchWithTimeout);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      } as any);

      const adapter = createAdapter();
      await expect(adapter.getAllArticles()).rejects.toThrow(
        "Invalid or expired API key",
      );
    });
  });

  describe("getArticleBySlug", () => {
    it("should return article when direct lookup slug matches", async () => {
      const { fetchWithTimeout } = await import("../utils/security");
      const mockFetch = vi.mocked(fetchWithTimeout);

      // Direct lookup returns an article whose generated slug matches "found"
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { title: "Found" } }),
      } as any);

      const adapter = createAdapter();
      const article = await adapter.getArticleBySlug("found");
      expect(article).toMatchObject({ title: "Found", slug: "found" });
    });

    it("should fallback to list when direct lookup slug does not match", async () => {
      const { fetchWithTimeout } = await import("../utils/security");
      const mockFetch = vi.mocked(fetchWithTimeout);

      // Direct lookup returns an article but its generated slug won't match "my-slug"
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: { title: "Different Title" } }),
      } as any);

      // Fallback: getAllArticles returns a list with a matching article
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [
          { title: "My Slug", status: "published" },
        ],
      } as any);

      const adapter = createAdapter();
      const article = await adapter.getArticleBySlug("my-slug");
      expect(article).toMatchObject({ title: "My Slug", slug: "my-slug" });
    });

    it("should return null when article not found anywhere", async () => {
      const { fetchWithTimeout } = await import("../utils/security");
      const mockFetch = vi.mocked(fetchWithTimeout);

      // Direct lookup: 404
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      } as any);

      // Fallback: getAllArticles returns empty
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      } as any);

      const adapter = createAdapter();
      const article = await adapter.getArticleBySlug("missing");
      expect(article).toBeNull();
    });

    it("should return null on error", async () => {
      const { fetchWithTimeout } = await import("../utils/security");
      const mockFetch = vi.mocked(fetchWithTimeout);

      // Direct lookup throws
      mockFetch.mockRejectedValueOnce(new Error("Network error"));
      // Fallback also throws
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const adapter = createAdapter();
      const article = await adapter.getArticleBySlug("broken");
      expect(article).toBeNull();
    });

    it("should return article directly when no data wrapper and slug matches", async () => {
      const { fetchWithTimeout } = await import("../utils/security");
      const mockFetch = vi.mocked(fetchWithTimeout);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ title: "Direct" }),
      } as any);

      const adapter = createAdapter();
      const article = await adapter.getArticleBySlug("direct");
      expect(article).toMatchObject({ title: "Direct", slug: "direct" });
    });

    it("should return null on non-404 error and empty list fallback", async () => {
      const { fetchWithTimeout } = await import("../utils/security");
      const mockFetch = vi.mocked(fetchWithTimeout);

      // Direct lookup: 500
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      } as any);

      // Fallback: getAllArticles returns empty
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [],
      } as any);

      const adapter = createAdapter();
      const article = await adapter.getArticleBySlug("server-error");
      expect(article).toBeNull();
    });
  });

  describe("updateArticleStatus", () => {
    it("should send PATCH request", async () => {
      const { fetchWithTimeout } = await import("../utils/security");
      const mockFetch = vi.mocked(fetchWithTimeout);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      } as any);

      const adapter = createAdapter();
      await adapter.updateArticleStatus("article-1", "published");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("article-1"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ status: "published" }),
        }),
        expect.any(Number),
      );
    });

    it("should throw on failure", async () => {
      const { fetchWithTimeout } = await import("../utils/security");
      const mockFetch = vi.mocked(fetchWithTimeout);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Server Error",
      } as any);

      const adapter = createAdapter();
      await expect(
        adapter.updateArticleStatus("x", "published"),
      ).rejects.toThrow("Failed to update article");
    });
  });

  describe("instance transformArticle", () => {
    it("should use configured defaultAuthor", () => {
      const adapter = createAdapter({ defaultAuthor: "Blog Team" });
      const result = adapter.transformArticle({ title: "Test" });
      expect(result.author).toBe("Blog Team");
    });
  });
});
