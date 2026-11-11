/**
 * Provedor de visão (Fase 03D): interface desacoplada do fornecedor.
 *
 * O provedor só EXTRAI observações visuais no formato da 03C. Nunca
 * interpreta (a quiromancia vem da biblioteca autoral) e sua resposta não é
 * prova de correção: tudo passa pelo validador da 03C.
 *
 * Reaproveita os tipos de resposta, consumo e erro da geração de texto
 * (interpretation/ai/contract.ts), para usar o mesmo tratamento de falhas e
 * de custo.
 */
import type {
  AiProviderError,
  AiResponse,
} from "../../interpretation/ai/contract";

export type VisionRequest = {
  /** Instruções estáveis (cacheáveis). */
  system: string;
  /** Texto do pedido (mão escolhida e versão do contrato). */
  text: string;
  /** Foto preparada no navegador e conferida no servidor. */
  image: { mediaType: "image/jpeg"; base64: string };
  /** JSON Schema da observação (contrato 03C). */
  schema: Record<string, unknown>;
  maxOutputTokens: number;
  timeoutMs: number;
};

export type VisionResponse = AiResponse;
export type VisionError = AiProviderError;

export interface VisionProvider {
  readonly id: string;
  readonly model: string;
  analyze(request: VisionRequest): Promise<VisionResponse>;
}
