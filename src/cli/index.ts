/**
 * @nexifi/mdx-blog CLI
 *
 * AI-powered installation agent that integrates the package into any project.
 * Only requires an OpenAI API key — everything else is handled automatically.
 *
 * Usage:
 *   npx @nexifi/mdx-blog              # Auto-install + integrate (default)
 *   npx @nexifi/mdx-blog install      # Same as above
 *   npx @nexifi/mdx-blog validate     # Check integration status
 *
 * Requirements:
 *   OpenAI API key (sk-...) — https://platform.openai.com/api-keys
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { installCommand } from "./commands/install.js";
import { validateCommand } from "./commands/validate.js";

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  console.log("\n🚀 @nexifi/mdx-blog CLI\n");

  switch (command) {
    case "install":
    case "setup":
    case "init":
      await installCommand(args.slice(1));
      break;

    case "validate":
    case "check":
      await validateCommand(args.slice(1));
      break;

    case "help":
    case "--help":
    case "-h":
      showHelp();
      break;

    case "version":
    case "--version":
    case "-v":
      showVersion();
      break;

    default:
      if (command) {
        console.log(`❌ Unknown command: ${command}\n`);
        showHelp();
        process.exit(1);
      }
      // No command = run install by default (npx @nexifi/mdx-blog)
      await installCommand(args);
      break;
  }
}

function showHelp() {
  console.log(`Usage: npx @nexifi/mdx-blog [command] [options]

Commands:
  (default)   Install & integrate (same as install)
  install     AI-powered integration into your project
  validate    Check if integration is complete
  help        Show this help message
  version     Show package version

Options:
  --quiet, -q        Suppress detailed output (verbose is ON by default)
  --dry-run          Preview the prompt without running the agent
  --model=MODEL      Specify a model (default: gpt-5.4)

Requirements:
  OpenAI API key    Get yours at https://platform.openai.com/api-keys
                    Set OPENAI_API_KEY env var, or you'll be prompted

Quick start:
  npx @nexifi/mdx-blog                # Install + integrate in one command
  npx @nexifi/mdx-blog --quiet        # Less output
  npx @nexifi/mdx-blog validate       # Check integration status

Documentation:
  https://github.com/nexifi-io/mdx-blog
`);
}

function showVersion() {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const pkgPath = resolve(__dirname, "../../package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    console.log(`v${pkg.version}`);
  } catch {
    // Fallback if package.json not accessible
    console.log("v1.0.0");
  }
}

main().catch((error) => {
  console.error("\n❌ Fatal error:", error.message);
  process.exit(1);
});
