import type { NextConfig } from "next"

const config: NextConfig = {
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
  reactCompiler: true,
  reactStrictMode: true,
  // cacheComponents: true,
  typescript: { ignoreBuildErrors: true },
  productionBrowserSourceMaps: false,
  compiler: {
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
        protocol: "http",
        hostname: "*.yopem.com",
      },
      {
        protocol: "https",
        hostname: "*.yopem.com",
      },
    ],
  },
}

export default config
