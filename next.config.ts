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
  // async redirects() {
  //   return [
  //     {
  //       source: "/",
  //       destination: "https://search.yopem.com",
  //       permanent: false,
  //     },
  //   ]
  // },
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
