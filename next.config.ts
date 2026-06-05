import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclude the Python virtualenv from file tracing.
  // Turbopack traverses .venv symlinks and panics on the module graph step.
  outputFileTracingExcludes: {
    '*': ['.venv/**'],
  },
  // Empty turbopack config silences the webpack/turbopack mismatch warning
  // and signals to Next.js that Turbopack is intentional.
  turbopack: {},
};

export default nextConfig;
