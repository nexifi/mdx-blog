import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Article } from "../types";
import { generateLlmsTxt, LlmsConfig } from "../utils/staticSitemap";

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

const baseLlmsConfig: LlmsConfig = {
  name: "Test Site",
  description: "A great site for testing.",
};

describe("generateLlmsTxt", () => {
  it("should generate basic llms.txt with name and description", () => {
    const { llmsTxt, llmsFullTxt } = generateLlmsTxt(
      baseLlmsConfig,
      [],
      "https://example.com",
      "/blog",
    );

    expect(llmsTxt).toContain("# Test Site");
    expect(llmsTxt).toContain("> A great site for testing.");
    expect(llmsFullTxt).toContain("# Test Site");
    expect(llmsFullTxt).toContain("> A great site for testing.");
  });

  it("should include contact info", () => {
    const config: LlmsConfig = {
      ...baseLlmsConfig,
      contact: {
        phone: "+33 1 23 45 67 89",
        email: "hello@example.com",
        address: "123 Rue de Paris",
        hours: "9h-18h",
      },
    };

    const { llmsTxt, llmsFullTxt } = generateLlmsTxt(
      config,
      [],
      "https://example.com",
      "/blog",
    );

    expect(llmsTxt).toContain("+33 1 23 45 67 89");
    expect(llmsTxt).toContain("hello@example.com");
    expect(llmsTxt).toContain("123 Rue de Paris");
    expect(llmsFullTxt).toContain("+33 1 23 45 67 89");
    expect(llmsFullTxt).toContain("hello@example.com");
  });

  it("should include services", () => {
    const config: LlmsConfig = {
      ...baseLlmsConfig,
      services: [
        { title: "Service A", url: "https://example.com/a", description: "Desc A" },
        { title: "Service B", url: "https://example.com/b" },
      ],
    };

    const { llmsTxt, llmsFullTxt } = generateLlmsTxt(
      config,
      [],
      "https://example.com",
      "/blog",
    );

    expect(llmsTxt).toContain("## Services");
    expect(llmsTxt).toContain("[Service A](https://example.com/a)");
    expect(llmsTxt).toContain(": Desc A");
    expect(llmsTxt).toContain("[Service B](https://example.com/b)");
    expect(llmsFullTxt).toContain("### Service A");
    expect(llmsFullTxt).toContain("### Service B");
  });

  it("should include articles in blog section", () => {
    const { llmsTxt, llmsFullTxt } = generateLlmsTxt(
      baseLlmsConfig,
      mockArticles,
      "https://example.com",
      "/blog",
    );

    expect(llmsTxt).toContain("## Blog");
    expect(llmsTxt).toContain("2 articles");
    expect(llmsFullTxt).toContain("## Blog");
    expect(llmsFullTxt).toContain("[Article 1](https://example.com/blog/article-1)");
    expect(llmsFullTxt).toContain("[Article 2](https://example.com/blog/article-2)");
  });

  it("should not include blog section when no articles", () => {
    const { llmsTxt } = generateLlmsTxt(
      baseLlmsConfig,
      [],
      "https://example.com",
      "/blog",
    );

    expect(llmsTxt).not.toContain("## Blog");
  });

  it("should include content pages", () => {
    const config: LlmsConfig = {
      ...baseLlmsConfig,
      contentPages: [
        { title: "Guide SEO", url: "https://example.com/guide-seo", description: "All about SEO" },
      ],
    };

    const { llmsTxt, llmsFullTxt } = generateLlmsTxt(
      config,
      [],
      "https://example.com",
      "/blog",
    );

    expect(llmsTxt).toContain("## Guides & Resources");
    expect(llmsTxt).toContain("[Guide SEO](https://example.com/guide-seo)");
    expect(llmsFullTxt).toContain("### Guide SEO");
  });

  it("should include entity details with custom section title", () => {
    const config: LlmsConfig = {
      ...baseLlmsConfig,
      entitySectionTitle: "Nuisibles",
      fullContent: {
        entityDetails: [
          {
            name: "Rats",
            url: "https://example.com/rats",
            description: "Rat control services",
            signs: "Droppings, noises",
            methods: "Traps, bait",
          },
        ],
      },
    };

    const { llmsTxt, llmsFullTxt } = generateLlmsTxt(
      config,
      [],
      "https://example.com",
      "/blog",
    );

    expect(llmsTxt).toContain("## Nuisibles");
    expect(llmsTxt).toContain("[Rats](https://example.com/rats)");
    expect(llmsFullTxt).toContain("## Nuisibles");
    expect(llmsFullTxt).toContain("### Rats");
    expect(llmsFullTxt).toContain("**Signs** : Droppings, noises");
    expect(llmsFullTxt).toContain("**Methods** : Traps, bait");
  });

  it("should include link to llms-full.txt", () => {
    const { llmsTxt } = generateLlmsTxt(
      baseLlmsConfig,
      [],
      "https://example.com",
      "/blog",
    );

    expect(llmsTxt).toContain("[Version détaillée pour LLMs](https://example.com/llms-full.txt)");
  });

  it("should include full content details (about, certifications, process, faq)", () => {
    const config: LlmsConfig = {
      ...baseLlmsConfig,
      contact: { email: "test@example.com" },
      fullContent: {
        about: "We are a company that does things.",
        certifications: ["ISO 9001", "ISO 14001"],
        serviceArea: "Paris and surroundings",
        process: [
          { step: "Inspection", description: "We inspect the area." },
          { step: "Treatment", description: "We apply treatment." },
        ],
        faq: [
          { question: "How long does it take?", answer: "About 2 hours." },
        ],
      },
    };

    const { llmsTxt, llmsFullTxt } = generateLlmsTxt(
      config,
      [],
      "https://example.com",
      "/blog",
    );

    // Certifications appear in concise version too (via contact block)
    expect(llmsTxt).toContain("ISO 9001, ISO 14001");

    // Full version has all details
    expect(llmsFullTxt).toContain("We are a company that does things.");
    expect(llmsFullTxt).toContain("ISO 9001, ISO 14001");
    expect(llmsFullTxt).toContain("Paris and surroundings");
    expect(llmsFullTxt).toContain("1. **Inspection** — We inspect the area.");
    expect(llmsFullTxt).toContain("2. **Treatment** — We apply treatment.");
    expect(llmsFullTxt).toContain("## FAQ");
    expect(llmsFullTxt).toContain("**How long does it take?**");
    expect(llmsFullTxt).toContain("About 2 hours.");
  });

  it("should include contact links", () => {
    const config: LlmsConfig = {
      ...baseLlmsConfig,
      contact: { phone: "+33 1 00 00 00 00" },
      contactLinks: [
        { label: "Book a call", url: "https://example.com/book" },
        { label: "Contact form", url: "https://example.com/contact" },
      ],
    };

    const { llmsTxt, llmsFullTxt } = generateLlmsTxt(
      config,
      [],
      "https://example.com",
      "/blog",
    );

    expect(llmsTxt).toContain("[Book a call](https://example.com/book)");
    expect(llmsTxt).toContain("[Contact form](https://example.com/contact)");
    expect(llmsFullTxt).toContain("**Book a call** : https://example.com/book");
  });
});

describe("LlmsPage", () => {
  it("should export createLlmsServerSideProps", async () => {
    const { createLlmsServerSideProps } = await import("../pages/LlmsPage");
    expect(typeof createLlmsServerSideProps).toBe("function");
  });

  it("should export LlmsPage component", async () => {
    const mod = await import("../pages/LlmsPage");
    expect(typeof mod.default).toBe("function");
    // Page component returns null (content is sent via res.write)
    expect(mod.default()).toBeNull();
  });

  it("should create getServerSideProps that writes llms.txt", async () => {
    const { createLlmsServerSideProps } = await import("../pages/LlmsPage");

    const written: string[] = [];
    const headers: Record<string, string> = {};
    const mockRes = {
      setHeader: (key: string, value: string) => {
        headers[key] = value;
      },
      write: (content: string) => {
        written.push(content);
      },
      end: vi.fn(),
    };

    const gssp = createLlmsServerSideProps({
      siteUrl: "https://example.com",
      blogPath: "/blog",
      llmsConfig: {
        name: "My Site",
        description: "Best site ever.",
      },
    });

    const result = await gssp({
      res: mockRes as any,
      req: {} as any,
      query: {},
      resolvedUrl: "/llms.txt",
    } as any);

    expect(result).toEqual({ props: {} });
    expect(headers["Content-Type"]).toBe("text/plain; charset=utf-8");
    expect(written[0]).toContain("# My Site");
    expect(written[0]).toContain("> Best site ever.");
    expect(mockRes.end).toHaveBeenCalled();
  });

  it("should return llms-full.txt when full=true", async () => {
    const { createLlmsServerSideProps } = await import("../pages/LlmsPage");

    const written: string[] = [];
    const mockRes = {
      setHeader: vi.fn(),
      write: (content: string) => {
        written.push(content);
      },
      end: vi.fn(),
    };

    const gssp = createLlmsServerSideProps({
      siteUrl: "https://example.com",
      blogPath: "/blog",
      full: true,
      llmsConfig: {
        name: "My Site",
        description: "Best site ever.",
      },
    });

    await gssp({
      res: mockRes as any,
      req: {} as any,
      query: {},
      resolvedUrl: "/llms-full.txt",
    } as any);

    // Full version has "Informations complètes" in the title
    expect(written[0]).toContain("Informations complètes");
  });

  it("should return fallback on error", async () => {
    const { createLlmsServerSideProps } = await import("../pages/LlmsPage");

    const written: string[] = [];
    const mockRes = {
      setHeader: vi.fn(),
      write: (content: string) => {
        written.push(content);
      },
      end: vi.fn(),
    };

    // Force error by using contentAPI without proper config
    const gssp = createLlmsServerSideProps({
      siteUrl: "https://example.com",
      blogPath: "/blog",
      useContentAPI: true,
      contentAPIConfig: { apiKey: "ak_invalid" },
      llmsConfig: {
        name: "Fallback Site",
        description: "Fallback description.",
      },
    });

    await gssp({
      res: mockRes as any,
      req: {} as any,
      query: {},
      resolvedUrl: "/llms.txt",
    } as any);

    expect(written[0]).toContain("# Fallback Site");
    expect(written[0]).toContain("> Fallback description.");
  });
});
