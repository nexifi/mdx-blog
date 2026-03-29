import { describe, it, expect } from "vitest";
import {
  resolveImageUrl,
  generateSrcSet,
  generateSizes,
  computeHeight,
  getOGImageDimensions,
  buildImageObject,
  isExternalImage,
  getExternalOrigin,
  DEFAULT_WIDTHS,
  ASPECT_RATIOS,
} from "./image";

describe("resolveImageUrl", () => {
  it("should return empty string for empty src", () => {
    expect(resolveImageUrl("")).toBe("");
  });

  it("should return absolute URLs unchanged", () => {
    expect(resolveImageUrl("https://cdn.example.com/img.webp")).toBe(
      "https://cdn.example.com/img.webp",
    );
    expect(resolveImageUrl("http://cdn.example.com/img.webp")).toBe(
      "http://cdn.example.com/img.webp",
    );
    expect(resolveImageUrl("//cdn.example.com/img.webp")).toBe(
      "//cdn.example.com/img.webp",
    );
  });

  it("should return data URIs unchanged", () => {
    const dataUri = "data:image/png;base64,abc123";
    expect(resolveImageUrl(dataUri)).toBe(dataUri);
  });

  it("should resolve relative paths with siteUrl", () => {
    expect(resolveImageUrl("/img/hero.webp", "https://example.com")).toBe(
      "https://example.com/img/hero.webp",
    );
  });

  it("should resolve paths without leading slash", () => {
    expect(resolveImageUrl("img/hero.webp", "https://example.com")).toBe(
      "https://example.com/img/hero.webp",
    );
  });

  it("should strip trailing slash from siteUrl", () => {
    expect(resolveImageUrl("/img/hero.webp", "https://example.com/")).toBe(
      "https://example.com/img/hero.webp",
    );
  });

  it("should return relative path as-is without siteUrl", () => {
    expect(resolveImageUrl("/img/hero.webp")).toBe("/img/hero.webp");
  });
});

describe("generateSrcSet", () => {
  it("should generate srcset with default widths", () => {
    const srcSet = generateSrcSet("/img/hero.webp");
    expect(srcSet).toContain("640w");
    expect(srcSet).toContain("1024w");
    expect(srcSet).toContain("1280w");
  });

  it("should use custom widths", () => {
    const srcSet = generateSrcSet("/img/hero.webp", [320, 640]);
    expect(srcSet).toBe("/img/hero.webp?w=320 320w, /img/hero.webp?w=640 640w");
  });

  it("should use custom loader", () => {
    const srcSet = generateSrcSet("/img/hero.webp", [640], {
      loader: ({ src, width }) => `https://cdn.test/w_${width}/${src}`,
    });
    expect(srcSet).toBe("https://cdn.test/w_640//img/hero.webp 640w");
  });

  it("should append to existing query params", () => {
    const srcSet = generateSrcSet("/img/hero.webp?format=webp", [640]);
    expect(srcSet).toBe("/img/hero.webp?format=webp&w=640 640w");
  });
});

describe("generateSizes", () => {
  it("should return 100vw for empty breakpoints", () => {
    expect(generateSizes()).toBe("100vw");
    expect(generateSizes({})).toBe("100vw");
  });

  it("should generate media queries from breakpoint map", () => {
    const sizes = generateSizes({ sm: "100vw", md: "50vw", lg: "33vw" });
    expect(sizes).toContain("(max-width: 640px) 100vw");
    expect(sizes).toContain("(max-width: 768px) 50vw");
    expect(sizes).toContain("33vw");
  });
});

describe("computeHeight", () => {
  it("should compute height from width and aspect ratio", () => {
    expect(computeHeight(1600, 16 / 9)).toBe(900);
    expect(computeHeight(1200, ASPECT_RATIOS.og)).toBe(630);
  });

  it("should round to nearest integer", () => {
    expect(computeHeight(1000, 3)).toBe(333);
  });
});

describe("getOGImageDimensions", () => {
  it("should return provided dimensions", () => {
    expect(
      getOGImageDimensions({ src: "/img.webp", width: 800, height: 400 }),
    ).toEqual({ width: 800, height: 400 });
  });

  it("should return default OG dimensions when not provided", () => {
    expect(getOGImageDimensions()).toEqual({ width: 1200, height: 630 });
    expect(getOGImageDimensions({ src: "/img.webp" })).toEqual({
      width: 1200,
      height: 630,
    });
  });
});

describe("buildImageObject", () => {
  it("should build JSON-LD ImageObject", () => {
    const result = buildImageObject(
      { src: "/img/hero.webp", width: 1200, height: 630 },
      "https://example.com",
    );
    expect(result).toEqual({
      "@type": "ImageObject",
      url: "https://example.com/img/hero.webp",
      width: 1200,
      height: 630,
    });
  });

  it("should include encoding format when type provided", () => {
    const result = buildImageObject({ src: "/img.webp", type: "image/webp" });
    expect(result).toEqual({
      "@type": "ImageObject",
      url: "/img.webp",
      encodingFormat: "image/webp",
    });
  });

  it("should return undefined for empty src", () => {
    expect(buildImageObject({ src: "" })).toBeUndefined();
  });
});

describe("isExternalImage", () => {
  it("should return true for different origins", () => {
    expect(
      isExternalImage("https://cdn.other.com/img.webp", "https://example.com"),
    ).toBe(true);
  });

  it("should return false for same origin", () => {
    expect(
      isExternalImage("https://example.com/img.webp", "https://example.com"),
    ).toBe(false);
  });

  it("should return false for relative URLs", () => {
    expect(isExternalImage("/img/hero.webp", "https://example.com")).toBe(
      false,
    );
  });

  it("should return false without siteUrl", () => {
    expect(isExternalImage("https://cdn.example.com/img.webp")).toBe(false);
  });
});

describe("getExternalOrigin", () => {
  it("should return origin for absolute URL", () => {
    expect(getExternalOrigin("https://cdn.example.com/img.webp")).toBe(
      "https://cdn.example.com",
    );
  });

  it("should return null for relative URL", () => {
    expect(getExternalOrigin("/img/hero.webp")).toBeNull();
  });

  it("should return null for empty/falsy input", () => {
    expect(getExternalOrigin("")).toBeNull();
  });
});

describe("constants", () => {
  it("DEFAULT_WIDTHS should contain standard breakpoints", () => {
    expect(DEFAULT_WIDTHS).toContain(640);
    expect(DEFAULT_WIDTHS).toContain(1024);
    expect(DEFAULT_WIDTHS).toContain(1280);
  });

  it("ASPECT_RATIOS should contain standard ratios", () => {
    expect(ASPECT_RATIOS.widescreen).toBeCloseTo(16 / 9);
    expect(ASPECT_RATIOS.square).toBe(1);
    expect(ASPECT_RATIOS.og).toBeCloseTo(1200 / 630);
  });
});
