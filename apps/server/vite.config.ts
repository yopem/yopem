import { defineConfig } from "vite-plus"

export default defineConfig({
  lint: {
    rules: {
      "import/no-relative-parent-imports": "off",
    },
  },
})
