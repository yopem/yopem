import type { NextConfig } from "next"

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.yopem.com https://*.googleusercontent.com; connect-src 'self' https://*.yopem.com; frame-ancestors 'none'",
  },
]

const config: NextConfig = {
  output: "standalone",
  experimental: {
    turbopackFileSystemCacheForDev: true,
    serverSourceMaps: false,
    preloadEntriesOnStart: false,
  },
  serverExternalPackages: ["pg", "ioredis"],
  reactCompiler: true,
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: false },
  enablePrerenderSourceMaps: false,
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
    "@repo/shared",
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
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ]
  },
}

export default config
