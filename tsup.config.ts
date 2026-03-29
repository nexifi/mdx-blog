import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/server.ts", "src/mdx.ts"],
  format: ["cjs", "esm"],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  external: [
    "react",
    "react-dom",
    "next",
    "next/head",
    "next/link",
    "next-mdx-remote",
    "next-mdx-remote/serialize",
    "@mdx-js/react",
    "swr",
    "remark-gfm",
    "rehype-highlight",
  ],
});
