/**
 * AI Agent — OpenAI Agents SDK integration
 *
 * Uses the @openai/agents SDK to run an autonomous agent with function tools.
 * The agent can read files, write files, delete files, list directories,
 * search in files, run commands, and install packages to integrate
 * @nexifi/mdx-blog into any project.
 *
 * Features:
 * - 7 tools: read_file, write_file, delete_file, list_directory, search_in_files, run_command, install_package
 * - Full repo context injection (saves agent turns)
 * - Rollback on failure (clean state, or --keep-on-failure)
 * - Anti-revert build-fix rules
 * - maxTurns=60 for complex projects with multi-cycle build fixes
 *
 * Requires OPENAI_API_KEY in process.env.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { z } from "zod";
import { Agent, run, tool } from "@openai/agents";
import type { ProjectInfo } from "./types.js";
import { ProjectAnalyzer } from "./analyzer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Constants ──────────────────────────────────────────────────────

/** Max agent turns — enough for explore + 10-15 writes + 5 build attempts + multi-fix cycles */
const MAX_AGENT_TURNS = 60;

/** Max chars for repo context injection (aligned with analyzer's readAllSourceFiles budget) */
const MAX_REPO_CONTEXT_CHARS = 120_000;

/** Max chars for command output (increased to capture full TypeScript errors) */
const MAX_COMMAND_OUTPUT_CHARS = 12_000;

/** Packages the agent is allowed to install */
const INSTALLABLE_PACKAGES = new Set([
  "@nexifi/mdx-blog",
  "react",
  "react-dom",
  "next",
  "swr",
  "next-mdx-remote",
  "@mdx-js/react",
  "remark-gfm",
  "rehype-highlight",
  "@types/react",
  "@types/react-dom",
  "@types/node",
  "typescript",
  "tailwindcss",
  "autoprefixer",
  "postcss",
  "@next/mdx",
  "gray-matter",
  "reading-time",
  "date-fns",
  "clsx",
  "class-variance-authority",
  "@tailwindcss/typography",
  "sharp",
]);

// ─── Types ──────────────────────────────────────────────────────────

export interface AgentConfig {
  /** Working directory of the target project */
  cwd: string;
  /** OpenAI model identifier (default: "gpt-5.4") */
  model?: string;
  /** Show verbose output */
  verbose?: boolean;
  /** Keep files on failure instead of rolling back */
  keepOnFailure?: boolean;
}

export interface AgentInstallResult {
  success: boolean;
  filesCreated?: string[];
  filesModified?: string[];
  error?: string;
}

// ─── Snapshot / Rollback ────────────────────────────────────────────

interface FileSnapshot {
  path: string;
  content: string | null; // null = file didn't exist
}

/**
 * Snapshot files that might be modified so they can be restored on failure.
 */
function snapshotFiles(cwd: string, projectInfo: ProjectInfo): FileSnapshot[] {
  const srcPrefix = projectInfo.structure.hasSrcDir ? "src/" : "";
  const filesToSnapshot = [
    "package.json",
    ".env.local",
    "tailwind.config.js",
    "tailwind.config.ts",
    "tailwind.config.mjs",
    "next.config.js",
    "next.config.mjs",
    "next.config.ts",
    "tsconfig.json",
    "postcss.config.js",
    "postcss.config.mjs",
  ];

  if (projectInfo.framework === "nextjs") {
    if (projectInfo.router === "app") {
      filesToSnapshot.push(
        `${srcPrefix}app/layout.tsx`,
        `${srcPrefix}app/layout.js`,
      );
    } else {
      filesToSnapshot.push(
        `${srcPrefix}pages/_app.tsx`,
        `${srcPrefix}pages/_app.js`,
      );
    }
  } else if (projectInfo.framework === "remix") {
    filesToSnapshot.push("app/root.tsx");
  }

  const snapshots: FileSnapshot[] = [];
  for (const rel of filesToSnapshot) {
    const full = path.join(cwd, rel);
    if (fs.existsSync(full)) {
      snapshots.push({ path: rel, content: fs.readFileSync(full, "utf-8") });
    } else {
      snapshots.push({ path: rel, content: null });
    }
  }
  return snapshots;
}

/**
 * Restore snapshots and delete created files on failure.
 */
function rollback(
  cwd: string,
  snapshots: FileSnapshot[],
  createdFiles: Set<string>,
): void {
  console.log("\n   🔄 Rolling back changes...\n");

  for (const snap of snapshots) {
    const full = path.join(cwd, snap.path);
    if (snap.content === null) {
      if (fs.existsSync(full)) {
        fs.unlinkSync(full);
        console.log(`   🗑️  Removed: ${snap.path}`);
      }
    } else {
      if (fs.existsSync(full)) {
        const current = fs.readFileSync(full, "utf-8");
        if (current !== snap.content) {
          fs.writeFileSync(full, snap.content, "utf-8");
          console.log(`   ↩️  Restored: ${snap.path}`);
        }
      }
    }
  }

  for (const rel of createdFiles) {
    const full = path.join(cwd, rel);
    if (fs.existsSync(full)) {
      fs.unlinkSync(full);
      console.log(`   🗑️  Removed: ${rel}`);
    }
    let dir = path.dirname(full);
    while (dir !== cwd && dir.startsWith(cwd)) {
      try {
        const entries = fs.readdirSync(dir);
        if (entries.length === 0) {
          fs.rmdirSync(dir);
        } else {
          break;
        }
      } catch {
        break;
      }
      dir = path.dirname(dir);
    }
  }

  console.log("   ✅ Rollback complete — project is in clean state\n");
}

// ─── Tool factories ─────────────────────────────────────────────────

/**
 * Create a read_file tool scoped to the given project directory.
 */
function createReadFileTool(cwd: string, verbose: boolean) {
  return tool({
    name: "read_file",
    description:
      "Read the contents of a file in the project. Use relative paths from project root.",
    parameters: z.object({
      filePath: z.string().describe("Relative path from project root"),
    }),
    execute: async (input) => {
      const fullPath = path.resolve(cwd, input.filePath);
      if (!fullPath.startsWith(path.resolve(cwd))) {
        return "ERROR: Path is outside the project directory.";
      }
      if (!fs.existsSync(fullPath)) {
        return `ERROR: File not found: ${input.filePath}`;
      }
      try {
        const content = fs.readFileSync(fullPath, "utf-8");
        if (verbose) {
          console.log(
            `   📖 Read: ${input.filePath} (${content.length} chars)`,
          );
        }
        return content;
      } catch (err: any) {
        return `ERROR: ${err.message}`;
      }
    },
  });
}

/**
 * Create a write_file tool scoped to the given project directory.
 * Tracks created/modified files in the provided sets.
 */
function createWriteFileTool(
  cwd: string,
  verbose: boolean,
  createdFiles: Set<string>,
  modifiedFiles: Set<string>,
) {
  return tool({
    name: "write_file",
    description:
      "Write content to a file (creates parent directories automatically). " +
      "Use relative paths from project root. Provide the COMPLETE file content.",
    parameters: z.object({
      filePath: z.string().describe("Relative path from project root"),
      content: z.string().describe("Complete file content to write"),
    }),
    execute: async (input) => {
      const fullPath = path.resolve(cwd, input.filePath);
      if (!fullPath.startsWith(path.resolve(cwd))) {
        return "ERROR: Path is outside the project directory.";
      }
      try {
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        const existed = fs.existsSync(fullPath);
        fs.writeFileSync(fullPath, input.content, "utf-8");

        if (existed) {
          modifiedFiles.add(input.filePath);
          console.log(`   ✏️  Updated: ${input.filePath}`);
        } else {
          createdFiles.add(input.filePath);
          console.log(`   ✅ Created: ${input.filePath}`);
        }
        return `OK: File written (${input.content.length} chars)`;
      } catch (err: any) {
        return `ERROR: ${err.message}`;
      }
    },
  });
}

/**
 * Create a list_directory tool scoped to the given project directory.
 */
function createListDirectoryTool(cwd: string, verbose: boolean) {
  return tool({
    name: "list_directory",
    description:
      "List files and subdirectories in a directory. Returns entries with type indicators: " +
      "trailing / for directories. Use '.' for project root.",
    parameters: z.object({
      dirPath: z
        .string()
        .default(".")
        .describe("Relative path from project root (use '.' for root)"),
      recursive: z
        .boolean()
        .default(false)
        .describe("If true, list recursively (max 3 levels deep)"),
      maxDepth: z
        .number()
        .default(3)
        .describe("Max depth for recursive listing (only when recursive=true)"),
    }),
    execute: async (input) => {
      const fullPath = path.resolve(cwd, input.dirPath);
      if (!fullPath.startsWith(path.resolve(cwd))) {
        return "ERROR: Path is outside the project directory.";
      }
      if (!fs.existsSync(fullPath)) {
        return `ERROR: Directory not found: ${input.dirPath}`;
      }
      try {
        if (input.recursive) {
          const analyzer = new ProjectAnalyzer(cwd);
          const tree = analyzer.buildDirectoryTree(input.maxDepth);
          if (verbose) {
            console.log(
              `   📂 Listed directory tree (depth ${input.maxDepth})`,
            );
          }
          return tree;
        }
        const entries = fs.readdirSync(fullPath, { withFileTypes: true });
        const result = entries
          .filter(
            (e) =>
              !e.name.startsWith(".") &&
              e.name !== "node_modules" &&
              e.name !== ".next",
          )
          .map((e) => (e.isDirectory() ? `${e.name}/` : e.name))
          .join("\n");
        if (verbose) {
          console.log(
            `   📂 Listed: ${input.dirPath} (${entries.length} entries)`,
          );
        }
        return result || "(empty directory)";
      } catch (err: any) {
        return `ERROR: ${err.message}`;
      }
    },
  });
}

/**
 * Create a delete_file tool scoped to the given project directory.
 * Useful when the agent creates a file in the wrong location.
 */
function createDeleteFileTool(
  cwd: string,
  verbose: boolean,
  createdFiles: Set<string>,
) {
  return tool({
    name: "delete_file",
    description:
      "Delete a file from the project. Use when you created a file in " +
      "the wrong location and need to clean it up. Use relative paths from project root.",
    parameters: z.object({
      filePath: z.string().describe("Relative path from project root"),
    }),
    execute: async (input) => {
      const fullPath = path.resolve(cwd, input.filePath);
      if (!fullPath.startsWith(path.resolve(cwd))) {
        return "ERROR: Path is outside the project directory.";
      }
      if (!fs.existsSync(fullPath)) {
        return `ERROR: File not found: ${input.filePath}`;
      }
      try {
        fs.unlinkSync(fullPath);
        createdFiles.delete(input.filePath);

        // Clean up empty parent directories
        let dir = path.dirname(fullPath);
        while (dir !== path.resolve(cwd) && dir.startsWith(path.resolve(cwd))) {
          try {
            const entries = fs.readdirSync(dir);
            if (entries.length === 0) {
              fs.rmdirSync(dir);
            } else {
              break;
            }
          } catch {
            break;
          }
          dir = path.dirname(dir);
        }

        if (verbose) {
          console.log(`   🗑️  Deleted: ${input.filePath}`);
        }
        return `OK: Deleted ${input.filePath}`;
      } catch (err: any) {
        return `ERROR: ${err.message}`;
      }
    },
  });
}

/**
 * Create a search_in_files tool to grep for patterns across the project.
 * Saves the agent from spending turns reading files one by one.
 */
function createSearchInFilesTool(cwd: string, verbose: boolean) {
  return tool({
    name: "search_in_files",
    description:
      "Search for a text pattern across project files (like grep). Returns matching " +
      "lines with file path and line number. Max 20 results, 200 chars context per match. " +
      "Use this to find where imports, components, or patterns exist without reading files individually.",
    parameters: z.object({
      pattern: z.string().describe("Text or regex pattern to search for"),
      fileGlob: z
        .string()
        .default("")
        .describe(
          "Optional file extension filter (e.g. '.tsx', '.ts'). Searches all source files if empty.",
        ),
    }),
    execute: async (input) => {
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
      ]);
      const SOURCE_EXTS = new Set([
        ".ts",
        ".tsx",
        ".js",
        ".jsx",
        ".mjs",
        ".cjs",
        ".json",
        ".css",
        ".vue",
        ".svelte",
        ".astro",
      ]);
      const MAX_RESULTS = 20;
      const MAX_CONTEXT_CHARS = 200;
      const results: string[] = [];

      let regex: RegExp;
      try {
        regex = new RegExp(input.pattern, "gi");
      } catch {
        regex = new RegExp(
          input.pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "gi",
        );
      }

      const walk = (dir: string) => {
        if (results.length >= MAX_RESULTS) return;
        let entries: fs.Dirent[];
        try {
          entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
          return;
        }

        for (const entry of entries) {
          if (results.length >= MAX_RESULTS) return;

          if (entry.isDirectory()) {
            if (!IGNORED_DIRS.has(entry.name) && !entry.name.startsWith(".")) {
              walk(path.join(dir, entry.name));
            }
            continue;
          }

          const ext = path.extname(entry.name);
          if (!SOURCE_EXTS.has(ext)) continue;
          if (input.fileGlob && ext !== input.fileGlob) continue;

          const fullPath = path.join(dir, entry.name);
          const relPath = path.relative(cwd, fullPath);

          try {
            const content = fs.readFileSync(fullPath, "utf-8");
            const lines = content.split("\n");
            for (let i = 0; i < lines.length; i++) {
              if (results.length >= MAX_RESULTS) break;
              if (regex.test(lines[i])) {
                const lineContent = lines[i].trim().slice(0, MAX_CONTEXT_CHARS);
                results.push(`${relPath}:${i + 1}: ${lineContent}`);
              }
              regex.lastIndex = 0; // Reset stateful regex
            }
          } catch {
            // Skip unreadable files
          }
        }
      };

      walk(cwd);

      if (verbose) {
        console.log(
          `   🔍 Searched for "${input.pattern}": ${results.length} matches`,
        );
      }

      if (results.length === 0) {
        return `No matches found for "${input.pattern}"`;
      }

      return results.join("\n");
    },
  });
}

/**
 * Create a run_command tool scoped to the given project directory.
 * Allows build, lint, type-check, and package install commands.
 */
function createRunCommandTool(cwd: string, verbose: boolean) {
  const ALLOWED_PREFIXES = [
    "npm run",
    "npm install",
    "npx",
    "pnpm run",
    "pnpm add",
    "pnpm install",
    "pnpm exec",
    "pnpm build",
    "yarn",
    "yarn add",
    "bun run",
    "bun add",
    "tsc",
    "next build",
    "next lint",
  ];

  return tool({
    name: "run_command",
    description:
      "Execute a shell command in the project directory. " +
      "Allowed: build, lint, typecheck, and package install commands. " +
      `Returns stdout + stderr (truncated to ${MAX_COMMAND_OUTPUT_CHARS} chars). Timeout: 180s.`,
    parameters: z.object({
      command: z.string().describe("Shell command to execute"),
    }),
    execute: async (input) => {
      const cmd = input.command.trim();
      const isAllowed = ALLOWED_PREFIXES.some((p) => cmd.startsWith(p));
      if (!isAllowed) {
        return `ERROR: Command not allowed. Allowed prefixes: ${ALLOWED_PREFIXES.join(", ")}`;
      }
      if (verbose) {
        console.log(`   🏗️  Running: ${cmd}`);
      }
      try {
        const output = execSync(cmd, {
          cwd,
          stdio: "pipe",
          timeout: 180_000,
          env: {
            ...process.env,
            NEXT_TELEMETRY_DISABLED: "1",
          },
        });
        const stdout = output
          .toString("utf-8")
          .slice(0, MAX_COMMAND_OUTPUT_CHARS);
        console.log(`   ✅ Command succeeded`);
        return stdout || "(no output)";
      } catch (error: any) {
        const stderr = error.stderr?.toString("utf-8") || "";
        const stdout = error.stdout?.toString("utf-8") || "";
        const combined = (
          stderr ||
          stdout ||
          error.message ||
          "Unknown error"
        ).slice(0, MAX_COMMAND_OUTPUT_CHARS);
        console.log(`   ❌ Command failed`);
        return `COMMAND FAILED (exit ${error.status || "?"}):\n${combined}`;
      }
    },
  });
}

/**
 * Create an install_package tool that safely installs npm packages.
 * Only allows known-safe packages from the INSTALLABLE_PACKAGES set.
 */
function createInstallPackageTool(
  cwd: string,
  verbose: boolean,
  packageManager: string,
) {
  return tool({
    name: "install_package",
    description:
      "Install one or more npm packages. Only allows known-safe packages " +
      "(react, next, swr, @types/*, mdx-related, tailwind, etc.). " +
      "Use this when a build fails due to missing modules.",
    parameters: z.object({
      packages: z
        .array(z.string())
        .describe("Array of package names to install"),
      dev: z
        .boolean()
        .default(false)
        .describe("Install as devDependency (for @types/*, typescript, etc.)"),
    }),
    execute: async (input) => {
      const pkgs = input.packages.filter((p) => {
        if (INSTALLABLE_PACKAGES.has(p)) return true;
        if (p.startsWith("@types/")) return true;
        return false;
      });

      const rejected = input.packages.filter((p) => !pkgs.includes(p));
      if (rejected.length > 0 && verbose) {
        console.log(
          `   ⚠️  Skipped (not in allowlist): ${rejected.join(", ")}`,
        );
      }

      if (pkgs.length === 0) {
        return `ERROR: No allowed packages to install. Requested: ${input.packages.join(", ")}. Allowed: ${[...INSTALLABLE_PACKAGES].join(", ")}`;
      }

      const pkgStr = pkgs.join(" ");
      let cmd: string;
      switch (packageManager) {
        case "yarn":
          cmd = `yarn add ${input.dev ? "-D " : ""}${pkgStr}`;
          break;
        case "pnpm":
          cmd = `pnpm add ${input.dev ? "-D " : ""}${pkgStr}`;
          break;
        case "bun":
          cmd = `bun add ${input.dev ? "-d " : ""}${pkgStr}`;
          break;
        default:
          cmd = `npm install ${input.dev ? "--save-dev " : ""}${pkgStr}`;
      }

      if (verbose) {
        console.log(`   📦 Installing: ${pkgStr}`);
      }

      try {
        execSync(cmd, {
          cwd,
          stdio: "pipe",
          timeout: 120_000,
        });
        console.log(`   ✅ Installed: ${pkgStr}`);
        return `OK: Installed ${pkgs.join(", ")}`;
      } catch (error: any) {
        const stderr = error.stderr?.toString("utf-8") || error.message;
        console.log(`   ❌ Install failed: ${pkgs.join(", ")}`);
        return `INSTALL FAILED: ${stderr.slice(0, 2000)}`;
      }
    },
  });
}

// ─── Repo context builder ───────────────────────────────────────────

/**
 * Build a compact representation of all source files in the project.
 * Injected into the user prompt to save the agent from spending turns on read_file.
 */
function buildRepoContext(cwd: string): string {
  const analyzer = new ProjectAnalyzer(cwd);
  const files = analyzer.readAllSourceFiles(MAX_REPO_CONTEXT_CHARS);

  if (files.length === 0) return "";

  let context = "\n## Pre-loaded Project Files\n\n";
  context +=
    "The following files have been pre-loaded. You do NOT need to read_file for these — use the content below directly.\n\n";

  for (const file of files) {
    const ext = path.extname(file.path);
    const lang =
      ext === ".json"
        ? "json"
        : ext === ".css" || ext === ".scss"
          ? "css"
          : "typescript";
    context += `### ${file.path}\n\`\`\`${lang}\n${file.content}\n\`\`\`\n\n`;
  }

  return context;
}

// ─── Agent instructions builder ─────────────────────────────────────

/**
 * Build the system instructions for the agent from project analysis + AGENTS.md.
 */
function buildAgentInstructions(
  projectInfo: ProjectInfo,
  agentsMdContent: string,
): string {
  const ctx = projectInfo.codeContext;
  const srcPrefix = projectInfo.structure.hasSrcDir ? "src/" : "";
  const buildCmd = `${projectInfo.packageManager === "npm" ? "npm run" : projectInfo.packageManager} build`;

  let instructions = `You are an expert developer agent that integrates the @nexifi/mdx-blog package into projects.
You MUST create a COMPLETE, production-ready blog integration including all pages, API routes, SEO, sitemap, and RSS feed.

You have 7 tools to interact with the project filesystem:
- **read_file**: Read any file in the project
- **write_file**: Create or update any file in the project
- **delete_file**: Delete a file (use when you created one in the wrong location)
- **list_directory**: Explore the project structure
- **search_in_files**: Grep for patterns across the project (saves turns vs reading files one by one)
- **run_command**: Run build/lint/typecheck commands
- **install_package**: Install npm packages (for fixing missing module errors)

## Project Analysis
- Framework: ${projectInfo.framework || "Unknown"}
- Router: ${projectInfo.router || "N/A"}
- TypeScript: ${projectInfo.typescript}
- Styling: ${projectInfo.styling || "Unknown"}
- Package Manager: ${projectInfo.packageManager}
- Build command: ${buildCmd}
- Has src/ directory: ${projectInfo.structure.hasSrcDir}
- Existing blog files: ${projectInfo.existingBlogFiles.join(", ") || "None"}
- Project name: ${projectInfo.projectName || "unknown"}
`;

  if (ctx) {
    instructions += `
## Code Style (MUST MATCH)
- Import style: ${ctx.importStyle}${ctx.pathAlias ? ` (alias: ${ctx.pathAlias})` : ""}
- Component naming: ${ctx.componentNaming}
- File naming: ${ctx.fileNaming}
- Export style: ${ctx.exportStyle}
- Quote style: ${ctx.quoteStyle} quotes (use ${ctx.quoteStyle === "single" ? "'" : '"'} for imports)
- Semicolons: ${ctx.semicolons ? "yes (always use semicolons)" : "no (omit semicolons)"}
- Indentation: ${ctx.indentation === "tabs" ? "tabs" : ctx.indentation === "4spaces" ? "4 spaces" : "2 spaces"}
`;
    if (ctx.layouts.length > 0) {
      instructions += `- Existing layouts: ${ctx.layouts.join(", ")}\n`;
    }
  }

  // File locations based on framework
  switch (projectInfo.framework) {
    case "nextjs":
      if (projectInfo.router === "app") {
        instructions += `
## Expected File Locations (App Router)
You MUST create ALL of these files:
- BlogProvider wrapper: ${ctx?.layouts[0] || srcPrefix + "app/layout.tsx"} (MODIFY existing)
- Blog list page: ${srcPrefix}app/blog/page.tsx (CREATE)
- Blog article page: ${srcPrefix}app/blog/[slug]/page.tsx (CREATE — with generateMetadata + generateStaticParams)
- API route (list): ${srcPrefix}app/api/blog/route.ts (CREATE)
- API route (single): ${srcPrefix}app/api/blog/[slug]/route.ts (CREATE)
- API route (categories): ${srcPrefix}app/api/blog/categories/route.ts (CREATE)
- Sitemap: ${srcPrefix}app/sitemap.ts (CREATE — dynamic sitemap using ContentAPIAdapter)
- Robots.txt: ${srcPrefix}app/robots.ts (CREATE — Next.js metadata API)
- llms.txt: ${srcPrefix}app/llms.txt/route.ts (CREATE — using generateLlmsTxt from @nexifi/mdx-blog/server)
- llms-full.txt: ${srcPrefix}app/llms-full.txt/route.ts (CREATE — using generateLlmsTxt with full content)
- RSS Feed: ${srcPrefix}app/feed.xml/route.ts (CREATE — using generateRSSFeed from @nexifi/mdx-blog/server)
`;
      } else {
        instructions += `
## Expected File Locations (Pages Router)
You MUST create ALL of these files:
- BlogProvider wrapper: ${ctx?.layouts[0] || srcPrefix + "pages/_app.tsx"} (MODIFY existing)
- Blog list page: ${srcPrefix}pages/blog/index.tsx (CREATE — with BlogListHead + BlogListSchema)
- Blog article page: ${srcPrefix}pages/blog/[slug].tsx (CREATE — with getStaticPaths/getStaticProps, ArticleHead + ArticleSchema)
- API route (list): ${srcPrefix}pages/api/blog/index.ts (CREATE)
- API route (single): ${srcPrefix}pages/api/blog/[slug].ts (CREATE)
- API route (categories): ${srcPrefix}pages/api/blog/categories.ts (CREATE)
- Sitemap page: ${srcPrefix}pages/sitemap.xml.tsx (CREATE — using SitemapPage + createSitemapServerSideProps)
- Robots.txt page: ${srcPrefix}pages/robots.txt.tsx (CREATE — using RobotsPage + createRobotsServerSideProps)
- llms.txt page: ${srcPrefix}pages/llms.txt.tsx (CREATE — using LlmsPage + createLlmsServerSideProps)
- llms-full.txt page: ${srcPrefix}pages/llms-full.txt.tsx (CREATE — using LlmsPage + createLlmsServerSideProps with full: true)
- RSS Feed API: ${srcPrefix}pages/api/feed.xml.ts (CREATE — using generateRSSFeed)
`;
      }
      break;
    case "remix":
      instructions += `
## Expected File Locations (Remix)
- BlogProvider wrapper: app/root.tsx (MODIFY existing)
- Blog list page: app/routes/blog._index.tsx (CREATE)
- Blog article page: app/routes/blog.$slug.tsx (CREATE)
`;
      break;
    case "astro":
      instructions += `
## Expected File Locations (Astro)
- Blog list page: src/pages/blog/index.astro (CREATE)
- Blog article page: src/pages/blog/[slug].astro (CREATE)
- API route: src/pages/api/blog/[...slug].ts (CREATE)
- Sitemap: Use @astrojs/sitemap integration or create src/pages/sitemap.xml.ts
- RSS Feed: src/pages/feed.xml.ts (CREATE — using generateRSSFeed from @nexifi/mdx-blog/server)
- Robots.txt: public/robots.txt (CREATE) or src/pages/robots.txt.ts for dynamic
- llms.txt: src/pages/llms.txt.ts (CREATE — using generateLlmsTxt from @nexifi/mdx-blog/server)
`;
      break;
    case "nuxt":
      instructions += `
## Expected File Locations (Nuxt)
You MUST create ALL of these files:
- BlogProvider plugin: plugins/blog.client.ts (CREATE — register BlogProvider as a Nuxt plugin)
- Blog list page: pages/blog/index.vue (CREATE — use BlogListPage inside a client-only wrapper)
- Blog article page: pages/blog/[slug].vue (CREATE — use BlogArticlePage, fetch article in useAsyncData)
- API route (list): server/api/blog/index.get.ts (CREATE — use ContentAPIAdapter server-side)
- API route (single): server/api/blog/[slug].get.ts (CREATE — use ContentAPIAdapter server-side)
- API route (categories): server/api/blog/categories.get.ts (CREATE — use ContentAPIAdapter server-side)
- Sitemap: Use @nuxtjs/sitemap module or create server/routes/sitemap.xml.get.ts
- Robots.txt: Use @nuxtjs/robots module or create server/routes/robots.txt.get.ts
- llms.txt: server/routes/llms.txt.get.ts (CREATE — using generateLlmsTxt from @nexifi/mdx-blog/server)
- RSS Feed: server/routes/feed.xml.get.ts (CREATE — using generateRSSFeed from @nexifi/mdx-blog/server)
- Environment: Add CONTENT_API_KEY and CONTENT_API_URL to nuxt.config.ts runtimeConfig
`;
      break;
    case "sveltekit":
      instructions += `
## Expected File Locations (SvelteKit)
You MUST create ALL of these files:
- BlogProvider wrapper: src/routes/+layout.svelte (MODIFY existing — wrap with BlogProvider)
- Blog list page: src/routes/blog/+page.svelte (CREATE — use BlogListPage component)
- Blog list loader: src/routes/blog/+page.server.ts (CREATE — fetch articles via ContentAPIAdapter)
- Blog article page: src/routes/blog/[slug]/+page.svelte (CREATE — use BlogArticlePage)
- Blog article loader: src/routes/blog/[slug]/+page.server.ts (CREATE — fetch single article)
- API route (list): src/routes/api/blog/+server.ts (CREATE — proxy to ContentAPIAdapter)
- API route (single): src/routes/api/blog/[slug]/+server.ts (CREATE — proxy to ContentAPIAdapter)
- API route (categories): src/routes/api/blog/categories/+server.ts (CREATE — proxy to ContentAPIAdapter)
- Sitemap: src/routes/sitemap.xml/+server.ts (CREATE — generate XML sitemap with ContentAPIAdapter)
- Robots.txt: static/robots.txt (CREATE) or src/routes/robots.txt/+server.ts for dynamic
- llms.txt: src/routes/llms.txt/+server.ts (CREATE — using generateLlmsTxt from @nexifi/mdx-blog/server)
- RSS Feed: src/routes/feed.xml/+server.ts (CREATE — using generateRSSFeed from @nexifi/mdx-blog/server)
- Environment: Add CONTENT_API_KEY and CONTENT_API_URL to .env and reference via $env/static/private
`;
      break;
  }

  if (agentsMdContent) {
    instructions += `\n## Package Documentation (AGENTS.md)\n\n${agentsMdContent}\n`;
  }

  instructions += `
## Workflow

Follow these steps IN ORDER:

### Phase 1 — Explore
1. The project files have been pre-loaded in the user message below. Review them carefully.
2. If you need to see a file that wasn't pre-loaded, use \`read_file\` to read it.
3. Understand the project structure, code style, and conventions BEFORE writing anything.

### Phase 2 — Integrate (Create ALL files)
4. Use \`write_file\` to update the root layout — add BlogProvider wrapper. ALWAYS read the current layout first if it wasn't pre-loaded. Write the COMPLETE updated file (not a diff).
5. Create API routes that proxy to ContentAPIAdapter (server-side only):
   - Blog articles list route
   - Blog single article route
   - Blog categories route
6. Create the blog list page:
   - App Router: use BlogListPage component with "use client" directive
   - Pages Router: include BlogListHead + BlogListSchema for SEO
7. Create the blog article page:
   - App Router: export generateMetadata() for SEO and generateStaticParams() for SSG (build-time), add \`export const revalidate = 3600\` for ISR, use renderMarkdown from @nexifi/mdx-blog/server (NOT next-mdx-remote/rsc)
   - Pages Router: use getStaticPaths/getStaticProps with ArticleHead + ArticleSchema for SEO
8. Create sitemap:
   - App Router: export a sitemap() function in app/sitemap.ts using ContentAPIAdapter to fetch articles at build time, add \`export const revalidate = 3600\` for ISR
   - Pages Router: use SitemapPage component with createSitemapServerSideProps
9. Create robots.txt:
   - App Router: export a robots() function in app/robots.ts (Next.js metadata API)
   - Pages Router: use RobotsPage component with createRobotsServerSideProps
10. Create RSS feed route:
    - Use generateRSSFeed from @nexifi/mdx-blog/server
11. If using Tailwind CSS, update the tailwind config to include: './node_modules/@nexifi/mdx-blog/**/*.{js,ts,jsx,tsx}'
12. Create/update .env.local with placeholder API credentials:
    - CONTENT_API_KEY=your_api_key_here
    - CONTENT_API_URL=https://api-growthos.nexifi.com/api/contentmaster/projects/YOUR_PROJECT_ID/articles
    - NEXT_PUBLIC_SITE_URL=https://your-site.com
13. Update package.json to add a "blog:validate" script: "npx @nexifi/mdx-blog validate". Read current package.json first, then write the COMPLETE updated version.

### Phase 3 — Verify & Fix
14. Run the project build: \`${buildCmd}\`
    - If the "build" script doesn't exist in package.json, try: \`npx next build\`
15. If the build fails, analyze the error and fix it. See BUILD FIX RULES below.
16. Re-run the build after each fix. Maximum 5 fix attempts.
17. Between each fix attempt, re-read the error output carefully. If the same error persists after 2 attempts, try a fundamentally different approach (different import, different file structure, etc.).
18. If after 5 attempts the build still fails, STOP. Do NOT undo the integration.

## ⚠️ CRITICAL: BUILD FIX RULES

When fixing build errors, you MUST follow these rules:

**NEVER DO THIS (absolute prohibitions):**
- ❌ NEVER delete or empty integration files to "fix" a build error
- ❌ NEVER remove imports from @nexifi/mdx-blog to fix errors
- ❌ NEVER revert changes to layout.tsx / _app.tsx to fix errors
- ❌ NEVER simplify pages by removing BlogProvider, BlogListPage, or BlogArticlePage
- ❌ NEVER replace a full page with a placeholder "Coming soon" or empty component
- ❌ NEVER remove the sitemap, robots, or RSS files to fix errors

**ALWAYS DO THIS instead:**
- ✅ If "Module not found" → use \`install_package\` to install the missing module
- ✅ If type error → fix the specific type issue in the specific file (add type assertions, fix imports)
- ✅ If "window is not defined" → you imported ContentAPIAdapter in a client component. Move it to an API route.
- ✅ If env var undefined → ensure .env.local has placeholder values (the build must work without real API keys)
- ✅ If "Cannot find module '@nexifi/mdx-blog'" → use \`install_package\` to install it
- ✅ If import error → check the exact export name in AGENTS.md documentation above
- ✅ If layout error → ensure BlogProvider is properly wrapping children, not replacing the entire layout
- ✅ If SSG error (getStaticPaths) → ensure the function returns { paths: [], fallback: 'blocking' } when API is unavailable
- ✅ If dynamic route error → add try/catch around API calls and return empty/404 gracefully

**Build must work without real API credentials.** API routes should handle missing env vars gracefully (return empty arrays / 500 errors). Pages should show loading or empty states.

## Common Build Errors & Solutions

| Error | Cause | Fix |
|-------|-------|-----|
| \`Module not found: Can't resolve 'next-mdx-remote'\` | Optional peer dep not installed | \`install_package(["next-mdx-remote"])\` |
| \`Module not found: Can't resolve '@nexifi/mdx-blog'\` | Package not installed or not linked | \`install_package(["@nexifi/mdx-blog"])\` |
| \`TypeError: Cannot read properties of undefined (reading 'slug')\` | Missing null checks on dynamic data | Add optional chaining (\`params?.slug\`) and fallback values |
| \`Error: "use client" must be the first statement\` | Directive not on line 1 | Move \`'use client';\` to the very first line, before ANY comments or imports |
| \`Type error: params is a Promise (Next.js 15+)\` | Next.js 15+ async params/searchParams | Use \`const { slug } = await params;\` in generateMetadata and page components |
| \`Error: Unsupported Server Component type: undefined\` | Mixing client/server imports | Check you're not importing client components in server context without "use client" |
| \`ReferenceError: window is not defined\` | ContentAPIAdapter used client-side | Move ContentAPIAdapter to API routes or server-only files. NEVER import in client components |
| \`Error: NEXT_NOT_FOUND\` / \`notFound() called\` | API returns null for article | Add null check: \`if (!article) return notFound();\` in server components, or \`if (!article) return { notFound: true };\` in getStaticProps |

## CRITICAL Rules
- Match the project's existing code style EXACTLY (imports, aliases, naming, formatting)
- ContentAPIAdapter must ONLY be used in server-side code (API routes, getStaticProps, loader functions, sitemap.ts, robots.ts, RSS route)
- Use TypeScript (.tsx/.ts) — the project uses TypeScript
- Client components MUST have the "use client" directive at the very top of the file
- Include proper error handling, loading states, and TypeScript types in every file
- Every file must contain COMPLETE, production-ready code — no placeholders, no "// TODO", no "..." ellipsis
- When updating existing files, ALWAYS read them first, then write the COMPLETE updated content (never partial)
- Keep all existing functionality when modifying files — only ADD the blog integration, never remove existing code
- API routes must handle errors gracefully: try/catch around ContentAPIAdapter calls, return proper HTTP error responses
- SSG functions (getStaticPaths, generateStaticParams) must handle API failures: return empty paths with fallback: 'blocking'
`;

  return instructions;
}

// ─── Prompt builder (kept for dry-run mode) ─────────────────────────

/**
 * Build the integration prompt from project analysis + AGENTS.md + full repo index.
 * Used for --dry-run mode to preview what would be sent.
 */
export function buildIntegrationPrompt(
  projectInfo: ProjectInfo,
  agentsMdPath: string,
): string {
  let agentsMd = "";
  try {
    agentsMd = fs.readFileSync(agentsMdPath, "utf-8");
  } catch {
    // No AGENTS.md available
  }
  return buildAgentInstructions(projectInfo, agentsMd);
}

// ─── Main agent entry point ─────────────────────────────────────────

/**
 * Run the AI agent to perform the integration.
 * Creates an Agent with 5 tools and lets it autonomously:
 *   1. Review pre-loaded project context
 *   2. Write all integration files (pages, API routes, sitemap, RSS, SEO)
 *   3. Build and fix errors (with anti-revert safeguards)
 *
 * On failure, rolls back all changes to leave the project clean.
 */
export async function runAgent(
  config: AgentConfig,
  projectInfo: ProjectInfo,
): Promise<AgentInstallResult> {
  const verbose = config.verbose !== false;
  const model = config.model || "gpt-5.4";

  // Resolve AGENTS.md path (from this package's root)
  const agentsMdPath = path.resolve(__dirname, "../../AGENTS.md");
  const agentsMdFallback = path.resolve(__dirname, "../../../AGENTS.md");
  const resolvedAgentsMd = fs.existsSync(agentsMdPath)
    ? agentsMdPath
    : agentsMdFallback;

  let agentsMdContent = "";
  try {
    agentsMdContent = fs.readFileSync(resolvedAgentsMd, "utf-8");
  } catch {
    // No AGENTS.md
  }

  // Track files
  const createdFiles = new Set<string>();
  const modifiedFiles = new Set<string>();

  // Snapshot files for rollback on failure
  const snapshots = snapshotFiles(config.cwd, projectInfo);

  // Create tools (7 tools)
  const tools = [
    createReadFileTool(config.cwd, verbose),
    createWriteFileTool(config.cwd, verbose, createdFiles, modifiedFiles),
    createDeleteFileTool(config.cwd, verbose, createdFiles),
    createListDirectoryTool(config.cwd, verbose),
    createSearchInFilesTool(config.cwd, verbose),
    createRunCommandTool(config.cwd, verbose),
    createInstallPackageTool(config.cwd, verbose, projectInfo.packageManager),
  ];

  // Build agent instructions
  const instructions = buildAgentInstructions(projectInfo, agentsMdContent);

  if (verbose) {
    console.log(`   🧠 Model: ${model}`);
    console.log(`   🔧 Tools: ${tools.map((t) => t.name).join(", ")}`);
    console.log(
      `   📝 Instructions: ${(instructions.length / 1024).toFixed(1)} KB`,
    );
    console.log(`   🔄 Max turns: ${MAX_AGENT_TURNS}\n`);
  }

  // Create the agent
  const agent = new Agent({
    name: "BlogIntegrationAgent",
    model,
    instructions,
    tools,
  });

  // Build repo context (pre-load all source files)
  let repoContext = "";
  try {
    repoContext = buildRepoContext(config.cwd);
    if (verbose && repoContext) {
      console.log(
        `   📁 Pre-loaded ${repoContext.split("###").length - 1} project files\n`,
      );
    }
  } catch {
    // Non-critical — agent will use read_file instead
  }

  // Build the user prompt with pre-loaded context
  const buildCmd = `${projectInfo.packageManager === "npm" ? "npm run" : projectInfo.packageManager} build`;
  const userPrompt = `Integrate @nexifi/mdx-blog into this ${projectInfo.framework || "unknown"} project.

The project is at: ${config.cwd}
Package manager: ${projectInfo.packageManager}
Build command: ${buildCmd}

Review the pre-loaded project files below, then create ALL necessary integration files.
After creating all files, run the build to verify. Fix any errors WITHOUT removing the integration.
${repoContext}`;

  console.log("   🤖 Agent is starting autonomous integration...\n");

  try {
    const result = await run(agent, userPrompt, { maxTurns: MAX_AGENT_TURNS });

    console.log(`\n   📊 Agent completed.`);
    console.log(
      `   📁 Files created: ${createdFiles.size}, modified: ${modifiedFiles.size}`,
    );

    if (verbose && result.state) {
      const state = result.state as any;
      if (state.usage) {
        const u = state.usage;
        console.log(
          `   📊 Tokens: ${u.prompt_tokens || u.input_tokens || "?"} in / ${u.completion_tokens || u.output_tokens || "?"} out`,
        );
      }
    }

    return {
      success: true,
      filesCreated: [...createdFiles],
      filesModified: [...modifiedFiles],
    };
  } catch (error: any) {
    console.error(`\n   ❌ Agent error: ${error.message}`);

    if (config.keepOnFailure) {
      console.log(
        `\n   ⚠️  --keep-on-failure: Keeping ${createdFiles.size} created and ${modifiedFiles.size} modified files.`,
      );
      console.log(
        "   💡 Run 'npx @nexifi/mdx-blog validate' to check integration state.\n",
      );
    } else {
      // Rollback all changes on failure
      rollback(config.cwd, snapshots, createdFiles);
    }

    return {
      success: false,
      error: error.message,
      filesCreated: config.keepOnFailure ? [...createdFiles] : undefined,
      filesModified: config.keepOnFailure ? [...modifiedFiles] : undefined,
    };
  }
}

export default {
  runAgent,
  buildIntegrationPrompt,
};
