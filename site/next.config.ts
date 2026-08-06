import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/:slug;contato:id(\\d+).php',
        destination: '/cliente/:id',
        permanent: true,
      },
      {
        source: '/:slug;cat:id(\\d+).php',
        destination: '/busca?q=:slug',
        permanent: true,
      },
      {
        source: '/:slug;blog:id(\\d+).php',
        destination: '/',
        permanent: true,
      },
      {
        source: '/:slug;post:id(\\d+).php',
        destination: '/',
        permanent: true,
      },
      {
        source: '/empregos',
        destination: '/vagas',
        permanent: true,
      },
      {
        source: '/empregos.php',
        destination: '/vagas',
        permanent: true,
      },
      {
        source: '/emprego-detalhe.php',
        has: [
          {
            type: 'query',
            key: 'id_empregos',
            value: '(?<id>.*)',
          }
        ],
        destination: '/vagas',
        permanent: true,
      },
      {
        source: '/gera-curriculo/:id',
        destination: '/vagas',
        permanent: true,
      }
    ];
  },
};

export default nextConfig;
