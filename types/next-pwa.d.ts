declare module "next-pwa" {
  import type { NextConfig } from "next";

  interface PWAConfig {
    dest?: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    scope?: string;
    sw?: string;
    runtimeCaching?: unknown[];
    buildExcludes?: (string | RegExp)[];
    publicExcludes?: string[];
    fallbacks?: Record<string, string>;
  }

  export default function withPWA(
    config?: PWAConfig,
  ): (nextConfig: NextConfig) => NextConfig;
}
