import js from "@eslint/js";
import ts from "typescript-eslint";
export default ts.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "research/**",
      "artifacts/**",
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ["tools/**/*.mjs"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        Buffer: "readonly",
      },
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
    },
  },
);
