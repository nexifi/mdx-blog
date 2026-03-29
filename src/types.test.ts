import { describe, it, expect } from "vitest";
import { ArticleMetadataSchema } from "./types";
import type { ValidationError } from "./types";

describe("ArticleMetadataSchema", () => {
  describe("parse", () => {
    it("should parse valid data", () => {
      const result = ArticleMetadataSchema.parse({
        title: "Mon article",
        date: "2024-01-15",
        category: "Guide",
      });
      expect(result.title).toBe("Mon article");
      expect(result.date).toBe("2024-01-15");
      expect(result.category).toBe("Guide");
      expect(result.published).toBe(true);
    });

    it("should fill defaults for missing fields", () => {
      const result = ArticleMetadataSchema.parse({});
      expect(result.title).toBe("");
      expect(result.category).toBe("Guide");
      expect(result.published).toBe(true);
      // date should default to ISO string
      expect(result.date).toBeTruthy();
    });

    it("should preserve optional fields when provided", () => {
      const result = ArticleMetadataSchema.parse({
        title: "Test",
        date: "2024-01-01",
        category: "News",
        excerpt: "A short excerpt",
        author: "John",
        authorTitle: "Editor",
        authorImage: "/img/john.jpg",
        image: "/img/hero.webp",
        imageWidth: 1200,
        imageHeight: 630,
        imageBlurDataURL: "data:image/jpeg;base64,abc",
        tags: ["tag1", "tag2"],
        readTime: 5,
        published: false,
        status: "draft",
      });
      expect(result.excerpt).toBe("A short excerpt");
      expect(result.author).toBe("John");
      expect(result.authorTitle).toBe("Editor");
      expect(result.image).toBe("/img/hero.webp");
      expect(result.imageWidth).toBe(1200);
      expect(result.imageHeight).toBe(630);
      expect(result.imageBlurDataURL).toBe("data:image/jpeg;base64,abc");
      expect(result.tags).toEqual(["tag1", "tag2"]);
      expect(result.readTime).toBe(5);
      expect(result.published).toBe(false);
      expect(result.status).toBe("draft");
    });

    it("should set published=true when published is not explicitly false", () => {
      expect(
        ArticleMetadataSchema.parse({ published: undefined }).published,
      ).toBe(true);
      expect(ArticleMetadataSchema.parse({ published: true }).published).toBe(
        true,
      );
      expect(ArticleMetadataSchema.parse({ published: false }).published).toBe(
        false,
      );
    });
  });

  describe("validate", () => {
    it("should return valid=true for valid data", () => {
      const result = ArticleMetadataSchema.validate({
        title: "Mon article",
        date: "2024-01-15",
        category: "Guide",
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should return error for missing title", () => {
      const result = ArticleMetadataSchema.validate({
        date: "2024-01-15",
        category: "Guide",
      });
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e: ValidationError) => e.field === "title"),
      ).toBe(true);
    });

    it("should return error for empty title", () => {
      const result = ArticleMetadataSchema.validate({
        title: "  ",
        date: "2024-01-15",
        category: "Guide",
      });
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e: ValidationError) => e.field === "title"),
      ).toBe(true);
    });

    it("should return error for missing date", () => {
      const result = ArticleMetadataSchema.validate({
        title: "Test",
        category: "Guide",
      });
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e: ValidationError) => e.field === "date"),
      ).toBe(true);
    });

    it("should return error for invalid date format", () => {
      const result = ArticleMetadataSchema.validate({
        title: "Test",
        date: "not-a-date",
        category: "Guide",
      });
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e: ValidationError) => e.field === "date"),
      ).toBe(true);
    });

    it("should return error for missing category", () => {
      const result = ArticleMetadataSchema.validate({
        title: "Test",
        date: "2024-01-15",
      });
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e: ValidationError) => e.field === "category"),
      ).toBe(true);
    });

    it("should return error for non-array tags", () => {
      const result = ArticleMetadataSchema.validate({
        title: "Test",
        date: "2024-01-15",
        category: "Guide",
        tags: "not-an-array",
      });
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e: ValidationError) => e.field === "tags"),
      ).toBe(true);
    });

    it("should return error for non-number readTime", () => {
      const result = ArticleMetadataSchema.validate({
        title: "Test",
        date: "2024-01-15",
        category: "Guide",
        readTime: "five",
      });
      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e: ValidationError) => e.field === "readTime"),
      ).toBe(true);
    });

    it("should return multiple errors at once", () => {
      const result = ArticleMetadataSchema.validate({});
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3); // title, date, category
    });

    it("should always return parsed data even with errors", () => {
      const result = ArticleMetadataSchema.validate({});
      expect(result.data).toBeDefined();
      expect(result.data.title).toBe("");
    });
  });
});
