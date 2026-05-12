import { describe, it, expect } from "vitest";
import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  OrganizationSchema,
  WebSiteSchema,
  PersonSchema,
  FAQSchema,
  HowToSchema,
  AboutPageSchema,
} from "./SiteSchemas";

function getJsonLd(container: HTMLElement): any[] {
  return Array.from(
    container.querySelectorAll('script[type="application/ld+json"]'),
  ).map((s) => JSON.parse(s.textContent || "{}"));
}

describe("OrganizationSchema", () => {
  it("emits Organization with logo, contact, sameAs", () => {
    const { container } = render(
      <OrganizationSchema
        config={{
          siteUrl: "https://example.com",
          siteName: "Example",
          logoUrl: "/logo.png",
          description: "We do things",
          sameAs: ["https://twitter.com/example"],
          contact: { email: "hi@example.com", contactType: "support" },
        }}
      />,
    );
    const [data] = getJsonLd(container);
    expect(data["@type"]).toBe("Organization");
    expect(data["@id"]).toBe("https://example.com#organization");
    expect(data.logo.url).toBe("https://example.com/logo.png");
    expect(data.sameAs).toContain("https://twitter.com/example");
    expect(data.contactPoint.email).toBe("hi@example.com");
  });
});

describe("WebSiteSchema", () => {
  it("emits WebSite + SearchAction when searchUrlTemplate provided", () => {
    const { container } = render(
      <WebSiteSchema
        config={{
          siteUrl: "https://example.com",
          siteName: "Example",
          searchUrlTemplate: "/search?q={search_term_string}",
        }}
      />,
    );
    const [data] = getJsonLd(container);
    expect(data["@type"]).toBe("WebSite");
    expect(data.potentialAction["@type"]).toBe("SearchAction");
    expect(data.potentialAction.target.urlTemplate).toBe(
      "https://example.com/search?q={search_term_string}",
    );
  });
});

describe("PersonSchema", () => {
  it("emits Person with sameAs", () => {
    const { container } = render(
      <PersonSchema
        config={{
          url: "https://example.com/author/jane",
          name: "Jane Doe",
          jobTitle: "Author",
          sameAs: ["https://linkedin.com/in/jane"],
        }}
      />,
    );
    const [data] = getJsonLd(container);
    expect(data["@type"]).toBe("Person");
    expect(data.name).toBe("Jane Doe");
    expect(data.sameAs[0]).toContain("linkedin.com");
  });
});

describe("FAQSchema", () => {
  it("renders null when faqs empty", () => {
    const { container } = render(<FAQSchema faqs={[]} />);
    expect(container.querySelector("script")).toBeNull();
  });

  it("emits FAQPage with mainEntity", () => {
    const { container } = render(
      <FAQSchema
        faqs={[{ question: "Why?", answer: "Because." }]}
        url="https://example.com/blog/x"
      />,
    );
    const [data] = getJsonLd(container);
    expect(data["@type"]).toBe("FAQPage");
    expect(data.mainEntity[0]["@type"]).toBe("Question");
    expect(data.mainEntity[0].acceptedAnswer.text).toBe("Because.");
  });
});

describe("HowToSchema", () => {
  it("renders null with fewer than 2 steps", () => {
    const { container } = render(<HowToSchema name="x" steps={[]} />);
    expect(container.querySelector("script")).toBeNull();
  });

  it("emits HowTo with ordered steps", () => {
    const { container } = render(
      <HowToSchema
        name="Setup"
        steps={[
          { name: "Install", text: "npm i" },
          { name: "Configure", text: "Edit config" },
        ]}
      />,
    );
    const [data] = getJsonLd(container);
    expect(data["@type"]).toBe("HowTo");
    expect(data.step[0].position).toBe(1);
    expect(data.step[1].name).toBe("Configure");
  });
});

describe("AboutPageSchema", () => {
  it("emits AboutPage referencing Organization", () => {
    const { container } = render(
      <AboutPageSchema
        config={{ siteUrl: "https://example.com", siteName: "Example" }}
      />,
    );
    const [data] = getJsonLd(container);
    expect(data["@type"]).toBe("AboutPage");
    expect(data.about["@id"]).toBe("https://example.com#organization");
  });
});
