import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@interrealm/ui"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't bundle ws module for server-side code
      config.externals.push('ws', 'bufferutil', 'utf-8-validate');
    } else {
      // Fallback for client-side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        ws: false,
        bufferutil: false,
        'utf-8-validate': false,
      };
    }
    return config;
  },
};

export default nextConfig;
