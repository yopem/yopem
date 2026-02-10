import type { NextConfig } from "next"

const config: NextConfig = {
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
  cacheComponents: true,
  serverExternalPackages: ["pg", "ioredis"],
  reactCompiler: true,
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: false },
  productionBrowserSourceMaps: false,
  compiler: {
    // oxlint-disable-next-line eslint-plugin-unicorn/no-useless-spread
    ...(process.env["APP_ENV"] === "production"
      ? {
          removeConsole: {
            exclude: ["error", "warn"],
          },
        }
      : {}),
  },
  async redirects() {
    return [
      {
        source: "/",
        destination: "https://search.yopem.com",
        permanent: false,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "*.yopem.com",
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
