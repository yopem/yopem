import type { NextConfig } from "next"

const config: NextConfig = {
  output: "standalone",
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
  serverExternalPackages: ["pg", "ioredis"],
  reactCompiler: true,
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: false },
  productionBrowserSourceMaps: false,
  transpilePackages: [
    "@repo/api",
    "@repo/auth",
    "@repo/cache",
    "@repo/db",
    "@repo/env",
    "@repo/logger",
    "@repo/payments",
    "@repo/query",
    "@repo/types",
    "@repo/ui",
    "@repo/utils",
  ],
  compiler: {
    // oxlint_disable-next-line eslint-plugin-unicorn/no-useless-spread
    ...(process.env["APP_ENV"] === "production"
      ? {
          removeConsole: {
            exclude: ["error", "warn"],
          },
        }
      : {}),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "assets.yopem.com",
      },
      {
        protocol: "https",
        hostname: "*.yopem.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
    ],
  },
}

export default config
