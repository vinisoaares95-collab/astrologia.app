/**
 * Consentimento e escolha da mão (Fase 03B).
 *
 * Fica só na memória do navegador, junto da foto. Registra a versão do texto
 * aceito, para que a futura análise (Fase 03D) saiba exatamente o que foi
 * autorizado. Texto provisório: depende de revisão jurídica (LGPD) antes do
 * lançamento público.
 */

/** Muda sempre que o texto de consentimento mudar. */
export const CONSENT_VERSION = "03b.1";

/** Idade mínima do MVP. */
export const MIN_AGE = 18;

export type PalmHand = "right" | "left";

export const HAND_LABELS: Record<PalmHand, string> = {
  right: "Mão direita",
  left: "Mão esquerda",
};

export type PalmConsent = {
  version: typeof CONSENT_VERSION;
  /** Declarou ter 18 anos ou mais. */
  adult: true;
  /** Autorizou o uso da foto para a futura leitura simbólica. */
  analysis: true;
  /** ISO 8601, no relógio do aparelho. */
  acceptedAt: string;
};

export function createConsent(
  input: { adult: boolean; analysis: boolean },
  now: () => Date = () => new Date(),
): PalmConsent | null {
  if (!input.adult || !input.analysis) return null;
  return {
    version: CONSENT_VERSION,
    adult: true,
    analysis: true,
    acceptedAt: now().toISOString(),
  };
}

/** Seções do texto exibido antes da foto (mesma ordem na tela). */
export const CONSENT_SECTIONS: readonly { title: string; body: string }[] = [
  {
    title: "Para que serve a foto",
    body: "A foto da palma da sua mão dominante será usada apenas para a leitura simbólica das mãos do Sidera (características da mão e linhas da palma). É uma interpretação da tradição da quiromancia, não um diagnóstico nem uma previsão.",
  },
  {
    title: "O que acontece nesta versão",
    body: "Nesta versão de teste, a foto é preparada só no seu navegador: os dados de localização e do aparelho (EXIF/GPS) são removidos e nada é enviado nem analisado. A foto é descartada quando você sai deste fluxo.",
  },
  {
    title: "Quando a análise estiver disponível",
    body: "A foto preparada será enviada a um provedor de inteligência artificial (Anthropic, nos Estados Unidos) apenas para observar características visíveis da palma. O Sidera não guarda a foto: ela é descartada depois da análise e só ficam as observações da leitura.",
  },
  {
    title: "Retenção pelo provedor",
    body: "Pelas regras públicas do provedor para a API comercial, conteúdos enviados são apagados em até 30 dias e não são usados para treinar modelos sem permissão expressa; conteúdos sinalizados por sistemas de segurança podem ser guardados por até 2 anos. Essas condições serão confirmadas antes do lançamento.",
  },
  {
    title: "Seus direitos",
    body: "Você pode desistir a qualquer momento: basta descartar a foto ou sair do fluxo. A leitura é exclusiva para maiores de 18 anos.",
  },
];
