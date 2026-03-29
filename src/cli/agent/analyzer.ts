/**
 * Project Analyzer
 *
 * Deep analysis of project structure, code style, and architecture.
 * Reads actual files to understand naming conventions and patterns.
 */

import fs from "fs";
import path from "path";
import type { ProjectInfo } from "./types.js";

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
}

export class ProjectAnalyzer {
  private cwd: string;

  constructor(cwd: string) {
    this.cwd = cwd;
  }

  async analyze(): Promise<ProjectInfo> {
    const packageJson = this.readPackageJson();
    const dependencies = {
      ...packageJson?.dependencies,
      ...packageJson?.devDependencies,
    };

    const structure = this.analyzeStructure();
    const framework = this.detectFramework(dependencies, structure);
    const router = this.detectRouter(framework, structure);
    const styling = this.detectStyling(dependencies, structure.configFiles);
    const typescript = this.detectTypeScript(
      dependencies,
      structure.configFiles,
    );
    const packageManager = this.detectPackageManager();
    const existingBlogFiles = this.findExistingBlogFiles(framework, router);

    // Deep code analysis
    const codeContext = await this.analyzeCodeContext(
      framework,
      router,
      typescript,
    );

    return {
      framework,
      router,
      styling,
      typescript,
      packageManager,
      dependencies,
      structure,
      existingBlogFiles,
      codeContext,
      projectName: packageJson?.name || "unknown",
    };
  }

  // ─── Full repo indexation ───────────────────────────────────────

  /**
   * Build a complete directory tree string (like `tree` command).
   * Excludes node_modules, .git, .next, dist, build, coverage.
   */
  buildDirectoryTree(maxDepth = 6): string {
    const IGNORED = new Set([
      "node_modules",
      ".git",
      ".next",
      "dist",
      "build",
      "coverage",
      ".turbo",
      ".vercel",
      ".output",
      "__pycache__",
      ".cache",
    ]);

    const lines: string[] = [];

    const walk = (dir: string, prefix: string, depth: number) => {
      if (depth > maxDepth) return;
      let entries: fs.Dirent[];
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }

      // Sort: directories first, then files
      entries.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
      });

      const filtered = entries.filter(
        (e) => !IGNORED.has(e.name) && !e.name.startsWith("."),
      );

      for (let i = 0; i < filtered.length; i++) {
        const entry = filtered[i];
        const isLast = i === filtered.length - 1;
        const connector = isLast ? "└── " : "├── ";
        const childPrefix = isLast ? "    " : "│   ";

        lines.push(
          `${prefix}${connector}${entry.name}${entry.isDirectory() ? "/" : ""}`,
        );

        if (entry.isDirectory()) {
          walk(path.join(dir, entry.name), prefix + childPrefix, depth + 1);
        }
      }
    };

    lines.push("./");
    walk(this.cwd, "", 0);
    return lines.join("\n");
  }

  /**
   * Read ALL source files in the project (up to a token budget).
   * Returns an array of { path, content } for every .ts/.tsx/.js/.jsx/.css/.json file.
   * Excludes node_modules, .git, .next, dist, build, lock files.
   */
  readAllSourceFiles(
    maxTotalChars = 120_000,
  ): { path: string; content: string }[] {
    const IGNORED_DIRS = new Set([
      "node_modules",
      ".git",
      ".next",
      "dist",
      "build",
      "coverage",
      ".turbo",
      ".vercel",
      ".output",
      "__pycache__",
      ".cache",
    ]);
    const SOURCE_EXTS = new Set([
      ".ts",
      ".tsx",
      ".js",
      ".jsx",
      ".mjs",
      ".cjs",
      ".css",
      ".scss",
      ".json",
      ".astro",
      ".vue",
      ".svelte",
      ".mdx",
      ".md",
    ]);
    // Config files at root we always want
    const ROOT_CONFIG_NAMES = new Set([
      "next.config.js",
      "next.config.mjs",
      "next.config.ts",
      "tailwind.config.js",
      "tailwind.config.ts",
      "tailwind.config.mjs",
      "postcss.config.js",
      "postcss.config.mjs",
      "tsconfig.json",
      "jsconfig.json",
      "package.json",
      ".env.local",
      ".env",
    ]);

    const files: { path: string; content: string }[] = [];
    let totalChars = 0;

    const walk = (dir: string) => {
      if (totalChars >= maxTotalChars) return;

      let entries: fs.Dirent[];
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }

      // Prioritize: config files first, then source files, then others
      entries.sort((a, b) => {
        const aIsConfig = ROOT_CONFIG_NAMES.has(a.name) ? 0 : 1;
        const bIsConfig = ROOT_CONFIG_NAMES.has(b.name) ? 0 : 1;
        if (aIsConfig !== bIsConfig) return aIsConfig - bIsConfig;
        if (a.isDirectory() && !b.isDirectory()) return 1; // files first
        if (!a.isDirectory() && b.isDirectory()) return -1;
        return a.name.localeCompare(b.name);
      });

      for (const entry of entries) {
        if (totalChars >= maxTotalChars) return;

        if (entry.isDirectory()) {
          if (!IGNORED_DIRS.has(entry.name) && !entry.name.startsWith(".")) {
            walk(path.join(dir, entry.name));
          }
          continue;
        }

        const ext = path.extname(entry.name);
        const isSource = SOURCE_EXTS.has(ext);
        const isRootConfig =
          dir === this.cwd && ROOT_CONFIG_NAMES.has(entry.name);

        if (!isSource && !isRootConfig) continue;

        // Skip lock files and large generated files
        if (
          entry.name.includes("lock") ||
          entry.name.endsWith(".d.ts") ||
          entry.name.endsWith(".map")
        )
          continue;

        const fullPath = path.join(dir, entry.name);
        const relPath = path.relative(this.cwd, fullPath);

        try {
          const content = fs.readFileSync(fullPath, "utf-8");
          // Skip very large files (>8KB each) but always include configs
          if (content.length > 8000 && !isRootConfig) continue;
          if (totalChars + content.length > maxTotalChars) continue;

          files.push({ path: relPath, content });
          totalChars += content.length;
        } catch {
          // Skip unreadable
        }
      }
    };

    walk(this.cwd);
    return files;
  }

  /**
   * Deep analysis of code patterns and conventions
   */
  private async analyzeCodeContext(
    framework: string | null,
    router: string | undefined,
    typescript: boolean,
  ): Promise<CodeContext> {
    const ext = typescript ? "tsx" : "jsx";
    const sampleFiles: { path: string; content: string }[] = [];
    const apiPatterns: { path: string; content: string }[] = [];
    const layouts: string[] = [];

    // Find sample pages/components based on framework
    const pageDirs = this.getPageDirs(framework, router);
    for (const dir of pageDirs) {
      const samples = this.readSampleFiles(
        dir,
        [ext, typescript ? "ts" : "js"],
        3,
      );
      sampleFiles.push(...samples);
    }

    // Find layouts
    const layoutPaths = this.findLayouts(framework, router, typescript);
    layouts.push(...layoutPaths);

    // Find API routes as patterns
    const apiDirs = this.getApiDirs(framework, router);
    for (const dir of apiDirs) {
      const apis = this.readSampleFiles(dir, [typescript ? "ts" : "js"], 2);
      apiPatterns.push(...apis);
    }

    // Detect import style from samples
    const importStyle = this.detectImportStyle(sampleFiles);
    const pathAlias = this.detectPathAlias();
    const componentNaming = this.detectComponentNaming(sampleFiles);
    const fileNaming = this.detectFileNaming(sampleFiles);
    const exportStyle = this.detectExportStyle(sampleFiles);
    const quoteStyle = this.detectQuoteStyle(sampleFiles);
    const semicolons = this.detectSemicolons(sampleFiles);
    const indentation = this.detectIndentation(sampleFiles);

    return {
      sampleFiles,
      importStyle,
      pathAlias,
      componentNaming,
      fileNaming,
      exportStyle,
      layouts,
      apiPatterns,
      quoteStyle,
      semicolons,
      indentation,
    };
  }

  private getPageDirs(framework: string | null, router?: string): string[] {
    switch (framework) {
      case "nextjs":
        if (router === "app") {
          return ["app", "src/app"].filter((d) => this.exists(d));
        }
        return ["pages", "src/pages"].filter((d) => this.exists(d));
      case "remix":
        return ["app/routes"].filter((d) => this.exists(d));
      case "astro":
        return ["src/pages"].filter((d) => this.exists(d));
      case "nuxt":
        return ["pages"].filter((d) => this.exists(d));
      case "sveltekit":
        return ["src/routes"].filter((d) => this.exists(d));
      default:
        return [];
    }
  }

  private getApiDirs(framework: string | null, router?: string): string[] {
    switch (framework) {
      case "nextjs":
        if (router === "app") {
          return ["app/api", "src/app/api"].filter((d) => this.exists(d));
        }
        return ["pages/api", "src/pages/api"].filter((d) => this.exists(d));
      case "remix":
        return ["app/routes"].filter((d) => this.exists(d)); // API routes are in routes folder
      case "astro":
        return ["src/pages/api"].filter((d) => this.exists(d));
      case "nuxt":
        return ["server/api"].filter((d) => this.exists(d));
      case "sveltekit":
        return ["src/routes/api"].filter((d) => this.exists(d));
      default:
        return [];
    }
  }

  private findLayouts(
    framework: string | null,
    router?: string,
    typescript?: boolean,
  ): string[] {
    const layouts: string[] = [];
    const ext = typescript ? "tsx" : "jsx";
    const ts = typescript ? "ts" : "js";

    const candidates = [
      // Next.js App Router
      `app/layout.${ext}`,
      `src/app/layout.${ext}`,
      // Next.js Pages Router
      `pages/_app.${ext}`,
      `src/pages/_app.${ext}`,
      // Components folder
      `components/Layout.${ext}`,
      `src/components/Layout.${ext}`,
      `components/layout/Layout.${ext}`,
      `src/components/layout/Layout.${ext}`,
      // Astro
      `src/layouts/Layout.astro`,
      `src/layouts/BaseLayout.astro`,
      // Nuxt
      `layouts/default.vue`,
      // SvelteKit
      `src/routes/+layout.svelte`,
      // Remix
      `app/root.${ext}`,
    ];

    for (const candidate of candidates) {
      if (this.exists(candidate)) {
        layouts.push(candidate);
      }
    }

    return layouts;
  }

  private readSampleFiles(
    dir: string,
    extensions: string[],
    maxFiles: number,
  ): { path: string; content: string }[] {
    const samples: { path: string; content: string }[] = [];
    const fullDir = path.join(this.cwd, dir);

    if (!fs.existsSync(fullDir)) return samples;

    try {
      const entries = fs.readdirSync(fullDir, { withFileTypes: true });

      for (const entry of entries) {
        if (samples.length >= maxFiles) break;

        const ext = path.extname(entry.name).slice(1);
        if (entry.isFile() && extensions.includes(ext)) {
          const filePath = path.join(dir, entry.name);
          const content = fs.readFileSync(
            path.join(this.cwd, filePath),
            "utf-8",
          );
          // Only include if not too large (max 200 lines)
          if (content.split("\n").length <= 200) {
            samples.push({ path: filePath, content });
          }
        }
      }
    } catch {
      // Ignore errors
    }

    return samples;
  }

  private detectImportStyle(
    samples: { path: string; content: string }[],
  ): "relative" | "alias" {
    let aliasCount = 0;
    let relativeCount = 0;

    for (const sample of samples) {
      const imports = sample.content.match(/from ['"]([^'"]+)['"]/g) || [];
      for (const imp of imports) {
        if (imp.includes("@/") || imp.includes("~/")) {
          aliasCount++;
        } else if (imp.includes("./") || imp.includes("../")) {
          relativeCount++;
        }
      }
    }

    return aliasCount > relativeCount ? "alias" : "relative";
  }

  private detectPathAlias(): string | undefined {
    // Check tsconfig/jsconfig for path aliases
    for (const configFile of ["tsconfig.json", "jsconfig.json"]) {
      const fullPath = path.join(this.cwd, configFile);
      if (fs.existsSync(fullPath)) {
        try {
          const config = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
          const paths = config.compilerOptions?.paths;
          if (paths) {
            // Find the main alias (usually @/* or ~/*)
            for (const alias of Object.keys(paths)) {
              if (alias.endsWith("/*")) {
                return alias.replace("/*", "/");
              }
            }
          }
        } catch {
          // Ignore parse errors
        }
      }
    }
    return undefined;
  }

  private detectComponentNaming(
    samples: { path: string; content: string }[],
  ): "PascalCase" | "kebab-case" | "camelCase" {
    for (const sample of samples) {
      // Look for component definitions
      const match = sample.content.match(
        /(?:function|const)\s+([A-Z][a-zA-Z0-9]*)/,
      );
      if (match) return "PascalCase";
    }
    return "PascalCase"; // Default
  }

  private detectFileNaming(
    samples: { path: string; content: string }[],
  ): "PascalCase" | "kebab-case" | "camelCase" {
    for (const sample of samples) {
      const fileName = path.basename(sample.path, path.extname(sample.path));
      if (fileName.includes("-")) return "kebab-case";
      if (/^[A-Z]/.test(fileName)) return "PascalCase";
      if (/^[a-z]/.test(fileName)) return "camelCase";
    }
    return "kebab-case"; // Default for pages
  }

  private detectExportStyle(
    samples: { path: string; content: string }[],
  ): "default" | "named" | "mixed" {
    let hasDefault = false;
    let hasNamed = false;

    for (const sample of samples) {
      if (sample.content.includes("export default")) hasDefault = true;
      if (/export\s+(const|function|class)\s+/.test(sample.content))
        hasNamed = true;
    }

    if (hasDefault && hasNamed) return "mixed";
    if (hasDefault) return "default";
    return "named";
  }

  private detectQuoteStyle(
    samples: { path: string; content: string }[],
  ): "single" | "double" {
    let singleCount = 0;
    let doubleCount = 0;

    for (const sample of samples) {
      const singleImports =
        sample.content.match(/from\s+'[^']+'/g)?.length || 0;
      const doubleImports =
        sample.content.match(/from\s+"[^"]+"/g)?.length || 0;
      singleCount += singleImports;
      doubleCount += doubleImports;
    }

    return doubleCount > singleCount ? "double" : "single";
  }

  private detectSemicolons(
    samples: { path: string; content: string }[],
  ): boolean {
    let withSemicolon = 0;
    let withoutSemicolon = 0;

    for (const sample of samples) {
      const lines = sample.content
        .split("\n")
        .filter((l) => l.trim().length > 0);
      for (const line of lines) {
        const trimmed = line.trim();
        // Skip block openers/closers, comments, and JSX
        if (
          trimmed.startsWith("//") ||
          trimmed.startsWith("/*") ||
          trimmed.startsWith("*") ||
          trimmed.endsWith("{") ||
          trimmed.endsWith("}") ||
          trimmed.endsWith("(") ||
          trimmed.endsWith(")") ||
          trimmed.endsWith(">") ||
          trimmed.endsWith(",") ||
          trimmed.length < 5
        )
          continue;

        if (trimmed.endsWith(";")) {
          withSemicolon++;
        } else if (
          trimmed.match(
            /^(import|export|const|let|var|return|throw|type|interface)\b/,
          )
        ) {
          withoutSemicolon++;
        }
      }
    }

    // Default to true (semicolons) if inconclusive
    return withSemicolon >= withoutSemicolon;
  }

  private detectIndentation(
    samples: { path: string; content: string }[],
  ): "2spaces" | "4spaces" | "tabs" {
    let tabs = 0;
    let twoSpaces = 0;
    let fourSpaces = 0;

    for (const sample of samples) {
      const lines = sample.content.split("\n");
      for (const line of lines) {
        if (line.startsWith("\t")) {
          tabs++;
        } else {
          const match = line.match(/^( +)/);
          if (match) {
            const spaces = match[1].length;
            if (spaces === 2 || spaces === 6 || spaces === 10) twoSpaces++;
            if (spaces === 4 || spaces === 8 || spaces === 12) fourSpaces++;
          }
        }
      }
    }

    if (tabs > twoSpaces && tabs > fourSpaces) return "tabs";
    if (fourSpaces > twoSpaces) return "4spaces";
    return "2spaces";
  }

  private readPackageJson(): any {
    try {
      const content = fs.readFileSync(
        path.join(this.cwd, "package.json"),
        "utf-8",
      );
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  private analyzeStructure() {
    const hasAppDir = this.exists("app") || this.exists("src/app");
    const hasPagesDir = this.exists("pages") || this.exists("src/pages");
    const hasSrcDir = this.exists("src");

    const configFiles: string[] = [];
    const possibleConfigs = [
      "next.config.js",
      "next.config.mjs",
      "next.config.ts",
      "remix.config.js",
      "remix.config.ts",
      "astro.config.mjs",
      "astro.config.ts",
      "nuxt.config.ts",
      "nuxt.config.js",
      "svelte.config.js",
      "vite.config.ts",
      "vite.config.js",
      "tailwind.config.js",
      "tailwind.config.ts",
      "tailwind.config.mjs",
      "tsconfig.json",
      "jsconfig.json",
    ];

    for (const config of possibleConfigs) {
      if (this.exists(config)) {
        configFiles.push(config);
      }
    }

    return { hasAppDir, hasPagesDir, hasSrcDir, configFiles };
  }

  private detectFramework(
    deps: Record<string, string>,
    structure: {
      hasAppDir: boolean;
      hasPagesDir: boolean;
      configFiles: string[];
    },
  ): string | null {
    // Check SvelteKit first (has specific structure)
    if (
      deps["@sveltejs/kit"] &&
      structure.configFiles.includes("svelte.config.js")
    ) {
      return "sveltekit";
    }

    // Check Nuxt
    if (
      deps["nuxt"] &&
      structure.configFiles.some((f) => f.startsWith("nuxt.config"))
    ) {
      return "nuxt";
    }

    // Check Astro
    if (
      deps["astro"] &&
      structure.configFiles.some((f) => f.startsWith("astro.config"))
    ) {
      return "astro";
    }

    // Check Remix
    if (
      (deps["@remix-run/react"] || deps["@remix-run/node"]) &&
      structure.configFiles.some((f) => f.startsWith("remix.config"))
    ) {
      return "remix";
    }

    // Check Next.js
    if (
      deps["next"] &&
      structure.configFiles.some((f) => f.startsWith("next.config"))
    ) {
      return "nextjs";
    }

    // Fallback checks based on dependencies only
    if (deps["next"]) return "nextjs";
    if (deps["@remix-run/react"]) return "remix";
    if (deps["astro"]) return "astro";
    if (deps["nuxt"]) return "nuxt";
    if (deps["@sveltejs/kit"]) return "sveltekit";

    return null;
  }

  private detectRouter(
    framework: string | null,
    structure: { hasAppDir: boolean; hasPagesDir: boolean },
  ): string | undefined {
    if (framework !== "nextjs") return undefined;

    // Check for app router (has app directory with layout)
    if (
      this.exists("app/layout.tsx") ||
      this.exists("app/layout.js") ||
      this.exists("src/app/layout.tsx") ||
      this.exists("src/app/layout.js")
    ) {
      return "app";
    }

    // Check for pages router
    if (
      this.exists("pages/_app.tsx") ||
      this.exists("pages/_app.js") ||
      this.exists("src/pages/_app.tsx") ||
      this.exists("src/pages/_app.js")
    ) {
      return "pages";
    }

    // Default based on structure
    if (structure.hasAppDir) return "app";
    if (structure.hasPagesDir) return "pages";

    return "pages"; // Default to pages router
  }

  private detectStyling(
    deps: Record<string, string>,
    configFiles: string[],
  ): string | null {
    // Check Tailwind
    if (
      deps["tailwindcss"] ||
      configFiles.some((f) => f.startsWith("tailwind.config"))
    ) {
      return "tailwind";
    }

    // Check styled-components
    if (deps["styled-components"]) {
      return "styled-components";
    }

    // Check Emotion
    if (deps["@emotion/react"] || deps["@emotion/styled"]) {
      return "emotion";
    }

    // Check CSS Modules (common in Next.js, need to check for .module.css files)
    // For now, assume CSS modules if nothing else detected
    return "css-modules";
  }

  private detectTypeScript(
    deps: Record<string, string>,
    configFiles: string[],
  ): boolean {
    return (
      deps["typescript"] !== undefined || configFiles.includes("tsconfig.json")
    );
  }

  private detectPackageManager(): string {
    if (this.exists("pnpm-lock.yaml")) return "pnpm";
    if (this.exists("yarn.lock")) return "yarn";
    if (this.exists("bun.lockb")) return "bun";
    return "npm";
  }

  private findExistingBlogFiles(
    framework: string | null,
    router?: string,
  ): string[] {
    const blogFiles: string[] = [];
    const patterns: string[] = [];

    switch (framework) {
      case "nextjs":
        if (router === "app") {
          patterns.push(
            "app/blog",
            "src/app/blog",
            "app/articles",
            "src/app/articles",
            "app/actualites",
            "src/app/actualites",
          );
        } else {
          patterns.push(
            "pages/blog",
            "src/pages/blog",
            "pages/articles",
            "src/pages/articles",
            "pages/actualites",
            "src/pages/actualites",
          );
        }
        // Check API routes too
        patterns.push(
          "pages/api/blog",
          "pages/api/articles",
          "src/pages/api/blog",
          "app/api/blog",
          "src/app/api/blog",
        );
        break;
      case "remix":
        patterns.push("app/routes/blog", "app/routes/articles");
        break;
      case "astro":
        patterns.push(
          "src/pages/blog",
          "src/pages/articles",
          "src/content/blog",
        );
        break;
      case "nuxt":
        patterns.push("pages/blog", "pages/articles", "content/blog");
        break;
      case "sveltekit":
        patterns.push("src/routes/blog", "src/routes/articles");
        break;
    }

    // Common patterns regardless of framework
    patterns.push(
      "content/blog",
      "content/posts",
      "content/articles",
      "posts",
      "_posts",
      "blog",
    );

    for (const pattern of patterns) {
      if (this.exists(pattern)) {
        blogFiles.push(pattern);
      }
    }

    return blogFiles;
  }

  private exists(relativePath: string): boolean {
    try {
      return fs.existsSync(path.join(this.cwd, relativePath));
    } catch {
      return false;
    }
  }
}

export default ProjectAnalyzer;
