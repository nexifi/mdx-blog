import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli/index.ts"],
  outDir: "dist/cli",
  format: ["esm"],
  dts: false,
  splitting: false,
  sourcemap: false,
  clean: false,
  minify: true,
  target: "node18",
  platform: "node",
  banner: {
    js: "#!/usr/bin/env node",
  },
  // Node built-ins + runtime deps are external (resolved from node_modules)
  external: [
    "fs",
    "path",
    "url",
    "readline",
    "child_process",
    "os",
    "node:fs",
    "node:path",
    "node:url",
    "node:readline",
    "node:child_process",
    "node:os",
    "@openai/agents",
    "openai",
    "zod",
  ],
});
