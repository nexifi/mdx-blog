/**
 * Validate Command
 *
 * Checks if the @nexifi/mdx-blog integration is complete.
 */

import fs from "fs";
import path from "path";
import { ProjectAnalyzer } from "../agent/analyzer.js";

interface ValidationResult {
  check: string;
  status: "pass" | "fail" | "warn";
  message: string;
}

export async function validateCommand(args: string[]): Promise<void> {
  const cwd = process.cwd();
  const results: ValidationResult[] = [];

  console.log("🔍 Validating @nexifi/mdx-blog integration\n");
  console.log(`Working directory: ${cwd}\n`);
  console.log("─".repeat(50));

  // Analyze project
  const analyzer = new ProjectAnalyzer(cwd);
  const projectInfo = await analyzer.analyze();

  // 1. Check package installed
  if (isPackageInstalled(projectInfo.dependencies)) {
    log(results, {
      check: "Package installed",
      status: "pass",
      message: "Found in dependencies",
    });
  } else {
    log(results, {
      check: "Package installed",
      status: "fail",
      message: "Not found in package.json",
    });
  }

  // 2. Check peer dependencies
  const missingPeers = checkPeerDependencies(projectInfo.dependencies);
  if (missingPeers.length === 0) {
    log(results, {
      check: "Peer dependencies",
      status: "pass",
      message: "All required packages installed",
    });
  } else {
    log(results, {
      check: "Peer dependencies",
      status: "fail",
      message: `Missing: ${missingPeers.join(", ")}`,
    });
  }

  // 3. Framework detection
  if (projectInfo.framework) {
    const desc = projectInfo.router
      ? `${projectInfo.framework} (${projectInfo.router} router)`
      : projectInfo.framework;
    log(results, {
      check: "Framework detection",
      status: "pass",
      message: `Detected: ${desc}`,
    });
  } else {
    log(results, {
      check: "Framework detection",
      status: "warn",
      message: "Could not detect framework",
    });
  }

  // 4. Check provider setup
  if (projectInfo.framework) {
    if (checkProviderSetup(cwd, projectInfo)) {
      log(results, {
        check: "Provider setup",
        status: "pass",
        message: "BlogProvider configured",
      });
    } else {
      log(results, {
        check: "Provider setup",
        status: "fail",
        message: "BlogProvider not found",
      });
    }
  }

  // 5. Check blog pages
  if (projectInfo.framework) {
    const pages = checkBlogPages(cwd, projectInfo);
    if (pages.list && pages.article) {
      log(results, {
        check: "Blog pages",
        status: "pass",
        message: "List and article pages exist",
      });
    } else if (pages.list || pages.article) {
      const missing = !pages.list ? "list page" : "article page";
      log(results, {
        check: "Blog pages",
        status: "warn",
        message: `Missing ${missing}`,
      });
    } else {
      log(results, {
        check: "Blog pages",
        status: "fail",
        message: "No blog pages found",
      });
    }
  }

  // 6. Check API routes
  if (projectInfo.framework) {
    if (checkApiRoutes(cwd, projectInfo)) {
      log(results, {
        check: "API routes",
        status: "pass",
        message: "Articles API route exists",
      });
    } else {
      log(results, {
        check: "API routes",
        status: "warn",
        message: "No API routes found",
      });
    }
  }

  // 7. Check environment variables
  if (checkEnvVar(cwd)) {
    log(results, {
      check: "Environment variables",
      status: "pass",
      message: "CONTENT_API_KEY configured",
    });
  } else {
    log(results, {
      check: "Environment variables",
      status: "warn",
      message: "CONTENT_API_KEY not found",
    });
  }

  // 8. Check Tailwind config
  if (projectInfo.styling === "tailwind") {
    if (checkTailwindConfig(cwd)) {
      log(results, {
        check: "Tailwind config",
        status: "pass",
        message: "Package in content paths",
      });
    } else {
      log(results, {
        check: "Tailwind config",
        status: "warn",
        message: "Package not in Tailwind content",
      });
    }

    if (checkTypographyPlugin(cwd)) {
      log(results, {
        check: "Typography plugin",
        status: "pass",
        message: "@tailwindcss/typography configured",
      });
    } else {
      log(results, {
        check: "Typography plugin",
        status: "warn",
        message:
          "@tailwindcss/typography not found — prose classes won't work (npm install @tailwindcss/typography)",
      });
    }
  }

  // 9. Check sitemap
  if (projectInfo.framework === "nextjs") {
    if (checkSitemap(cwd, projectInfo)) {
      log(results, {
        check: "Sitemap",
        status: "pass",
        message: "Sitemap file exists",
      });
    } else {
      log(results, {
        check: "Sitemap",
        status: "warn",
        message: "No sitemap file found (recommended for SEO)",
      });
    }
  }

  // 10. Check robots.txt
  if (projectInfo.framework === "nextjs") {
    if (checkRobots(cwd, projectInfo)) {
      log(results, {
        check: "Robots.txt",
        status: "pass",
        message: "Robots.txt file exists",
      });
    } else {
      log(results, {
        check: "Robots.txt",
        status: "warn",
        message: "No robots.txt file found (recommended for SEO)",
      });
    }
  }

  // 11. Check llms.txt
  if (projectInfo.framework === "nextjs") {
    if (checkLlmsTxt(cwd, projectInfo)) {
      log(results, {
        check: "llms.txt",
        status: "pass",
        message: "llms.txt file/route exists",
      });
    } else {
      log(results, {
        check: "llms.txt",
        status: "warn",
        message: "No llms.txt file found (recommended for AI discoverability)",
      });
    }
  }

  // 12. Check RSS feed
  if (projectInfo.framework === "nextjs") {
    if (checkRSSFeed(cwd, projectInfo)) {
      log(results, {
        check: "RSS Feed",
        status: "pass",
        message: "RSS feed route exists",
      });
    } else {
      log(results, {
        check: "RSS Feed",
        status: "warn",
        message: "No RSS feed route found (recommended)",
      });
    }
  }

  // Summary
  console.log("\n" + "─".repeat(50));
  const passed = results.filter((r) => r.status === "pass").length;
  const warnings = results.filter((r) => r.status === "warn").length;
  const failed = results.filter((r) => r.status === "fail").length;

  console.log(
    `\n📊 Summary: ${passed} passed, ${warnings} warnings, ${failed} failed\n`,
  );

  if (failed > 0) {
    console.log(
      "❌ Integration incomplete. Please review the failed checks above.\n",
    );
    process.exit(1);
  } else if (warnings > 0) {
    console.log(
      "⚠️  Integration mostly complete, but some optional features may be missing.\n",
    );
    process.exit(0);
  } else {
    console.log("✅ Integration complete! Your blog is ready to use.\n");
    process.exit(0);
  }
}

function log(results: ValidationResult[], result: ValidationResult) {
  const icon =
    result.status === "pass" ? "✅" : result.status === "warn" ? "⚠️" : "❌";
  console.log(`${icon} ${result.check}: ${result.message}`);
  results.push(result);
}

function isPackageInstalled(deps: Record<string, string>): boolean {
  return "@nexifi/mdx-blog" in deps;
}

function checkPeerDependencies(deps: Record<string, string>): string[] {
  const required = ["react", "react-dom", "swr"];
  return required.filter((dep) => !(dep in deps));
}

function checkProviderSetup(cwd: string, projectInfo: any): boolean {
  const files: string[] = [];

  switch (projectInfo.framework) {
    case "nextjs":
      if (projectInfo.router === "app") {
        files.push(
          "app/layout.tsx",
          "app/layout.jsx",
          "src/app/layout.tsx",
          "src/app/layout.jsx",
          "app/providers.tsx",
          "app/providers.jsx",
          "src/app/providers.tsx",
        );
      } else {
        files.push("pages/_app.tsx", "pages/_app.jsx", "src/pages/_app.tsx");
      }
      break;
    case "remix":
      files.push("app/root.tsx", "app/root.jsx");
      break;
    case "nuxt":
      files.push("composables/useBlog.ts", "composables/useBlog.js");
      break;
    case "sveltekit":
      files.push("src/lib/blog-store.ts", "src/lib/blog-store.js");
      break;
    case "astro":
      return true; // Astro doesn't need global provider
  }

  for (const file of files) {
    const filePath = path.join(cwd, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8");
      if (
        content.includes("BlogProvider") ||
        content.includes("@nexifi/mdx-blog")
      ) {
        return true;
      }
    }
  }

  return false;
}

function checkBlogPages(
  cwd: string,
  projectInfo: any,
): { list: boolean; article: boolean } {
  const checks: Record<string, { list: string[]; article: string[] }> = {
    "nextjs-app": {
      list: ["app/blog/page.tsx", "src/app/blog/page.tsx"],
      article: ["app/blog/[slug]/page.tsx", "src/app/blog/[slug]/page.tsx"],
    },
    "nextjs-pages": {
      list: ["pages/blog/index.tsx", "src/pages/blog/index.tsx"],
      article: ["pages/blog/[slug].tsx", "src/pages/blog/[slug].tsx"],
    },
    remix: {
      list: ["app/routes/blog._index.tsx"],
      article: ["app/routes/blog.$slug.tsx"],
    },
    astro: {
      list: ["src/pages/blog/index.astro"],
      article: ["src/pages/blog/[slug].astro"],
    },
    nuxt: {
      list: ["pages/blog/index.vue"],
      article: ["pages/blog/[slug].vue"],
    },
    sveltekit: {
      list: ["src/routes/blog/+page.svelte"],
      article: ["src/routes/blog/[slug]/+page.svelte"],
    },
  };

  const key =
    projectInfo.framework === "nextjs"
      ? `nextjs-${projectInfo.router}`
      : projectInfo.framework;

  const paths = checks[key] || { list: [], article: [] };

  return {
    list: paths.list.some((p) => fs.existsSync(path.join(cwd, p))),
    article: paths.article.some((p) => fs.existsSync(path.join(cwd, p))),
  };
}

function checkApiRoutes(cwd: string, projectInfo: any): boolean {
  const routes: Record<string, string[]> = {
    "nextjs-app": [
      "app/api/blog/route.ts",
      "src/app/api/blog/route.ts",
      "app/api/articles/route.ts",
      "src/app/api/articles/route.ts",
    ],
    "nextjs-pages": [
      "pages/api/blog/index.ts",
      "src/pages/api/blog/index.ts",
      "pages/api/articles/index.ts",
      "src/pages/api/articles/index.ts",
    ],
    remix: ["app/routes/api.blog.tsx", "app/routes/api.articles.tsx"],
    astro: ["src/pages/api/blog.ts", "src/pages/api/articles.ts"],
    nuxt: ["server/api/blog/index.get.ts", "server/api/articles/index.get.ts"],
    sveltekit: [
      "src/routes/api/blog/+server.ts",
      "src/routes/api/articles/+server.ts",
    ],
  };

  const key =
    projectInfo.framework === "nextjs"
      ? `nextjs-${projectInfo.router}`
      : projectInfo.framework;

  const paths = routes[key] || [];
  return paths.some((p) => fs.existsSync(path.join(cwd, p)));
}

function checkSitemap(cwd: string, projectInfo: any): boolean {
  const files: Record<string, string[]> = {
    "nextjs-app": [
      "app/sitemap.ts",
      "src/app/sitemap.ts",
      "app/sitemap.tsx",
      "src/app/sitemap.tsx",
    ],
    "nextjs-pages": [
      "pages/sitemap.xml.tsx",
      "src/pages/sitemap.xml.tsx",
      "pages/sitemap.xml.ts",
      "src/pages/sitemap.xml.ts",
    ],
  };

  const key =
    projectInfo.framework === "nextjs"
      ? `nextjs-${projectInfo.router}`
      : projectInfo.framework;

  const paths = files[key] || [];
  return paths.some((p) => fs.existsSync(path.join(cwd, p)));
}

function checkRobots(cwd: string, projectInfo: any): boolean {
  const files: Record<string, string[]> = {
    "nextjs-app": [
      "app/robots.ts",
      "src/app/robots.ts",
      "app/robots.tsx",
      "src/app/robots.tsx",
    ],
    "nextjs-pages": [
      "pages/robots.txt.tsx",
      "src/pages/robots.txt.tsx",
      "pages/robots.txt.ts",
      "src/pages/robots.txt.ts",
    ],
  };

  const key =
    projectInfo.framework === "nextjs"
      ? `nextjs-${projectInfo.router}`
      : projectInfo.framework;

  const paths = files[key] || [];
  return paths.some((p) => fs.existsSync(path.join(cwd, p)));
}

function checkLlmsTxt(cwd: string, projectInfo: any): boolean {
  const files: Record<string, string[]> = {
    "nextjs-app": [
      "app/llms.txt/route.ts",
      "src/app/llms.txt/route.ts",
      "app/llms.txt/route.tsx",
      "src/app/llms.txt/route.tsx",
      "public/llms.txt",
    ],
    "nextjs-pages": [
      "pages/llms.txt.tsx",
      "src/pages/llms.txt.tsx",
      "pages/llms.txt.ts",
      "src/pages/llms.txt.ts",
      "public/llms.txt",
    ],
  };

  const key =
    projectInfo.framework === "nextjs"
      ? `nextjs-${projectInfo.router}`
      : projectInfo.framework;

  const paths = files[key] || [];
  return paths.some((p) => fs.existsSync(path.join(cwd, p)));
}

function checkRSSFeed(cwd: string, projectInfo: any): boolean {
  const files: Record<string, string[]> = {
    "nextjs-app": [
      "app/feed.xml/route.ts",
      "src/app/feed.xml/route.ts",
      "app/rss.xml/route.ts",
      "src/app/rss.xml/route.ts",
    ],
    "nextjs-pages": [
      "pages/api/feed.xml.ts",
      "src/pages/api/feed.xml.ts",
      "pages/api/rss.xml.ts",
      "src/pages/api/rss.xml.ts",
    ],
  };

  const key =
    projectInfo.framework === "nextjs"
      ? `nextjs-${projectInfo.router}`
      : projectInfo.framework;

  const paths = files[key] || [];
  return paths.some((p) => fs.existsSync(path.join(cwd, p)));
}

function checkEnvVar(cwd: string): boolean {
  const envFiles = [".env", ".env.local", ".env.development"];

  for (const envFile of envFiles) {
    const envPath = path.join(cwd, envFile);
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      if (
        content.includes("CONTENT_API_KEY") &&
        !content.includes("#CONTENT_API_KEY")
      ) {
        return true;
      }
    }
  }

  return false;
}

function checkTailwindConfig(cwd: string): boolean {
  const configFiles = [
    "tailwind.config.js",
    "tailwind.config.ts",
    "tailwind.config.mjs",
  ];

  for (const configFile of configFiles) {
    const configPath = path.join(cwd, configFile);
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, "utf-8");
      if (content.includes("@nexifi/mdx-blog")) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check that @tailwindcss/typography is configured.
 * Looks for:
 * - Tailwind v4: `@plugin "@tailwindcss/typography"` in CSS files
 * - Tailwind v3: `require('@tailwindcss/typography')` or `@tailwindcss/typography` in config files
 * - package.json: `@tailwindcss/typography` in dependencies
 */
function checkTypographyPlugin(cwd: string): boolean {
  // Check package.json for the dependency
  const pkgPath = path.join(cwd, "package.json");
  if (fs.existsSync(pkgPath)) {
    const pkg = fs.readFileSync(pkgPath, "utf-8");
    if (pkg.includes("@tailwindcss/typography")) {
      return true;
    }
  }

  // Check Tailwind v3 config files
  const configFiles = [
    "tailwind.config.js",
    "tailwind.config.ts",
    "tailwind.config.mjs",
  ];
  for (const configFile of configFiles) {
    const configPath = path.join(cwd, configFile);
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, "utf-8");
      if (content.includes("@tailwindcss/typography")) {
        return true;
      }
    }
  }

  // Check Tailwind v4 CSS files for @plugin directive
  const cssGlobs = ["src/app/globals.css", "src/index.css", "app/globals.css", "styles/globals.css"];
  for (const cssFile of cssGlobs) {
    const cssPath = path.join(cwd, cssFile);
    if (fs.existsSync(cssPath)) {
      const content = fs.readFileSync(cssPath, "utf-8");
      if (content.includes("@tailwindcss/typography")) {
        return true;
      }
    }
  }

  return false;
}
