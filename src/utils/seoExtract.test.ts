import { describe, it, expect } from "vitest";
import {
  extractFAQsFromMarkdown,
  extractHowToFromMarkdown,
  isQuestionHeading,
  parseMarkdownSections,
} from "./seoExtract";

describe("isQuestionHeading", () => {
  it("detects FR question by trailing ?", () => {
    expect(isQuestionHeading("Pourquoi utiliser MDX")).toBe(true); // "Pourquoi" starts
    expect(isQuestionHeading("C'est utile vraiment ?")).toBe(true);
  });

  it("detects EN question by trailing ?", () => {
    expect(isQuestionHeading("Why use MDX?")).toBe(true);
    expect(isQuestionHeading("What is JSON-LD")).toBe(true);
  });

  it("rejects non-questions", () => {
    expect(isQuestionHeading("Introduction")).toBe(false);
    expect(isQuestionHeading("Conclusion")).toBe(false);
  });
});

describe("parseMarkdownSections", () => {
  it("splits by headings and ignores fenced code", () => {
    const md = `# Title\n\nIntro paragraph.\n\n## Section A\n\nBody A.\n\n\`\`\`\n## not a heading\n\`\`\`\n\n## Section B\nBody B.`;
    const sections = parseMarkdownSections(md);
    const headings = sections.map((s) => s.heading);
    expect(headings).toEqual(["Title", "Section A", "Section B"]);
  });

  it("returns empty array for empty input", () => {
    expect(parseMarkdownSections("")).toEqual([]);
  });
});

describe("extractFAQsFromMarkdown", () => {
  it("extracts FAQ entries from H2 questions", () => {
    const md = `# Guide

## Qu'est-ce que JSON-LD ?

JSON-LD est un format de données structurées léger basé sur JSON. Il permet aux moteurs de recherche et aux IA de comprendre le contenu d'une page sans avoir à exécuter du JavaScript. Ajouter du JSON-LD est l'une des optimisations SEO les plus efficaces pour la visibilité moderne.

## Conclusion

Voilà.
`;
    const faqs = extractFAQsFromMarkdown(md);
    expect(faqs).toHaveLength(1);
    expect(faqs[0].question).toBe("Qu'est-ce que JSON-LD ?");
    expect(faqs[0].answer).toContain("JSON-LD est un format");
  });

  it("truncates answers to maxWords", () => {
    const longParagraph = Array.from({ length: 220 }, (_, i) => `word${i}`).join(" ");
    const md = `## Why is this useful?\n\n${longParagraph}`;
    const faqs = extractFAQsFromMarkdown(md, { maxWords: 50 });
    expect(faqs[0].answer.split(/\s+/).length).toBeLessThanOrEqual(51);
    expect(faqs[0].answer.endsWith("…")).toBe(true);
  });

  it("drops answers below minWords", () => {
    const md = `## What is X?\n\nShort.`;
    expect(extractFAQsFromMarkdown(md)).toEqual([]);
  });

  it("returns [] when no question headings", () => {
    const md = `# Title\n\n## Plain section\n\nA paragraph that is long enough to count as ${Array.from({ length: 20 }, () => "x").join(" ")}.`;
    expect(extractFAQsFromMarkdown(md)).toEqual([]);
  });

  it("respects maxItems cap", () => {
    const filler = "Lorem ipsum dolor sit amet ".repeat(10);
    const md = Array.from(
      { length: 15 },
      (_, i) => `## Question ${i + 1} ?\n\n${filler}`,
    ).join("\n\n");
    const faqs = extractFAQsFromMarkdown(md, { maxItems: 5 });
    expect(faqs).toHaveLength(5);
  });

  it("handles null/undefined gracefully", () => {
    expect(extractFAQsFromMarkdown(null)).toEqual([]);
    expect(extractFAQsFromMarkdown(undefined)).toEqual([]);
    expect(extractFAQsFromMarkdown("")).toEqual([]);
  });
});

describe("extractHowToFromMarkdown", () => {
  it("returns [] without enough step headings", () => {
    const md = `## Étape 1 — Faire X\n\nDo X.`;
    expect(extractHowToFromMarkdown(md)).toEqual([]);
  });

  it("extracts steps when minimum reached", () => {
    const md = `## Étape 1 — Installer

Installer le package.

## Étape 2 — Configurer

Configurer le provider.

## Étape 3 — Déployer

Pousser en production.`;
    const steps = extractHowToFromMarkdown(md);
    expect(steps).toHaveLength(3);
    expect(steps[0].name).toContain("Étape 1");
    expect(steps[0].text).toContain("Installer le package");
  });
});
