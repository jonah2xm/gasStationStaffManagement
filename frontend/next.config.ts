import type { NextConfig } from "next";

// The browser only talks to this Next server; it forwards API, upload and
// socket traffic to the Express backend. That keeps every request same-origin,
// so the app works from localhost or the LAN IP without CORS or port 5000
// being reachable from other PCs.
const BACKEND_URL = (process.env.BACKEND_INTERNAL_URL || "http://localhost:5000").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  // Let other PCs on the LAN load the dev server's /_next assets and HMR socket.
  allowedDevOrigins: ["10.*.*.*", "192.168.*.*"],

  // Socket.IO requests /socket.io/?EIO=…; Next's default redirect to /socket.io breaks the handshake.
  skipTrailingSlashRedirect: true,

  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` },
      { source: "/uploads/:path*", destination: `${BACKEND_URL}/uploads/:path*` },
      { source: "/socket.io/", destination: `${BACKEND_URL}/socket.io/` },
      { source: "/socket.io/:path*", destination: `${BACKEND_URL}/socket.io/:path*` },
    ];
  },
};

export default nextConfig;
