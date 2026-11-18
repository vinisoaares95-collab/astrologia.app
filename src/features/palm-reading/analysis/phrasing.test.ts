/**
 * Frases do sistema sobre o que não foi usado (03F.2). Só textos fixos:
 * nenhuma IA, nenhuma foto.
 */
import { describe, expect, it } from "vitest";

import {
  condensedLimitations,
  FATE_NOT_IDENTIFIED,
  imageIssuesNote,
  partialNote,
  retakeGuidance,
  unavailableMessage,
  type Unused,
} from "./phrasing";
import { PALM_FORBIDDEN_TEXT_PATTERNS } from "./library";

const u = (feature: Unused["feature"], reason: Unused["reason"]): Unused => ({
  feature,
  reason,
});

describe("limitações condensadas", () => {
  it("uma frase por situação, com concordância", () => {
    expect(
      condensedLimitations([
        u("hand.palmShape", "unclassifiable"),
        u("hand.fingerLength", "unclassifiable"),
      ]),
    ).toEqual([
      "O formato da palma e o comprimento dos dedos aparecem na foto, mas não puderam ser classificados com segurança; por isso não foram interpretados.",
    ]);
    expect(condensedLimitations([u("head.slope", "unclassifiable")])).toEqual([
      "A inclinação da linha da cabeça aparece na foto, mas não pôde ser classificada com segurança; por isso não foi interpretada.",
    ]);
  });

  it("distingue indeterminada, não identificada e não visível; destino à parte", () => {
    const l = condensedLimitations([
      u("head.length", "unclassifiable"),
      u("heart.shape", "ambiguous"),
      u("life.arc", "obscured"),
      u("heart.length", "too_faint"),
      u("fate.presence", "too_faint"),
    ]);
    expect(l).toHaveLength(4);
    expect(l[0]).toMatch(
      /^O comprimento da linha da cabeça aparece na foto, mas/u,
    );
    expect(l[1]).toBe(
      "Não foi possível identificar com segurança o traçado da linha do coração; por isso não foi interpretado.",
    );
    expect(l[2]).toBe(
      "O arco da linha da vida e o comprimento da linha do coração não ficaram visíveis na foto e não foram interpretados.",
    );
    expect(l[3]).toBe(FATE_NOT_IDENTIFIED);
  });

  it("aspectos da mesma linha ficam juntos", () => {
    expect(
      condensedLimitations([
        u("head.length", "unclassifiable"),
        u("head.slope", "unclassifiable"),
        u("head.start", "unclassifiable"),
      ]),
    ).toEqual([
      "O comprimento, a inclinação e o início da linha da cabeça aparecem na foto, mas não puderam ser classificados com segurança; por isso não foram interpretados.",
    ]);
  });

  it("nada a dizer quando tudo foi usado", () => {
    expect(condensedLimitations([])).toEqual([]);
  });
});

describe("problemas de imagem", () => {
  it("vêm como apontamento da análise, não como fato", () => {
    const n = imageIssuesNote(["too_dark", "blurry"]);
    expect(n).toBe(
      "A análise da foto apontou pouca luz e falta de nitidez; algumas características podem não ter sido observadas.",
    );
    expect(n).not.toMatch(/A foto tinha|A foto está/u);
    expect(imageIssuesNote([])).toBeNull();
  });

  it("orientação de nova foto segue o problema apontado", () => {
    expect(retakeGuidance("maos", ["angled"])).toMatch(
      /^Uma nova foto pode permitir esta leitura: palma de frente, com o celular paralelo a ela\.$/u,
    );
    expect(retakeGuidance("maos", ["angled"])).not.toMatch(/mão inteira/u);
    expect(retakeGuidance("maos", ["hand_cropped"])).toMatch(/mão inteira/u);
    expect(retakeGuidance("linhas", ["glare"])).toMatch(/sem reflexos/u);
    expect(retakeGuidance("linhas", [])).toMatch(/palma bem aberta/u);
  });
});

describe("capítulo indisponível", () => {
  it("visível, mas indeterminada: não diz que não foi vista", () => {
    const m = unavailableMessage(
      "maos",
      [
        u("hand.palmShape", "unclassifiable"),
        u("hand.fingerLength", "unclassifiable"),
      ],
      ["angled"],
    );
    expect(m).toMatch(
      /^Nesta foto, o formato da palma e o comprimento dos dedos aparecem, mas não puderam ser classificados com segurança; por isso esta parte da leitura não foi feita\. Uma nova foto pode permitir esta leitura: palma de frente/u,
    );
    expect(m).not.toMatch(/não ficaram visíveis|não pôde ser observad/u);
  });

  it("foto insuficiente e motivos combinados não escondem o que faltou", () => {
    expect(
      unavailableMessage(
        "linhas",
        [u("head.length", "unclassifiable")],
        ["hand_cropped"],
        true,
      ),
    ).toMatch(
      /^Nesta foto, as linhas da palma não puderam ser observadas com segurança;/u,
    );
    const mixed = unavailableMessage(
      "linhas",
      [
        u("head.start", "unclassifiable"),
        u("life.arc", "obscured"),
        u("heart.length", "too_faint"),
      ],
      ["glare"],
    );
    expect(mixed).toMatch(
      /^Nesta foto, o início da linha da cabeça aparece, mas não pôde ser classificado com segurança, e as demais características das linhas não ficaram visíveis; por isso/u,
    );
    expect(
      unavailableMessage(
        "maos",
        [
          u("hand.palmShape", "unclassifiable"),
          u("hand.fingerLength", "out_of_frame"),
        ],
        ["hand_cropped"],
      ),
    ).toMatch(
      /^Nesta foto, o formato da palma aparece, mas não pôde ser classificado com segurança, e o comprimento dos dedos não ficou visível; .*mão inteira no quadro/u,
    );
  });

  it("não identificada e não visível têm mensagens próprias", () => {
    expect(
      unavailableMessage("linhas", [u("heart.shape", "ambiguous")], []),
    ).toMatch(/não foi possível identificar com segurança qual linha é qual/u);
    expect(
      unavailableMessage("linhas", [u("life.arc", "too_faint")], ["glare"]),
    ).toMatch(
      /as linhas da palma não ficaram visíveis com segurança.*sem reflexos/su,
    );
  });

  it("textos do sistema não usam linguagem proibida", () => {
    const all = [
      unavailableMessage("maos", [u("hand.palmShape", "unclassifiable")], []),
      unavailableMessage("linhas", [u("life.arc", "obscured")], ["too_dark"]),
      ...condensedLimitations([u("life.arc", "obscured")]),
      partialNote(["life.arc"]),
    ].join(" ");
    for (const re of PALM_FORBIDDEN_TEXT_PATTERNS) expect(all).not.toMatch(re);
  });
});

describe("ressalva de parcialidade", () => {
  it("nomeia as características, sem repetir", () => {
    expect(partialNote(["life.arc", "life.arc"])).toBe(
      "A linha da vida ficou só parcialmente visível na foto; leia essa interpretação com reserva.",
    );
    // No nível da linha: aspectos da mesma linha não se repetem.
    expect(
      partialNote([
        "heart.length",
        "heart.shape",
        "head.slope",
        "fate.presence",
      ]),
    ).toBe(
      "A linha do coração, a linha da cabeça e a linha do destino ficaram só parcialmente visíveis na foto; leia essas interpretações com reserva.",
    );
    expect(partialNote(["hand.palmShape"])).toMatch(
      /^O formato da palma ficou/u,
    );
  });
});
