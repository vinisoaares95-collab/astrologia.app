import type { MetadataRoute } from "next";

/** Ambiente privado (homologação): nenhum robô deve indexar o Sidera. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
