/**
 * Image utilities for @nexifi/mdx-blog
 *
 * Provides helpers for URL resolution, responsive srcset generation,
 * and image dimension handling.
 */

/**
 * Standard responsive breakpoints (widths in px)
 */
export const DEFAULT_WIDTHS = [320, 480, 640, 768, 1024, 1280, 1536] as const;

/**
 * Common image aspect ratios
 */
export const ASPECT_RATIOS = {
  /** 16:9 — standard widescreen */
  widescreen: 16 / 9,
  /** 4:3 — traditional */
  standard: 4 / 3,
  /** 3:2 — classic photography */
  photo: 3 / 2,
  /** 1:1 — square */
  square: 1,
  /** 2:3 — portrait */
  portrait: 2 / 3,
  /** Open Graph recommended: 1200×630 */
  og: 1200 / 630,
} as const;

/**
 * Image source configuration for responsive images
 */
export interface ImageSource {
  /** Image URL or path */
  src: string;
  /** Explicit width (px) */
  width?: number;
  /** Explicit height (px) */
  height?: number;
  /** Blur data URL for placeholder (base64 or data URI) */
  blurDataURL?: string;
  /** MIME type (e.g., "image/webp") */
  type?: string;
}

/**
 * Configuration for the image loader function
 */
export interface ImageLoaderParams {
  src: string;
  width: number;
  quality?: number;
}

/**
 * Image loader function signature (compatible with next/image)
 */
export type ImageLoader = (params: ImageLoaderParams) => string;

/**
 * Resolve a possibly-relative image URL to an absolute URL.
 *
 * @example
 * ```ts
 * resolveImageUrl("/img/hero.webp", "https://example.com")
 * // => "https://example.com/img/hero.webp"
 *
 * resolveImageUrl("https://cdn.example.com/hero.webp", "https://example.com")
 * // => "https://cdn.example.com/hero.webp" (unchanged — already absolute)
 * ```
 */
export function resolveImageUrl(src: string, siteUrl?: string): string {
  if (!src) return "";
  // Already absolute
  if (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("//")
  ) {
    return src;
  }
  // Data URI — return as-is
  if (src.startsWith("data:")) {
    return src;
  }
  if (siteUrl) {
    const base = siteUrl.replace(/\/+$/, "");
    const path = src.startsWith("/") ? src : `/${src}`;
    return `${base}${path}`;
  }
  return src;
}

/**
 * Generate a srcset string from a list of widths using an image loader.
 *
 * @example
 * ```ts
 * const srcSet = generateSrcSet("/img/hero.webp", [640, 1024, 1280]);
 * // => "/img/hero.webp?w=640 640w, /img/hero.webp?w=1024 1024w, /img/hero.webp?w=1280 1280w"
 *
 * // With a custom loader (e.g., Cloudinary)
 * const srcSet = generateSrcSet("/img/hero.webp", [640, 1024], {
 *   loader: ({ src, width }) => `https://res.cloudinary.com/demo/image/fetch/w_${width}/${src}`,
 * });
 * ```
 */
export function generateSrcSet(
  src: string,
  widths: readonly number[] | number[] = DEFAULT_WIDTHS,
  options: {
    loader?: ImageLoader;
    quality?: number;
  } = {},
): string {
  const { loader, quality = 75 } = options;

  return widths
    .map((w) => {
      const url = loader
        ? loader({ src, width: w, quality })
        : appendWidthParam(src, w);
      return `${url} ${w}w`;
    })
    .join(", ");
}

/**
 * Generate a `sizes` attribute string from breakpoints.
 *
 * @example
 * ```ts
 * generateSizes({ sm: "100vw", md: "50vw", lg: "33vw" })
 * // => "(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
 * ```
 */
export function generateSizes(
  breakpoints: Record<string, string> = {},
): string {
  const bp: Record<string, number> = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
  };

  const entries = Object.entries(breakpoints);
  if (entries.length === 0) return "100vw";

  const parts: string[] = [];
  let lastValue = "100vw";

  for (const [key, value] of entries) {
    const maxWidth = bp[key];
    if (maxWidth) {
      parts.push(`(max-width: ${maxWidth}px) ${value}`);
    }
    lastValue = value;
  }

  // Last entry acts as the default (no media query)
  if (parts.length > 0) {
    parts.push(lastValue);
  }

  return parts.join(", ") || "100vw";
}

/**
 * Compute height from width + aspect ratio
 */
export function computeHeight(width: number, aspectRatio: number): number {
  return Math.round(width / aspectRatio);
}

/**
 * Build Open Graph image meta dimensions.
 * Uses article-provided dimensions, or falls back to standard OG size (1200×630).
 */
export function getOGImageDimensions(image?: ImageSource): {
  width: number;
  height: number;
} {
  if (image?.width && image?.height) {
    return { width: image.width, height: image.height };
  }
  // Standard OG recommended size
  return { width: 1200, height: 630 };
}

/**
 * Build a JSON-LD ImageObject from an image source.
 *
 * @example
 * ```ts
 * buildImageObject({ src: "/img/hero.webp", width: 1200, height: 630 }, "https://example.com")
 * // => { "@type": "ImageObject", url: "https://example.com/img/hero.webp", width: 1200, height: 630 }
 * ```
 */
export function buildImageObject(
  image: ImageSource,
  siteUrl?: string,
): Record<string, unknown> | undefined {
  if (!image?.src) return undefined;

  const url = resolveImageUrl(image.src, siteUrl);
  const obj: Record<string, unknown> = {
    "@type": "ImageObject",
    url,
  };

  if (image.width) obj.width = image.width;
  if (image.height) obj.height = image.height;
  if (image.type) obj.encodingFormat = image.type;

  return obj;
}

/**
 * Check if a URL points to an external domain (different from siteUrl)
 */
export function isExternalImage(src: string, siteUrl?: string): boolean {
  if (!src || !siteUrl) return false;
  if (!src.startsWith("http")) return false;
  try {
    const imgOrigin = new URL(src).origin;
    const siteOrigin = new URL(siteUrl).origin;
    return imgOrigin !== siteOrigin;
  } catch {
    return false;
  }
}

/**
 * Get external image origin for `<link rel="preconnect">` hints
 */
export function getExternalOrigin(src: string): string | null {
  if (!src?.startsWith("http")) return null;
  try {
    return new URL(src).origin;
  } catch {
    return null;
  }
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function appendWidthParam(src: string, width: number): string {
  // If the URL already has query params, append &w=; otherwise ?w=
  const separator = src.includes("?") ? "&" : "?";
  return `${src}${separator}w=${width}`;
}
