import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  // ここは必要なら今後追加してOK
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  // 開発中はPWAを切って混乱を減らす（本番だけON）
  disable: process.env.NODE_ENV === "development",
})(nextConfig);
