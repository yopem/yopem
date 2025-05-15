import honoConfig from "@hono/eslint-config"
import baseConfig from "@yopem/eslint-config/base"

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ["dist/**"],
  },
  ...baseConfig,
  ...honoConfig,
  {
    rules: {
      "no-restricted-imports": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
]
