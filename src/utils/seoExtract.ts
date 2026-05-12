/**
 * Utilities to extract AI/LLM-friendly structured data from raw Markdown/MDX content.
 *
 * Why this exists: AI search engines (Perplexity, ChatGPT, Google AI Overviews) reward
 * pages that ship FAQPage / HowTo / answer-block schemas. Authors rarely add them by
 * hand. These helpers infer them from heading patterns so consumers get them for free.
 */

import type { ArticleFAQ, ArticleHowToStep } from "../types";

const QUESTION_CHAR_RE = /\?$|\?["»’\)\]]?$/u;
const FRENCH_QUESTION_RE =
  /^(qu(?:e|i|oi|el|elle|els|elles|and)?|comment|pourquoi|où|d'où|combien|que|quels?|quelles?)\b/iu;
const ENGLISH_QUESTION_RE =
  /^(what|how|why|when|where|which|who|does|do|is|are|can|should|will|would|could)\b/i;

/**
 * Decides whether a heading text looks like a user-facing question.
 * Accepts: trailing "?", or starts with a question word (FR/EN).
 */
export function isQuestionHeading(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (QUESTION_CHAR_RE.test(trimmed)) return true;
  return FRENCH_QUESTION_RE.test(trimmed) || ENGLISH_QUESTION_RE.test(trimmed);
}

/**
 * Strip simple inline Markdown (links, bold, italic, code, images) and collapse whitespace.
 */
export function stripInlineMarkdown(text: string): string {
  return text
    // Images ![alt](url)
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    // Links [text](url) → text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    // Bold/italic/inline code
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/`([^`]+)`/g, "$1")
    // HTML tags
    .replace(/<[^>]+>/g, "")
    // Collapse whitespace
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Word count of plain text (handles latin scripts; non-Latin scripts fall back to char/4).
 */
export function countWords(text: string): number {
  const stripped = stripInlineMarkdown(text);
  if (!stripped) return 0;
  const words = stripped.split(/\s+/).filter(Boolean);
  return words.length;
}

interface MarkdownSection {
  level: number;
  heading: string;
  body: string;
}

/**
 * Splits Markdown into sections keyed by their nearest heading.
 * Ignores fenced code blocks so `## inside code` is not treated as a heading.
 */
export function parseMarkdownSections(content: string): MarkdownSection[] {
  if (!content) return [];

  const lines = content.split(/\r?\n/);
  const sections: MarkdownSection[] = [];
  let current: MarkdownSection | null = null;
  let inFence = false;
  let fenceMarker = "";

  for (const rawLine of lines) {
    const line = rawLine;

    // Track fenced code blocks
    const fenceMatch = line.match(/^(\s{0,3})(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[2];
      if (!inFence) {
        inFence = true;
        fenceMarker = marker[0];
      } else if (marker.startsWith(fenceMarker)) {
        inFence = false;
        fenceMarker = "";
      }
      if (current) current.body += line + "\n";
      continue;
    }

    if (!inFence) {
      const headingMatch = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
      if (headingMatch) {
        if (current) sections.push(current);
        current = {
          level: headingMatch[1].length,
          heading: headingMatch[2].trim(),
          body: "",
        };
        continue;
      }
    }

    if (current) current.body += line + "\n";
  }

  if (current) sections.push(current);
  return sections;
}

export interface ExtractFAQsOptions {
  /** Heading levels to scan (default: [2, 3]) */
  levels?: number[];
  /** Max words per answer — sweet spot ~150 for AI snippets (default: 150) */
  maxWords?: number;
  /** Min words per answer to keep the entry (default: 15) */
  minWords?: number;
  /** Hard cap on number of FAQs (default: 12) */
  maxItems?: number;
}

/**
 * Extracts FAQ entries from a Markdown string by finding H2/H3 headings that look like
 * questions and taking the first paragraph after each (trimmed to maxWords).
 *
 * Returns [] if none are found — caller can fall back to manual `article.faqs`.
 */
export function extractFAQsFromMarkdown(
  content: string | undefined | null,
  options: ExtractFAQsOptions = {},
): ArticleFAQ[] {
  if (!content) return [];

  const {
    levels = [2, 3],
    maxWords = 150,
    minWords = 15,
    maxItems = 12,
  } = options;

  const sections = parseMarkdownSections(content);
  const faqs: ArticleFAQ[] = [];

  for (const section of sections) {
    if (!levels.includes(section.level)) continue;
    if (!isQuestionHeading(section.heading)) continue;

    const firstParagraph = extractFirstParagraph(section.body);
    if (!firstParagraph) continue;

    const answerText = stripInlineMarkdown(firstParagraph);
    const wordCount = countWords(answerText);
    if (wordCount < minWords) continue;

    const trimmed = truncateToWordCount(answerText, maxWords);
    faqs.push({
      question: stripInlineMarkdown(section.heading),
      answer: trimmed,
    });

    if (faqs.length >= maxItems) break;
  }

  return faqs;
}

/**
 * Returns the first non-empty paragraph from a Markdown body — paragraphs are blocks
 * separated by blank lines. Skips lists, blockquotes, code fences, and tables.
 */
function extractFirstParagraph(body: string): string {
  const blocks = body.split(/\n\s*\n/);
  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    // Skip non-prose blocks
    if (/^[-*+]\s/.test(trimmed)) continue;
    if (/^\d+\.\s/.test(trimmed)) continue;
    if (/^>/.test(trimmed)) continue;
    if (/^```/.test(trimmed)) continue;
    if (/^\|/.test(trimmed)) continue;
    if (/^#{1,6}\s/.test(trimmed)) continue;
    return trimmed.replace(/\n+/g, " ");
  }
  return "";
}

function truncateToWordCount(text: string, maxWords: number): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "…";
}

export interface ExtractHowToOptions {
  /** Heading levels to treat as step names (default: [2, 3]) */
  levels?: number[];
  /** Minimum number of detected steps required (default: 3) */
  minSteps?: number;
}

/**
 * Extracts HowTo steps when the content is structured as numbered/sequential headings
 * (e.g., "Étape 1 — ...", "Step 2: ...", or successive H2/H3 sections with prose).
 * Returns [] if the pattern doesn't match — HowTo schema should not be emitted on weak signals.
 */
export function extractHowToFromMarkdown(
  content: string | undefined | null,
  options: ExtractHowToOptions = {},
): ArticleHowToStep[] {
  if (!content) return [];

  const { levels = [2, 3], minSteps = 3 } = options;
  const sections = parseMarkdownSections(content).filter((s) =>
    levels.includes(s.level),
  );

  const stepRegex = /^(?:étape|step)\s*\d+[\s:—\-.)]/i;
  const stepSections = sections.filter((s) => stepRegex.test(s.heading));
  if (stepSections.length < minSteps) return [];

  return stepSections.map((section) => {
    const firstParagraph = extractFirstParagraph(section.body);
    return {
      name: stripInlineMarkdown(section.heading),
      text: stripInlineMarkdown(firstParagraph || section.heading),
    };
  });
}
