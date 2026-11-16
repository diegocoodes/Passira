// @ts-check

/** @type {import('next').NextConfig} */
const config = {
  serverExternalPackages: ['@libsql/client', 'mariadb'],
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  devIndicators: false,
};

export default config;
