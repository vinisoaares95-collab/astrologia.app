export const routes = {
  home: "/",
  howItWorks: "/como-funciona",
  palmIntro: "/leitura-das-maos",
  palmConsent: "/leitura-das-maos/consentimento",
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

/** Mapeia cada tela da jornada para sua etapa e para o destino do "voltar". */
export const journeyScreens: Record<
  string,
  { step: JourneyStepId; title: string; back: string }
> = {
  [routes.palmIntro]: {
    step: "palm",
    title: "Leitura das mãos",
    back: routes.home,
  },
  [routes.palmConsent]: {
    step: "palm",
    title: "Antes da foto",
    back: routes.palmIntro,
  },
  [routes.palmPhoto]: {
    step: "palm",
    title: "Foto da palma",
    back: routes.palmConsent,
  },
  [routes.palmPreview]: {
    step: "preview",
    title: "Sua prévia",
    back: routes.palmPhoto,
  },
  // A foto é descartada ao sair do fluxo das mãos; voltamos ao início dele.
  [routes.birthData]: {
    step: "birth",
    title: "Nascimento",
    back: routes.palmIntro,
  },
  [routes.report]: {
    step: "report",
    title: "Relatório",
    back: routes.birthData,
  },
};
