/**
 * Textos sobre a foto (03F.2, Etapa B): cada modo diz o que de fato
 * acontece, sem prometer o que a implementação não garante.
 */
import { describe, expect, it } from "vitest";

import { CONSENT_SECTIONS, CONSENT_VERSION } from "./consent";
import { photoModeOf } from "./lib/use-analysis-availability";
import { consentSections, PHOTO_PRIVACY, type PhotoMode } from "./privacy-copy";

const textOf = (mode: PhotoMode) =>
  [
    PHOTO_PRIVACY.intro[mode].title,
    PHOTO_PRIVACY.intro[mode].body,
    PHOTO_PRIVACY.prepared[mode],
    ...(mode === "off"
      ? []
      : [PHOTO_PRIVACY.running[mode], PHOTO_PRIVACY.preview[mode]]),
    ...consentSections(mode).map((s) => `${s.title} ${s.body}`),
  ].join(" ");

describe("textos de privacidade da foto", () => {
  it("nenhum modo afirma que a foto nunca sai do aparelho depois do envio", () => {
    for (const mode of ["simulated", "real"] as const)
      expect(textOf(mode)).not.toMatch(
        /não sai do aparelho|continua só|só neste aparelho|apenas neste dispositivo|nada é enviado|não é enviada/iu,
      );
  });

  it("real: servidor do Sidera e Anthropic citados, e o envio só ao tocar em Analisar", () => {
    const t = textOf("real");
    expect(t).toMatch(/servidor do Sidera/u);
    expect(t).toMatch(/Anthropic/u);
    expect(PHOTO_PRIVACY.prepared.real).toMatch(
      /só sai daqui quando você tocar em Analisar/u,
    );
    expect(PHOTO_PRIVACY.preview.real).toMatch(/foi enviada para análise/u);
  });

  it("simulado: só o servidor do Sidera, sem IA", () => {
    const t = textOf("simulated");
    expect(t).toMatch(/servidor do Sidera/u);
    expect(t).not.toMatch(/Anthropic/u);
    expect(t).toMatch(/nenhuma (inteligência artificial|IA)/iu);
  });

  it("desligado: nada é enviado", () => {
    expect(textOf("off")).toMatch(/não é enviada|nada é enviado/u);
    expect(textOf("off")).not.toMatch(/servidor|Anthropic/u);
  });

  it("guarda e retenção: só o que a implementação garante", () => {
    for (const mode of ["simulated", "real"] as const) {
      const t = textOf(mode);
      // O servidor não grava; o resultado e o hash ficam até 10 min (cache).
      expect(t).toMatch(/não grava a foto/u);
      expect(t).toMatch(/até 10 minutos/u);
      // Nada de apagamento garantido, exclusão imediata nem retenção zero.
      expect(t).not.toMatch(
        /2 anos|apagad[ao] (com segurança|definitivamente)|zerad|exclu[ií]d[ao] imediatamente|exclusão imediata|retenção zero|não (é|fica) retid[ao] pela Anthropic/iu,
      );
    }
    // Anthropic (03G.3): as duas regras, com exceções, sem afirmar a da conta.
    const provider = consentSections("real").find(
      (s) => s.title === "Uso pelo provedor",
    )!.body;
    expect(provider).toMatch(/não é usado para treinar/u);
    expect(provider).toMatch(/até 30 dias, com exceções/u);
    expect(provider).toMatch(
      /em certas chamadas, esse conteúdo não é retido por padrão/u,
    );
    expect(provider).toMatch(/conta do Sidera ainda está sendo confirmad/u);
    expect(textOf("simulated")).not.toMatch(/30 dias/u);
    // Metadados: removidos da cópia; o original não é alterado.
    expect(
      consentSections("real")
        .map((s) => s.body)
        .join(" "),
    ).toMatch(/original no seu aparelho não é alterado/u);
  });

  it("o texto completo do consentimento é o do modo real; versão nova", () => {
    expect(CONSENT_SECTIONS).toEqual(consentSections("real"));
    expect(CONSENT_VERSION).toBe("03g3.1");
  });

  it("enquanto a disponibilidade carrega, vale o modo que envia a foto", () => {
    expect(photoModeOf({ status: "loading" })).toBe("real");
    expect(photoModeOf({ status: "ready", enabled: false })).toBe("off");
    expect(
      photoModeOf({ status: "ready", enabled: true, simulated: true }),
    ).toBe("simulated");
    expect(
      photoModeOf({ status: "ready", enabled: true, simulated: false }),
    ).toBe("real");
  });
});
