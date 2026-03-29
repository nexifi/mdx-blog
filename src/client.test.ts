import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BlogApiClient } from "./client";

describe("BlogApiClient", () => {
  let client: BlogApiClient;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    client = new BlogApiClient({
      endpoints: {
        articles: "/api/articles",
        article: "/api/articles/:slug",
      },
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("should create an instance", () => {
    expect(client).toBeDefined();
  });

  it("should return null for invalid slugs in getArticle", async () => {
    const result = await client.getArticle("../etc/passwd");
    expect(result).toBeNull();
  });

  it("should return null for slugs with special characters", async () => {
    const result = await client.getArticle("<script>");
    expect(result).toBeNull();
  });

  it("should accept valid slugs format", async () => {
    // This will fail with network error but slug validation should pass
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify({ slug: "test" })));

    await client.getArticle("valid-slug");
    expect(fetchSpy).toHaveBeenCalled();

    fetchSpy.mockRestore();
  });
});
