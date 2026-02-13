const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  js.configs.recommended,
  {
    ignores: ["coverage/**", "dist/**"],
  },
  {
    languageOptions: {
      ecmaVersion: "latest",
      globals: {
        ...globals.node,
        ...globals.es2021,
        ...globals.jest,
      },
    },
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-console": "off",
    },
  },
];
