import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/:slug*;contato:id(\\d+).php',
        destination: '/cliente/:id',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
