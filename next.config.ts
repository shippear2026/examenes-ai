import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse usa pdfjs-dist, que en tiempo de ejecución carga su propio
  // "pdf.worker.mjs". Si el bundler (Turbopack/webpack) lo empaqueta, esa ruta
  // deja de resolver y falla con "Setting up fake worker failed". Marcándolo
  // como paquete externo del servidor se ejecuta desde node_modules y funciona.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
