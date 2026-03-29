import { describe, it, expect } from "vitest";
import { escapeXml } from "./xml";

describe("escapeXml", () => {
  it("should escape ampersands", () => {
    expect(escapeXml("A & B")).toBe("A &amp; B");
  });

  it("should escape angle brackets", () => {
    expect(escapeXml("<tag>")).toBe("&lt;tag&gt;");
  });

  it("should escape double quotes", () => {
    expect(escapeXml('say "hello"')).toBe("say &quot;hello&quot;");
  });

  it("should escape single quotes", () => {
    expect(escapeXml("it's")).toBe("it&apos;s");
  });

  it("should escape all special characters together", () => {
    expect(escapeXml('<a href="x">&</a>')).toBe(
      "&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;",
    );
  });

  it("should handle empty strings", () => {
    expect(escapeXml("")).toBe("");
  });

  it("should pass through safe strings unchanged", () => {
    expect(escapeXml("Hello World 123")).toBe("Hello World 123");
  });
});
