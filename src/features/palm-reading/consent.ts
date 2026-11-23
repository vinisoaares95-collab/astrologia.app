/**
 * Consentimento e escolha da mão (Fase 03B).
 *
 * Fica só na memória do navegador, junto da foto. Registra a versão do texto
 * aceito, para que a futura análise (Fase 03D) saiba exatamente o que foi
 * autorizado. Texto provisório: depende de revisão jurídica (LGPD) antes do
 * lançamento público.
 */
import { consentSections } from "./privacy-copy";

/**
 * Muda sempre que o texto de consentimento mudar.
 * - 03f2.1: o texto passou a depender do modo da análise (desligada,
 *   simulada, real) e deixou de citar prazos do provedor não confirmados.
 * - 03g3.1: "Uso pelo provedor" passa a citar a política comercial da
 *   Anthropic (até 30 dias, com exceções) e a documentação técnica (certas
 *   chamadas sem retenção por padrão), sem afirmar qual vale para a conta.
 *   Recibos da versão anterior deixam de valer (vencem em 30 min).
 * - 04b.1: explica que o texto da leitura (sem a foto) segue na memória da
 *   jornada até sair, recarregar ou fechar, e diferencia descartar a foto,
 *   sair da jornada e retirar o consentimento.
 */
export const CONSENT_VERSION = "04b.1";

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

/** Seções do consentimento com a análise real (o texto completo). */
export const CONSENT_SECTIONS = consentSections("real");
