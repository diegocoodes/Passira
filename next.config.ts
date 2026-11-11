import type { NextConfig } from 'next';

const config: NextConfig = {
  serverExternalPackages: ['@libsql/client'],
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  devIndicators: false,
};

export default config;
