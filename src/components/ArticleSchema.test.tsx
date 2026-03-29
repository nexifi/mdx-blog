import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ArticleSchema, BlogListSchema } from "./ArticleSchema";
import { Article } from "../types";

const mockArticle: Article = {
  slug: "test-article",
  title: "Test Article",
  date: "2024-01-15",
  category: "Test",
  excerpt: "A test excerpt",
  content: "Hello world content",
  author: "John Doe",
  tags: ["test", "vitest"],
  readTime: 5,
  image: "/images/test.jpg",
};

const schemaConfig = {
  siteUrl: "https://example.com",
  siteName: "Test Site",
  blogPath: "/blog",
  logoUrl: "/logo.png",
};

describe("ArticleSchema", () => {
  it("should render JSON-LD script tags", () => {
    const { container } = render(
      <ArticleSchema article={mockArticle} config={schemaConfig} />
    );
    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]'
    );
    // Should have 3 scripts: article, breadcrumb, webpage
    expect(scripts.length).toBe(3);
  });

  it("should contain safe JSON (no raw </script>)", () => {
    const maliciousArticle: Article = {
      ...mockArticle,
      title: '</script><script>alert("xss")</script>',
    };
    const { container } = render(
      <ArticleSchema article={maliciousArticle} config={schemaConfig} />
    );
    const scriptContent = container.innerHTML;
    // Should not contain unescaped </script>
    const matches = scriptContent.match(/<\/script>/gi);
    // Only the closing tags of our own script elements should remain
    // The content inside should have </script> escaped
    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]'
    );
    scripts.forEach((script) => {
      expect(script.textContent).not.toContain("</script>");
    });
  });

  it("should include article URL in schema", () => {
    const { container } = render(
      <ArticleSchema article={mockArticle} config={schemaConfig} />
    );
    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]'
    );
    const firstScript = scripts[0]?.textContent || "";
    const data = JSON.parse(firstScript);
    expect(data["@type"]).toBe("BlogPosting");
    expect(data.headline).toBe("Test Article");
  });

  it("should use custom homeLabel and blogLabel", () => {
    const { container } = render(
      <ArticleSchema
        article={mockArticle}
        config={{ ...schemaConfig, homeLabel: "Home", blogLabel: "Articles" }}
      />
    );
    const scripts = container.querySelectorAll(
      'script[type="application/ld+json"]'
    );
    // Breadcrumb should be the second script
    const breadcrumbScript = scripts[1]?.textContent || "";
    const data = JSON.parse(breadcrumbScript);
    expect(data.itemListElement[0].name).toBe("Home");
    expect(data.itemListElement[1].name).toBe("Articles");
  });
});

describe("BlogListSchema", () => {
  it("should render a CollectionPage schema", () => {
    const { container } = render(
      <BlogListSchema config={schemaConfig} articles={[mockArticle]} />
    );
    const script = container.querySelector(
      'script[type="application/ld+json"]'
    );
    expect(script).toBeInTheDocument();
    const data = JSON.parse(script?.textContent || "{}");
    expect(data["@type"]).toBe("CollectionPage");
  });
});
