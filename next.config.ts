import { withSentryConfig } from "@sentry/nextjs"
import type { NextConfig } from "next"
import type { Event } from "@sentry/core"

const isMobileBuild = process.env.BUILD_TARGET === "mobile"
// Performance optimized config
const nextConfig: NextConfig = {
  output: isMobileBuild ? "export" : undefined,
  trailingSlash: isMobileBuild,

  // Performance optimizations
  reactStrictMode: true,
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },

  // Image optimization settings
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gateway.mesh3.network",
      },
      {
        protocol: "https",
        hostname: "gateway.lighthouse.storage",
      },
      {
        protocol: "https",
        hostname: "assets.react-photo-album.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
      },
      {
        protocol: "https",
        hostname: "r2.unreal.art",
      },
      {
        protocol: "https",
        hostname: "pub-bc2d2d9bc6fb490dbb380efd5781048d.r2.dev",
      },
    ],
    // Use higher image quality format
    formats: ["image/avif", "image/webp"],
    // Optimize memory usage
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  // Add environment variables
  env: {
    // Build
    NEXT_PUBLIC_BUILD_VERSION: `1.0.0-${Date.now()}`,

    // Storage URLs for preconnect
    NEXT_PUBLIC_R2_STORAGE_URL: "https://r2.unreal.art",

    // Lighthouse gateway
    NEXT_PUBLIC_LIGHTHOUSE_GATE_WAY: "https://gateway.lighthouse.storage/ipfs/",

    // Enable debug by default in development
    NEXT_PUBLIC_DEBUG:
      process.env.NODE_ENV === "development" ? "true" : "false",
  },
  // Enable turbopack for faster dev experience
  experimental: {
    // turbo: {
    //   rules: {
    //     "*.mdx": ["mdx-loader"],
    //   },
    // },
    // Enable optimizations for faster page transitions
    optimizePackageImports: [
      "react-multi-carousel",
      "framer-motion",
      "gsap",
      "lodash",
      "swiper",
      "react-loading-skeleton",
      "react-icons",
      "recharts",
      "@tremor/react",
    ],
    // Enhanced CSS optimization with critical CSS extraction
    optimizeCss: {
      // Extract critical CSS
      extractCritical: true,
      // Inline critical CSS in the head
      inlineCritical: true,
    },
    // Enable React 19 streaming features
    serverActions: {
      bodySizeLimit: "2mb",
    },
    // Improve client-side navigation
    // ppr: true, // Disabled until we upgrade to Next.js canary
  },
  // Compress responses for faster delivery
  compress: true,
  // Transpile specific packages that need it
  transpilePackages: ["gsap", "three", "react-share"],
  // Improve production performance
  productionBrowserSourceMaps: false,
  // Disable x-powered-by header
  poweredByHeader: false,
  // Enable caching for faster builds
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000, // 1 hour
    pagesBufferLength: 5,
  },
  // Minification is now enabled by default in Next.js
  // Removing swcMinify as it's causing errors

  // Improve runtime performance
  // Add page caching
  pageExtensions: ["tsx", "ts", "jsx", "js", "mdx"],
}

// Sentry configuration
const sentryWebpackPluginOptions = {
  // Additional options for the Sentry Webpack plugin
  silent: !process.env.CI, // Only print logs for uploading source maps in CI

  // Organization and project settings
  org: "unreal-decenterai",
  project: "unreal",

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0, // 20% in production, 100% in development
  replaysSessionSampleRate: 0.1, // Record 10% of sessions
  replaysOnErrorSampleRate: 1.0, // Record 100% of sessions with errors

  // Error tracking
  attachStacktrace: true, // Attach stack traces to errors
  normalizeDepth: 10, // Control object serialization depth

  // Release tracking
  release: {
    name: process.env.NEXT_PUBLIC_BUILD_VERSION,
    create: true,
    finalize: true,
  },

  // Upload a larger set of source maps for prettier stack traces
  widenClientFileUpload: true,

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers
  tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors
  automaticVercelMonitors: true,

  // Disable feedback widget/popup
  disableFeedbackButton: true,

  // Additional security and performance options
  maxBreadcrumbs: 50, // Limit breadcrumb count
  beforeSend(event: Event): Event {
    // Sanitize any sensitive data before sending to Sentry
    if (event.request?.headers) {
      const headers = event.request.headers
      delete headers["Authorization"]
      delete headers["Cookie"]
    }
    return event
  },
}

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions)
