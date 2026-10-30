export const routes = {
  home: "/",
  howItWorks: "/como-funciona",
  palmIntro: "/leitura-das-maos",
  palmPhoto: "/leitura-das-maos/foto",
  palmPreview: "/leitura-das-maos/previa",
  birthData: "/dados-de-nascimento",
  report: "/relatorio",
  designSystem: "/sistema-visual",
} as const;

export const mainNav = [
  { href: routes.howItWorks, label: "Como funciona" },
  { href: routes.report, label: "O relatório" },
] as const;

/** Etapas da jornada exibidas no indicador de progresso. */
export const journeySteps = [
  { id: "palm", label: "Mão", href: routes.palmIntro },
  { id: "preview", label: "Prévia", href: routes.palmPreview },
  { id: "birth", label: "Nascimento", href: routes.birthData },
  { id: "report", label: "Relatório", href: routes.report },
] as const;

export type JourneyStepId = (typeof journeySteps)[number]["id"];
