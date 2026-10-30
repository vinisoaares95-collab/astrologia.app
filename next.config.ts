import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  // A câmera é usada apenas via <input capture>, que não depende desta política,
  // mas mantemos o acesso restrito à própria origem para fases futuras.
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // Addon nativo (N-API): carregado com `require` do Node, sem bundling.
  serverExternalPackages: ["sweph"],
  // Arquivos de efemérides (baixados por `npm run ephe:fetch`) precisam
  // acompanhar a função que usa o motor.
  outputFileTracingIncludes: {
    // Base de localidades (lida com fs) e base de fusos fixada (tzdata/).
    "/dados-de-nascimento": [
      "./src/features/places/data/*.json",
      "./tzdata/**/*",
    ],
    // O node-gyp-build escolhe o binário em tempo de execução, então o
    // rastreador não o detecta: incluímos os binários Linux explicitamente.
    "/api/dev/astro-poc": [
      "./ephe/**/*",
      "./node_modules/sweph/prebuilds/linux-*/**/*",
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
