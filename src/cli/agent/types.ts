/**
 * Types for the AI-powered installation agent
 */

export interface CodeContext {
  /** Sample of existing pages/components for style matching */
  sampleFiles: { path: string; content: string }[];
  /** Import style detected (relative vs alias) */
  importStyle: "relative" | "alias";
  /** Path alias if detected (e.g., @/, ~/) */
  pathAlias?: string;
  /** Component naming convention */
  componentNaming: "PascalCase" | "kebab-case" | "camelCase";
  /** File naming convention */
  fileNaming: "PascalCase" | "kebab-case" | "camelCase";
  /** Export style */
  exportStyle: "default" | "named" | "mixed";
  /** Existing layout/wrapper components */
  layouts: string[];
  /** API route patterns */
  apiPatterns: { path: string; content: string }[];
  /** Quote style used in imports */
  quoteStyle: "single" | "double";
  /** Whether files use semicolons */
  semicolons: boolean;
  /** Indentation style */
  indentation: "2spaces" | "4spaces" | "tabs";
}

export interface ProjectInfo {
  /** Detected framework: nextjs, remix, astro, nuxt, sveltekit */
  framework: string | null;
  /** Router type for Next.js: pages or app */
  router?: string;
  /** Styling solution: tailwind, css-modules, styled-components, etc. */
  styling: string | null;
  /** Whether TypeScript is used */
  typescript: boolean;
  /** Package manager: npm, yarn, pnpm, bun */
  packageManager: string;
  /** Existing dependencies */
  dependencies: Record<string, string>;
  /** Project structure info */
  structure: {
    hasAppDir: boolean;
    hasPagesDir: boolean;
    hasSrcDir: boolean;
    configFiles: string[];
  };
  /** Existing blog-related files */
  existingBlogFiles: string[];
  /** Deep code analysis context */
  codeContext?: CodeContext;
  /** Project name from package.json */
  projectName?: string;
}
