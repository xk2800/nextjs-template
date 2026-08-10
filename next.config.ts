import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // geoip-lite resolves its .dat files relative to its own __dirname at
  // runtime — bundling it rewrites that path and breaks the lookup, so it
  // needs to stay a real Node require instead.
  serverExternalPackages: ["geoip-lite"],
};

export default nextConfig;
