import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'books.google.com' },
      { protocol: 'https', hostname: 'covers.openlibrary.org' },
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      { protocol: 'https', hostname: 'images-na.ssl-images-amazon.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['@aws-sdk/client-s3'],
    staleTimes: {
      dynamic: 30,
      static: 300,
    },
  },
};

export default nextConfig;
