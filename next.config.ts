import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse depende de pdfjs-dist, que resuelve su worker en runtime.
  // Si el bundler lo empaqueta, falla con "Setting up fake worker failed".
  // Manteniéndolos externos, se cargan desde node_modules y el worker resuelve bien.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
