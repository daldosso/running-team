import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.blob.vercel-storage.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.runfast.it",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "runfast.it",
        pathname: "/wp-content/uploads/**",
      },
    ],
  },
};

export default nextConfig;
