import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {files: ["**/*.{js,mjs,cjs,ts,tsx}"]},
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  {
      rules: {
          "@typescript-eslint/no-explicit-any": "warn",
          "@typescript-eslint/no-unused-vars": [
            "warn",
            {
              "argsIgnorePattern": "^_",
              "varsIgnorePattern": "^_",
              "caughtErrorsIgnorePattern": "^_"
            }
          ]
      }
  },
  {
    ignores: ["**/dist/", "**/node_modules/", "**/build/", "**/coverage/", "**/lib/"]
  }
];
