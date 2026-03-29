/**
 * Security utilities for the @nexifi/mdx-blog package
 */

/**
 * Safely serialize data for use in JSON-LD <script> tags.
 * Escapes `</script>` sequences to prevent XSS injection.
 */
export function safeJsonLd(data: object): string {
  return JSON.stringify(data, null, 0)
    .replace(/<\//g, "<\\/")
    .replace(/<!--/g, "<\\!--")
    .replace(/-->/g, "--\\>")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/**
 * Validates and sanitizes a slug parameter.
 * Only allows alphanumeric characters, hyphens, and underscores.
 * Throws an error if the slug contains unsafe characters.
 */
export function sanitizeSlug(slug: string): string {
  if (!slug || typeof slug !== "string") {
    throw new Error("Slug must be a non-empty string");
  }

  // Remove leading/trailing whitespace
  const trimmed = slug.trim();

  // Check for path traversal attempts
  if (
    trimmed.includes("..") ||
    trimmed.includes("/") ||
    trimmed.includes("\\")
  ) {
    throw new Error("Invalid slug: contains path traversal characters");
  }

  // Only allow alphanumeric, hyphens, underscores
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(trimmed)) {
    throw new Error(
      "Invalid slug: contains invalid characters. Only alphanumeric, hyphens, and underscores are allowed.",
    );
  }

  return trimmed;
}

/**
 * Fetch wrapper with timeout support using AbortController.
 *
 * @param url - The URL to fetch
 * @param options - Standard RequestInit options
 * @param timeoutMs - Timeout in milliseconds (default: 10000)
 * @returns The fetch Response
 * @throws Error if the request times out or fails
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = 10000,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
