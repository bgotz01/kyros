import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // The build scripts are imperative and read top to bottom, so a const that
  // shadows an outer name is a temporal-dead-zone crash rather than a style
  // question — and .mjs never reaches tsc, which would otherwise catch it.
  // Functions and classes hoist legitimately; only variables are checked.
  {
    files: ["scripts/**/*.mjs", "lib/**/*.mjs"],
    rules: {
      "no-use-before-define": [
        "error",
        { functions: false, classes: false, variables: true },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
