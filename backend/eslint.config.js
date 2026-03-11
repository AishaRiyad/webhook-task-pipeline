import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import security from "eslint-plugin-security";

export default tseslint.config(
  {
    ignores: ["dist", "node_modules", "coverage"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,js}"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      security,
    },
    rules: {
      "no-console": "off",

      "security/detect-object-injection": "warn",
      "security/detect-non-literal-fs-filename": "warn",
      "security/detect-child-process": "warn",
      "security/detect-eval-with-expression": "warn",
      "security/detect-non-literal-regexp": "warn",
      "security/detect-possible-timing-attacks": "warn",
      "security/detect-unsafe-regex": "warn",
    },
  }
);
