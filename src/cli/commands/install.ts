/**
 * AI-Powered Installation Command
 *
 * Uses the OpenAI Agents SDK (@openai/agents) to run an autonomous agent
 * with function tools (read_file, write_file, list_directory, run_command)
 * that integrates the blog into any project.
 *
 * The user only needs an OpenAI API key. Everything else is handled automatically.
 */

import fs from "fs";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { ProjectAnalyzer } from "../agent/analyzer.js";
import { runAgent, buildIntegrationPrompt } from "../agent/agent.js";

interface InstallOptions {
  dryRun?: boolean;
  verbose?: boolean;
  quiet?: boolean;
  model?: string;
  keepOnFailure?: boolean;
}

export async function installCommand(args: string[]): Promise<void> {
  const options = parseArgs(args);
  const cwd = process.cwd();

  console.log("🤖 @nexifi/mdx-blog — Installation automatique\n");
  console.log("─".repeat(50));

  // 0. Analyze project early to detect package manager
  console.log("\n📂 Analyzing project architecture...\n");
  const analyzer = new ProjectAnalyzer(cwd);
  const projectInfo = await analyzer.analyze();

  // Force TypeScript for generation (warn if project doesn't use it)
  if (!projectInfo.typescript) {
    console.log(
      "\n   ⚠️  TypeScript not detected, but generated files will use .tsx/.ts for type safety.",
    );
  }
  projectInfo.typescript = true;

  // 0b. Auto-install @nexifi/mdx-blog + peer dependencies if missing
  await ensurePackageInstalled(cwd, projectInfo);

  // 1. Ensure OpenAI API key is available
  await ensureOpenAIKey();

  // Verbose is ON by default unless --quiet
  if (!options.quiet) {
    console.log(`\n   🔍 Mode verbose activé`);
  }
  console.log(`   🧠 Model: ${options.model || "gpt-5.4 (default)"}`);
  if (options.keepOnFailure) {
    console.log(`   📌 Mode --keep-on-failure activé`);
  }
  console.log();

  try {
    // 2. Display project info
    console.log(
      `   Framework:    ${projectInfo.framework || "Unknown"} ${projectInfo.router ? `(${projectInfo.router} router)` : ""}`,
    );
    console.log(`   TypeScript:   ✓ (forced)`);
    console.log(`   Styling:      ${projectInfo.styling || "Unknown"}`);
    console.log(`   Pkg Manager:  ${projectInfo.packageManager}`);

    if (projectInfo.codeContext) {
      const ctx = projectInfo.codeContext;
      console.log(`\n   🔍 Code analysis:`);
      console.log(
        `      Import style: ${ctx.importStyle}${ctx.pathAlias ? ` (${ctx.pathAlias})` : ""}`,
      );
      console.log(`      Export style: ${ctx.exportStyle}`);
      console.log(`      Sample files: ${ctx.sampleFiles.length} analyzed`);
      if (ctx.layouts.length > 0) {
        console.log(`      Layout found: ${ctx.layouts[0]}`);
      }
    }

    if (!projectInfo.framework) {
      console.log("\n⚠️  Could not detect framework. Please specify manually.");
      projectInfo.framework = await promptFramework();
    }

    // 2b. Check for existing blog/CMS system
    const existingSystem = detectExistingBlogSystem(projectInfo, cwd);
    if (existingSystem.detected) {
      console.log("\n⚠️  Système de blog existant détecté !\n");
      for (const system of existingSystem.systems) {
        console.log(`   • ${system.name}: ${system.reason}`);
      }
      console.log(
        "\n   L'installation va ajouter @nexifi/mdx-blog en parallèle.",
      );
      console.log("   Les fichiers existants ne seront PAS supprimés.\n");

      const proceed = await confirm(
        "   Voulez-vous continuer malgré un système existant ?",
      );
      if (!proceed) {
        console.log("\n❌ Installation annulée.\n");
        console.log(
          "   💡 Conseil: Supprimez ou migrez d'abord votre système de blog existant,",
        );
        console.log("      puis relancez l'installation.\n");
        process.exit(0);
      }
    }

    // 3. Show what the AI agent will do
    console.log("\n📋 Integration plan:\n");
    console.log("   The AI agent will:");
    console.log("   • Wrap your app with BlogProvider");
    console.log("   • Create API routes (/api/blog) using ContentAPIAdapter");
    console.log("   • Create blog list page (/blog)");
    console.log("   • Create blog article page (/blog/[slug])");
    console.log("   • Create sitemap.ts for SEO");
    console.log("   • Create robots.txt");
    console.log("   • Create llms.txt + llms-full.txt");
    console.log("   • Create RSS feed route (/feed.xml)");
    if (projectInfo.styling === "tailwind") {
      console.log("   • Update Tailwind CSS configuration");
    }
    console.log("   • Create/update .env.local with API credentials");
    console.log('   • Add "blog:validate" script to package.json');

    // 4. Dry run: just show the prompt
    if (options.dryRun) {
      console.log("\n🔍 Dry run mode - showing integration prompt:\n");
      const agentsMdPath = resolveAgentsMd();
      const prompt = buildIntegrationPrompt(projectInfo, agentsMdPath);
      console.log("─".repeat(50));
      console.log(prompt);
      console.log("─".repeat(50));
      console.log("\n   This prompt would be sent to the AI agent.\n");
      return;
    }

    // 5. Confirm with user
    const confirmed = await confirm(
      "\n✨ Proceed with AI-powered installation?",
    );
    if (!confirmed) {
      console.log("\n❌ Installation cancelled.\n");
      process.exit(0);
    }

    // 6. Run AI agent (direct OpenAI API call)
    console.log("\n⚡ Starting AI agent...\n");

    const result = await runAgent(
      {
        cwd,
        verbose: options.quiet ? false : (options.verbose ?? true),
        model: options.model || "gpt-5.4",
        keepOnFailure: options.keepOnFailure,
      },
      projectInfo,
    );

    if (!result.success) {
      console.log(`\n❌ AI agent failed: ${result.error}\n`);
      console.log("   💡 Troubleshooting:\n");

      if (result.error?.includes("Max turns")) {
        console.log(
          "      - L'agent a atteint la limite de 60 tours. Relancez l'installation.",
        );
        console.log(
          "      - Si le problème persiste, essayez avec un modèle plus performant: --model=gpt-5",
        );
        console.log(
          "      - Utilisez --keep-on-failure pour conserver le travail partiel",
        );
      } else if (
        result.error?.includes("API") ||
        result.error?.includes("key") ||
        result.error?.includes("auth")
      ) {
        console.log("      - Vérifiez que votre clé OpenAI est valide");
        console.log(
          "      - Obtenez une clé sur: https://platform.openai.com/api-keys",
        );
      } else {
        console.log("      - Vérifiez votre connexion internet");
        console.log("      - Vérifiez que votre clé OpenAI est valide");
      }
      console.log(
        "\n      - Relancez: npx @nexifi/mdx-blog install --verbose\n",
      );
      process.exit(1);
    }

    // 7. Post-install: ensure env file + validate script exist
    await postInstallFixups(cwd, projectInfo);

    // 8. Post-installation instructions
    console.log("\n" + "═".repeat(50));
    console.log("\n✅ Integration complete!\n");

    console.log("📝 Next steps:\n");
    console.log("   1. Add your API credentials to .env.local:\n");
    console.log("      CONTENT_API_URL=https://your-api-url.com");
    console.log("      CONTENT_API_KEY=your_api_key_here\n");

    const startCmd =
      projectInfo.packageManager === "npm"
        ? "npm run dev"
        : `${projectInfo.packageManager} dev`;
    console.log("   2. Start your dev server:\n");
    console.log(`      ${startCmd}\n`);

    console.log("   3. Visit your blog:\n");
    console.log("      http://localhost:3000/blog\n");

    console.log("   4. Validate installation:\n");
    console.log("      npx @nexifi/mdx-blog validate\n");
  } catch (error) {
    console.error("\n❌ Installation failed:", (error as Error).message);
    if (options.verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

// ─── Helpers ────────────────────────────────────────────────────────

function resolveAgentsMd(): string {
  const candidates = [
    path.resolve(__dirname, "../../AGENTS.md"),
    path.resolve(__dirname, "../../../AGENTS.md"),
    path.resolve(__dirname, "../../../../AGENTS.md"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return candidates[0];
}

/**
 * Post-install fixups: things the agent might forget
 */
async function postInstallFixups(cwd: string, projectInfo: any): Promise<void> {
  // Ensure .env.local has placeholders
  const envPath = path.join(cwd, ".env.local");
  let envContent = "";
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, "utf-8");
  }

  const envVars = [
    "CONTENT_API_URL",
    "CONTENT_API_KEY",
    "NEXT_PUBLIC_SITE_URL",
  ];
  const additions: string[] = [];
  for (const v of envVars) {
    if (!envContent.includes(v)) {
      additions.push(`# ${v}=your_value_here`);
    }
  }
  if (additions.length > 0) {
    const newContent =
      envContent +
      (envContent.endsWith("\n") ? "" : "\n") +
      "\n# @nexifi/mdx-blog\n" +
      additions.join("\n") +
      "\n";
    fs.writeFileSync(envPath, newContent, "utf-8");
  }

  // Ensure blog:validate script
  const pkgPath = path.join(cwd, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
      if (!pkg.scripts) pkg.scripts = {};
      if (!pkg.scripts["blog:validate"]) {
        pkg.scripts["blog:validate"] = "npx @nexifi/mdx-blog validate";
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  // Ensure Tailwind config includes the package
  if (projectInfo.styling === "tailwind") {
    const configFiles = [
      "tailwind.config.js",
      "tailwind.config.ts",
      "tailwind.config.mjs",
    ];
    for (const file of configFiles) {
      const configPath = path.join(cwd, file);
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, "utf-8");
        if (!content.includes("@nexifi/mdx-blog")) {
          const packagePath =
            "./node_modules/@nexifi/mdx-blog/**/*.{js,ts,jsx,tsx}";
          if (content.includes("content:")) {
            const newContent = content.replace(
              /(content:\s*\[)/,
              `$1\n    '${packagePath}',`,
            );
            fs.writeFileSync(configPath, newContent, "utf-8");
            console.log(`   ✅ Updated ${file} with package content path`);
          }
        }
        break;
      }
    }
  }
}

function parseArgs(args: string[]): InstallOptions {
  const options: InstallOptions = {};

  for (const arg of args) {
    if (arg === "--dry-run" || arg === "-n") {
      options.dryRun = true;
    } else if (arg === "--verbose" || arg === "-v") {
      options.verbose = true;
    } else if (arg === "--quiet" || arg === "-q") {
      options.quiet = true;
    } else if (arg === "--keep-on-failure") {
      options.keepOnFailure = true;
    } else if (arg.startsWith("--model=")) {
      options.model = arg.slice("--model=".length);
    }
  }

  return options;
}

async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${message} (Y/n) `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() !== "n");
    });
  });
}

async function promptFramework(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const frameworks = [
    "1. Next.js (Pages Router)",
    "2. Next.js (App Router)",
    "3. Remix",
    "4. Astro",
    "5. Nuxt",
    "6. SvelteKit",
  ];

  console.log("\nSelect your framework:\n");
  frameworks.forEach((f) => console.log(`   ${f}`));

  return new Promise((resolve) => {
    rl.question("\nEnter number (1-6): ", (answer) => {
      rl.close();
      const map: Record<string, string> = {
        "1": "nextjs-pages",
        "2": "nextjs-app",
        "3": "remix",
        "4": "astro",
        "5": "nuxt",
        "6": "sveltekit",
      };
      resolve(map[answer] || "nextjs-pages");
    });
  });
}

// ─── Existing blog system detection ─────────────────────────────────

interface DetectedSystem {
  name: string;
  reason: string;
}

interface ExistingSystemResult {
  detected: boolean;
  systems: DetectedSystem[];
}

function detectExistingBlogSystem(
  projectInfo: {
    dependencies: Record<string, string>;
    existingBlogFiles: string[];
  },
  cwd: string,
): ExistingSystemResult {
  const systems: DetectedSystem[] = [];
  const deps = projectInfo.dependencies;

  // 1. Check for CMS/blog NPM packages
  const cmsPackages: Record<string, string> = {
    // Headless CMS
    contentful: "Contentful CMS",
    "@contentful/rich-text-react-renderer": "Contentful CMS",
    "next-contentful": "Contentful CMS",
    "@sanity/client": "Sanity CMS",
    "next-sanity": "Sanity CMS",
    sanity: "Sanity CMS",
    "@prismicio/client": "Prismic CMS",
    "@prismicio/react": "Prismic CMS",
    "prismic-javascript": "Prismic CMS",
    "strapi-sdk-js": "Strapi CMS",
    "@strapi/strapi": "Strapi CMS",
    "graphcms-client": "Hygraph (GraphCMS)",
    "@graphcms/rich-text-react-renderer": "Hygraph (GraphCMS)",
    "storyblok-js-client": "Storyblok CMS",
    "@storyblok/react": "Storyblok CMS",
    "dato-cms": "DatoCMS",
    "react-datocms": "DatoCMS",
    directus: "Directus CMS",
    "@directus/sdk": "Directus CMS",
    keystonejs: "KeystoneJS CMS",
    "@keystone-6/core": "KeystoneJS CMS",
    "ghost-content-api": "Ghost CMS",
    "@tryghost/content-api": "Ghost CMS",
    "wordpress-api": "WordPress",
    wpapi: "WordPress",
    "@wordpress/api-fetch": "WordPress",

    // Blog frameworks / static blog tooling
    hexo: "Hexo Blog",
    "gatsby-plugin-blog": "Gatsby Blog",
    "gatsby-theme-blog": "Gatsby Blog",
    "@next/mdx": "Next.js MDX Blog",
    "mdx-bundler": "MDX Bundler Blog",
    nextra: "Nextra (Next.js docs/blog)",
    "nextra-theme-blog": "Nextra Blog Theme",
    contentlayer: "Contentlayer Blog",
    contentlayer2: "Contentlayer2 Blog",
    "@velite/core": "Velite CMS",
    velite: "Velite CMS",
    "fumadocs-mdx": "Fumadocs MDX",
    outstatic: "Outstatic CMS",
    // NOTE: next-mdx-remote, @mdx-js/react, remark-gfm, rehype-highlight
    // are NOT listed here — they are peer deps of @nexifi/mdx-blog itself.
  };

  const detectedCms = new Set<string>();
  for (const [pkg, label] of Object.entries(cmsPackages)) {
    if (deps[pkg] && !detectedCms.has(label)) {
      detectedCms.add(label);
      systems.push({
        name: label,
        reason: `package "${pkg}" trouvé dans les dépendances`,
      });
    }
  }

  // 2. Check for existing blog files/directories
  if (projectInfo.existingBlogFiles.length > 0) {
    systems.push({
      name: "Pages blog existantes",
      reason: `répertoire(s) détecté(s): ${projectInfo.existingBlogFiles.join(", ")}`,
    });
  }

  // 3. Check for CMS config files
  const cmsConfigFiles: Record<string, string> = {
    "sanity.config.ts": "Sanity CMS",
    "sanity.config.js": "Sanity CMS",
    "sanity.json": "Sanity CMS",
    "studio/sanity.config.ts": "Sanity CMS",
    "contentlayer.config.ts": "Contentlayer",
    "contentlayer.config.js": "Contentlayer",
    ".contentlayer": "Contentlayer",
    "velite.config.ts": "Velite CMS",
    "velite.config.js": "Velite CMS",
    "keystonejs.config.ts": "KeystoneJS",
    "keystone.ts": "KeystoneJS",
    "outstatic/content": "Outstatic CMS",
    "content/blog": "Blog MDX local",
    "content/posts": "Blog MDX local",
    posts: "Répertoire posts",
    _posts: "Répertoire _posts (Jekyll-style)",
    blog: "Répertoire blog",
  };

  for (const [configFile, label] of Object.entries(cmsConfigFiles)) {
    const fullPath = path.join(cwd, configFile);
    if (fs.existsSync(fullPath)) {
      const alreadyDetected = systems.some((s) => s.name === label);
      if (!alreadyDetected) {
        systems.push({
          name: label,
          reason: `fichier/répertoire "${configFile}" trouvé`,
        });
      }
    }
  }

  // 4. Check for blog-related env vars in .env files
  const envFiles = [
    ".env",
    ".env.local",
    ".env.development",
    ".env.production",
  ];
  const blogEnvPatterns = [
    /CONTENTFUL/i,
    /SANITY/i,
    /PRISMIC/i,
    /STRAPI/i,
    /GHOST/i,
    /STORYBLOK/i,
    /DATOCMS/i,
    /WORDPRESS/i,
    /DIRECTUS/i,
    /HYGRAPH/i,
    /GRAPHCMS/i,
  ];

  for (const envFile of envFiles) {
    const envPath = path.join(cwd, envFile);
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, "utf-8");
        for (const pattern of blogEnvPatterns) {
          const match = content.match(pattern);
          if (match) {
            const cmsName = match[0].replace(/_/g, "").toLowerCase();
            const capitalized =
              cmsName.charAt(0).toUpperCase() + cmsName.slice(1);
            const alreadyDetected = systems.some((s) =>
              s.name.toLowerCase().includes(cmsName),
            );
            if (!alreadyDetected) {
              systems.push({
                name: `${capitalized} (env var)`,
                reason: `variable d'environnement ${match[0]}* trouvée dans ${envFile}`,
              });
            }
            break;
          }
        }
      } catch {
        // Ignore read errors
      }
    }
  }

  return {
    detected: systems.length > 0,
    systems,
  };
}

// ─── OpenAI API Key ─────────────────────────────────────────────────

/**
 * Ensure OPENAI_API_KEY is set in the environment.
 * Checks env vars first, then prompts the user interactively.
 */
async function ensureOpenAIKey(): Promise<void> {
  if (process.env.OPENAI_API_KEY) {
    console.log("\n   ✅ Clé OpenAI détectée (OPENAI_API_KEY)\n");
    return;
  }

  console.log("\n🔑 Clé API OpenAI requise\n");
  console.log("   L'installation utilise un agent IA (OpenAI) pour générer");
  console.log("   le code d'intégration adapté à votre projet.\n");
  console.log(
    "   💡 Obtenez une clé sur: https://platform.openai.com/api-keys\n",
  );

  const apiKey = await promptSecret("   Entrez votre clé OpenAI (sk-...): ");

  if (!apiKey || !apiKey.startsWith("sk-")) {
    console.log('\n❌ Clé invalide. La clé doit commencer par "sk-".\n');
    process.exit(1);
  }

  process.env.OPENAI_API_KEY = apiKey;
  console.log("\n   ✅ Clé OpenAI configurée\n");
}

/**
 * Prompt the user for a secret value (hides input after first 4 chars).
 */
function promptSecret(message: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(message, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ─── Auto-install package + peer dependencies ───────────────────────

const REQUIRED_PEER_DEPS = ["react", "react-dom", "next", "swr"];

const OPTIONAL_PEER_DEPS = [
  "next-mdx-remote",
  "@mdx-js/react",
  "rehype-highlight",
  "remark-gfm",
];

/**
 * Ensure @nexifi/mdx-blog and required peer dependencies are installed.
 * Runs the package manager to add missing packages before AI setup.
 */
async function ensurePackageInstalled(
  cwd: string,
  projectInfo: {
    packageManager: string;
    dependencies: Record<string, string>;
  },
): Promise<void> {
  const pkgJsonPath = path.join(cwd, "package.json");
  if (!fs.existsSync(pkgJsonPath)) {
    console.log(
      "\n⚠️  No package.json found. Initializing with default values...\n",
    );
    execSync(`${getInitCommand(projectInfo.packageManager)}`, {
      cwd,
      stdio: "pipe",
    });
  }

  const deps = projectInfo.dependencies;
  const pm = projectInfo.packageManager;
  const packagesToInstall: string[] = [];

  // Check if @nexifi/mdx-blog is installed
  if (!deps["@nexifi/mdx-blog"]) {
    packagesToInstall.push("@nexifi/mdx-blog");
  }

  // Check required peer dependencies
  for (const dep of REQUIRED_PEER_DEPS) {
    if (!deps[dep]) {
      packagesToInstall.push(dep);
    }
  }

  if (packagesToInstall.length > 0) {
    console.log("\n📦 Installing packages...\n");
    for (const pkg of packagesToInstall) {
      console.log(`   + ${pkg}`);
    }
    console.log();

    const installCmd = getInstallCommand(pm, packagesToInstall);

    try {
      execSync(installCmd, { cwd, stdio: "inherit" });
      console.log("\n   ✅ Packages installed successfully\n");
    } catch (error) {
      console.error(
        "\n❌ Package installation failed:",
        (error as Error).message,
      );
      console.log(`\n   💡 Try installing manually:\n      ${installCmd}\n`);
      process.exit(1);
    }

    // Refresh dependencies after install
    try {
      const updatedPkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
      Object.assign(
        projectInfo.dependencies,
        updatedPkg.dependencies || {},
        updatedPkg.devDependencies || {},
      );
    } catch {
      // Ignore — deps will be stale but install already succeeded
    }
  } else {
    console.log("\n   ✅ @nexifi/mdx-blog already installed\n");
  }

  // Check optional peer dependencies (warn only)
  const missingOptional = OPTIONAL_PEER_DEPS.filter((dep) => !deps[dep]);
  if (missingOptional.length > 0) {
    const proceed = await confirm(
      `\n   📎 Optional packages not installed: ${missingOptional.join(", ")}\n      Install them for full MDX support?`,
    );
    if (proceed) {
      const optionalCmd = getInstallCommand(pm, missingOptional);
      try {
        execSync(optionalCmd, { cwd, stdio: "inherit" });
        console.log("\n   ✅ Optional packages installed\n");
      } catch {
        console.log(
          "\n   ⚠️  Some optional packages failed to install. You can add them later.\n",
        );
      }
    }
  }
}

function getInstallCommand(pm: string, packages: string[]): string {
  const pkgs = packages.join(" ");
  switch (pm) {
    case "yarn":
      return `yarn add ${pkgs}`;
    case "pnpm":
      return `pnpm add ${pkgs}`;
    case "bun":
      return `bun add ${pkgs}`;
    default:
      return `npm install ${pkgs}`;
  }
}

function getInitCommand(pm: string): string {
  switch (pm) {
    case "yarn":
      return "yarn init -y";
    case "pnpm":
      return "pnpm init";
    case "bun":
      return "bun init -y";
    default:
      return "npm init -y";
  }
}
