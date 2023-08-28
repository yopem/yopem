// Importing env files here to validate on build
import "./src/env.mjs";
import "@yopem/auth/env.mjs";

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  images: {
    domains: ["avatars.githubusercontent.com"],
  },
  /** Enables hot reloading for local packages without a build step */
  transpilePackages: ["@yopem/api", "@yopem/auth", "@yopem/db"],
  /** We already do linting and typechecking as separate tasks in CI */
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default config;
