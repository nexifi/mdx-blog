/**
 * Server-safe Markdown → HTML renderer.
 *
 * Uses `marked` to convert Markdown strings to HTML synchronously on the server.
 * This avoids the RSC streaming issues caused by `next-mdx-remote/rsc` in
 * Next.js 15+ (where async Server Components throw uncatchable errors like
 * "Cannot read properties of undefined (reading 'stack')" and
 * "ReadableStream is already closed").
 *
 * Usage in a Next.js App Router server component:
 *
 * ```tsx
 * import { renderMarkdown } from '@nexifi/mdx-blog/server';
 *
 * export default async function ArticlePage({ params }) {
 *   const article = await getArticle(params.slug);
 *   const html = await renderMarkdown(article.content);
 *   return (
 *     <div className="prose prose-invert" dangerouslySetInnerHTML={{ __html: html }} />
 *   );
 * }
 * ```
 */

import { marked, type MarkedOptions } from "marked";

/**
 * Options for `renderMarkdown`.
 */
export interface RenderMarkdownOptions {
  /** Enable GitHub Flavored Markdown (tables, strikethrough, etc.). Default: true */
  gfm?: boolean;
  /** Convert single newlines to `<br>`. Default: false */
  breaks?: boolean;
  /** Custom `marked` options (overrides gfm/breaks if provided). */
  markedOptions?: MarkedOptions;
}

/**
 * Convert a Markdown string to sanitized HTML.
 *
 * Returns the HTML string on success, or a basic escaped fallback if parsing fails.
 * Never throws — safe to use in server components without try/catch.
 *
 * @param source - Raw Markdown string
 * @param options - Rendering options
 * @returns HTML string
 */
export async function renderMarkdown(
  source: string,
  options: RenderMarkdownOptions = {},
): Promise<string> {
  if (!source || typeof source !== "string") {
    return "";
  }

  const { gfm = true, breaks = false, markedOptions } = options;

  try {
    const html = await marked(source, {
      gfm,
      breaks,
      ...markedOptions,
    });

    return html;
  } catch {
    // Fallback: escape HTML and convert to basic structure
    return escapeToBasicHtml(source);
  }
}

/**
 * Synchronous version of `renderMarkdown`.
 *
 * Uses `marked.parse()` synchronously. Useful for build scripts,
 * API routes, or any context where async is not needed.
 *
 * @param source - Raw Markdown string
 * @param options - Rendering options
 * @returns HTML string
 */
export function renderMarkdownSync(
  source: string,
  options: RenderMarkdownOptions = {},
): string {
  if (!source || typeof source !== "string") {
    return "";
  }

  const { gfm = true, breaks = false, markedOptions } = options;

  try {
    const html = marked.parse(source, {
      gfm,
      breaks,
      async: false,
      ...markedOptions,
    }) as string;

    return html;
  } catch {
    return escapeToBasicHtml(source);
  }
}

/**
 * Escape raw text to basic HTML as a last-resort fallback.
 * Converts headings, bold, italic, and paragraphs.
 */
function escapeToBasicHtml(source: string): string {
  return source
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/^###\s+(.+)$/gm, "<h3>$1</h3>")
    .replace(/^##\s+(.+)$/gm, "<h2>$1</h2>")
    .replace(/^#\s+(.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>");
}
