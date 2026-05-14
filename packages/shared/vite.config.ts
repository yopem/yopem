import { defineConfig } from "vite-plus"

export default defineConfig({
  lint: {
    extends: ["../../.oxlintrc.json"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
})
