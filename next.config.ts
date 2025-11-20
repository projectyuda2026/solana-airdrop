import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Matikan Strict Mode (Wajib untuk kestabilan Wallet)
  reactStrictMode: false,

  // 2. Config Webpack (Wajib untuk library Solana/Reown)
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    // Tambahkan fallback untuk mencegah error modul nodejs
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    return config;
  },
  
  // Hapus settingan eslint yang bikin error tadi
};

export default nextConfig;