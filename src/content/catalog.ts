/**
 * Catálogo comercial em teste. Valores em centavos (BRL).
 * Os preços ainda serão validados — não há integração de pagamento nesta fase.
 */
export type CatalogItem = {
  slug: string;
  name: string;
  description: string;
  priceCents: number;
};

export const mainProduct: CatalogItem = {
  slug: "relatorio-completo",
  name: "Relatório completo",
  description:
    "Nove capítulos sobre seu céu, suas mãos e sua jornada, com mandala astral e exportação em PDF.",
  priceCents: 3990,
};

export const orderBumps: readonly CatalogItem[] = [
  {
    slug: "mapa-do-amor",
    name: "Mapa do Amor",
    description:
      "Um olhar simbólico dedicado aos vínculos afetivos e à forma como você se relaciona.",
    priceCents: 1490,
  },
  {
    slug: "calendario-pessoal",
    name: "Calendário Pessoal de 12 Meses",
    description:
      "Temas de reflexão para cada mês do próximo ano, a partir do seu mapa.",
    priceCents: 1990,
  },
];
