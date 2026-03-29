import { describe, it, expect } from "vitest";
import { safeJsonLd, sanitizeSlug, fetchWithTimeout } from "./security";

describe("safeJsonLd", () => {
  it("should serialize an object to JSON", () => {
    const data = { name: "Test", value: 42 };
    const result = safeJsonLd(data);
    expect(result).toBe('{"name":"Test","value":42}');
  });

  it("should escape </script> tags to prevent XSS", () => {
    const data = { content: '</script><script>alert("xss")</script>' };
    const result = safeJsonLd(data);
    expect(result).not.toContain("</script>");
    expect(result).toContain("<\\/script>");
  });

  it("should handle nested </script> in values", () => {
    const data = { a: { b: "</Script>" } };
    const result = safeJsonLd(data);
    expect(result.toLowerCase()).not.toContain("</script>");
  });

  it("should handle empty objects", () => {
    expect(safeJsonLd({})).toBe("{}");
  });

  it("should handle arrays", () => {
    const data = ["</script>", "safe"];
    const result = safeJsonLd(data);
    expect(result).not.toContain("</script>");
  });
  it("should escape HTML comment closing sequences", () => {
    const data = { content: "value --> other" };
    const result = safeJsonLd(data);
    expect(result).not.toContain("-->");
    expect(result).toContain("--\\>");
  });

  it("should escape Unicode line separators", () => {
    const data = { content: "line\u2028separator\u2029end" };
    const result = safeJsonLd(data);
    expect(result).not.toContain("\u2028");
    expect(result).not.toContain("\u2029");
    expect(result).toContain("\\u2028");
    expect(result).toContain("\\u2029");
  });
});

describe("sanitizeSlug", () => {
  it("should accept valid slugs", () => {
    expect(sanitizeSlug("my-article")).toBe("my-article");
    expect(sanitizeSlug("hello-world-123")).toBe("hello-world-123");
    expect(sanitizeSlug("article")).toBe("article");
  });

  it("should reject path traversal attempts", () => {
    expect(() => sanitizeSlug("../etc/passwd")).toThrow();
    expect(() => sanitizeSlug("..%2F..%2Fetc")).toThrow();
    expect(() => sanitizeSlug("../../secret")).toThrow();
  });

  it("should reject slugs with special characters", () => {
    expect(() => sanitizeSlug("hello world")).toThrow();
    expect(() => sanitizeSlug("hello/world")).toThrow();
    expect(() => sanitizeSlug("<script>")).toThrow();
  });

  it("should reject empty slugs", () => {
    expect(() => sanitizeSlug("")).toThrow();
  });

  it("should accept slugs with numbers", () => {
    expect(sanitizeSlug("5-tips")).toBe("5-tips");
    expect(sanitizeSlug("article-2024")).toBe("article-2024");
  });
  it("should not leak user input in error messages", () => {
    try {
      sanitizeSlug("<script>alert(1)</script>");
    } catch (e) {
      expect((e as Error).message).not.toContain("<script>");
    }
  });
});

describe("fetchWithTimeout", () => {
  it("should be a function", () => {
    expect(typeof fetchWithTimeout).toBe("function");
  });

  it("should not leak URL in timeout error messages", async () => {
    // Mock fetch to simulate an abort
    const originalFetch = globalThis.fetch;
    globalThis.fetch = () =>
      new Promise((_, reject) => {
        const err = new Error("The operation was aborted");
        err.name = "AbortError";
        setTimeout(() => reject(err), 5);
      });

    try {
      await expect(
        fetchWithTimeout("https://secret-api.com/key=abc123", {}, 1),
      ).rejects.toThrow("timed out");

      await expect(
        fetchWithTimeout("https://secret-api.com/key=abc123", {}, 1),
      ).rejects.not.toThrow("secret-api");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
