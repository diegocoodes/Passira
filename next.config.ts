import type { NextConfig } from 'next';

const config: NextConfig = {
  // Vercel uses its native Next.js integration. Local builds remain portable.
  output: process.env.VERCEL === '1' ? undefined : 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  devIndicators: false,
};

export default config;
