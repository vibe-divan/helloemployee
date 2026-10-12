import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["typescript", "unicorn", "oxc"],

  categories: {
    correctness: "error",
  },

  rules: {
    "import/extensions": ["error", "always", { ignorePackages: true }],
    "no-console": "error",
    "typescript/no-explicit-any": "error",
  },

  env: {
    builtin: true,
  },
});
