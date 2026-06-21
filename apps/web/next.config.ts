import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  transpilePackages: ["@genshin/core", "@genshin/data", "@genshin/types"],
};

export default nextConfig;
