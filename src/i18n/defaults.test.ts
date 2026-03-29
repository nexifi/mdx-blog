import { describe, it, expect } from "vitest";
import { defaultLabels, mergeLabels, Labels } from "./defaults";

describe("defaultLabels", () => {
  it("should have all required keys", () => {
    expect(defaultLabels.home).toBe("Accueil");
    expect(defaultLabels.blog).toBe("Blog");
    expect(defaultLabels.readMore).toBe("Lire la suite");
    expect(defaultLabels.loading).toBe("Chargement...");
    expect(defaultLabels.previous).toBe("Précédent");
    expect(defaultLabels.next).toBe("Suivant");
  });

  it("should have working function labels", () => {
    expect(defaultLabels.pageXofY(2, 5)).toBe("Page 2 sur 5");
    expect(defaultLabels.articleCount(1)).toBe("1 article");
    expect(defaultLabels.articleCount(3)).toBe("3 articles");
  });
});

describe("mergeLabels", () => {
  it("should return defaults when no overrides provided", () => {
    const result = mergeLabels();
    expect(result).toBe(defaultLabels);
  });

  it("should return defaults when undefined passed", () => {
    const result = mergeLabels(undefined);
    expect(result).toBe(defaultLabels);
  });

  it("should override specific keys", () => {
    const result = mergeLabels({ home: "Home", blog: "Blog" });
    expect(result.home).toBe("Home");
    expect(result.blog).toBe("Blog");
    // Non-overridden keys should keep defaults
    expect(result.readMore).toBe("Lire la suite");
  });

  it("should override function keys", () => {
    const customPageOf = (c: number, t: number) => `Page ${c} of ${t}`;
    const result = mergeLabels({ pageXofY: customPageOf });
    expect(result.pageXofY(1, 10)).toBe("Page 1 of 10");
  });
});
