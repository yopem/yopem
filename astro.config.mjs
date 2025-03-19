// @ts-check
import { defineConfig } from "astro/config";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  output: "server",
  site: "https://yopem.com",
  adapter: node({
    mode: "standalone",
  }),
  server: {
    port: 4321,
    host: true,
  },
  vite: {
    ssr: {
      noExternal: ["path-to-regexp"],
    },
    preview: {
      port: 4321,
      host: true,
    },
  },
});
