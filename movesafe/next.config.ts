import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const configDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  turbopack: {
    // Prevent Next.js from picking a parent directory (multiple lockfiles) as workspace root
    root: configDir,
  },
};

export default nextConfig;
