import nextPlugin from "@next/eslint-plugin-next";
import tseslint from "typescript-eslint";

export default [
  {
    // Python services / vendored Python projects are not part of the JS/TS app.
    ignores: [".next/**", "node_modules/**", "services/**", "producer-dna/**"]
  },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    plugins: {
      "@next/next": nextPlugin
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules
    }
  },
  {
    // The command center uses intentionally styled internal anchor buttons alongside
    // separator-worker download anchors. Keep this exception scoped to that page.
    files: ["app/page.tsx"],
    rules: {
      "@next/next/no-html-link-for-pages": "off"
    }
  }
];
