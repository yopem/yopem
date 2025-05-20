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
      "@typescript-eslint/no-non-null-assertion": "off",
      "import-x/consistent-type-specifier-style": "off",
      "import-x/order": "off",
      "n/no-extraneous-import": "off",
    },
  },
]
