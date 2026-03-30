import { describe, it, expect } from "vitest";
import { renderMarkdown, renderMarkdownSync } from "./markdown";

describe("renderMarkdown", () => {
  it("should convert basic Markdown to HTML", async () => {
    const html = await renderMarkdown("# Hello World");
    expect(html).toContain("<h1>");
    expect(html).toContain("Hello World");
  });

  it("should handle GFM tables", async () => {
    const md = `| Col A | Col B |\n|-------|-------|\n| 1     | 2     |`;
    const html = await renderMarkdown(md);
    expect(html).toContain("<table>");
    expect(html).toContain("<th>");
  });

  it("should handle bold and italic", async () => {
    const html = await renderMarkdown("**bold** and *italic*");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
  });

  it("should handle lists", async () => {
    const html = await renderMarkdown("- item 1\n- item 2\n- item 3");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>");
  });

  it("should handle links", async () => {
    const html = await renderMarkdown("[click](https://example.com)");
    expect(html).toContain('<a href="https://example.com"');
    expect(html).toContain("click");
  });

  it("should handle code blocks", async () => {
    const html = await renderMarkdown("```js\nconst x = 1;\n```");
    expect(html).toContain("<code");
    expect(html).toContain("const x = 1;");
  });

  it("should return empty string for empty input", async () => {
    expect(await renderMarkdown("")).toBe("");
    expect(await renderMarkdown(null as unknown as string)).toBe("");
    expect(await renderMarkdown(undefined as unknown as string)).toBe("");
  });

  it("should respect breaks option", async () => {
    const withBreaks = await renderMarkdown("line1\nline2", { breaks: true });
    expect(withBreaks).toContain("<br");

    const withoutBreaks = await renderMarkdown("line1\nline2", {
      breaks: false,
    });
    expect(withoutBreaks).not.toContain("<br");
  });

  it("should handle complex Markdown without throwing", async () => {
    const complex = `
# Title

## Section 1

Some paragraph with **bold**, *italic*, and \`code\`.

- List item 1
- List item 2
  - Nested item

> Blockquote text

| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |

[Link](https://example.com)

---

### Section 2

1. Ordered item 1
2. Ordered item 2
`;
    const html = await renderMarkdown(complex);
    expect(html).toContain("<h1>");
    expect(html).toContain("<h2>");
    expect(html).toContain("<h3>");
    expect(html).toContain("<table>");
    expect(html).toContain("<blockquote>");
    expect(html).toContain("<ol>");
    expect(html).toContain("<hr");
  });
});

describe("renderMarkdownSync", () => {
  it("should convert basic Markdown to HTML", () => {
    const html = renderMarkdownSync("# Hello World");
    expect(html).toContain("<h1>");
    expect(html).toContain("Hello World");
  });

  it("should handle GFM tables", () => {
    const md = `| Col A | Col B |\n|-------|-------|\n| 1     | 2     |`;
    const html = renderMarkdownSync(md);
    expect(html).toContain("<table>");
  });

  it("should return empty string for empty input", () => {
    expect(renderMarkdownSync("")).toBe("");
    expect(renderMarkdownSync(null as unknown as string)).toBe("");
    expect(renderMarkdownSync(undefined as unknown as string)).toBe("");
  });

  it("should handle bold and italic", () => {
    const html = renderMarkdownSync("**bold** and *italic*");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>italic</em>");
  });

  it("should respect breaks option", () => {
    const html = renderMarkdownSync("line1\nline2", { breaks: true });
    expect(html).toContain("<br");
  });

  it("should produce same output as async version for simple input", async () => {
    const input = "# Test\n\nParagraph with **bold**.";
    const asyncHtml = await renderMarkdown(input);
    const syncHtml = renderMarkdownSync(input);
    expect(asyncHtml).toBe(syncHtml);
  });
});
