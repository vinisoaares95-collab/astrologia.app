import { describe, expect, it } from "vitest";

import {
  clearHand,
  insufficientPhoto,
  linesMissing,
  partialHand,
} from "./__fixtures__/observations";
import { buildPalmInterpretation, type PalmReport } from "./engine";
import { PALM_LIBRARY, PARTIAL_CAVEAT, PROPORTION_CAVEAT } from "./library";
import { validatePalmObservation } from "./validate-observation";

function reportOf(raw: unknown, hand: "right" | "left" = "right"): PalmReport {
  const r = validatePalmObservation(raw, hand);
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  return buildPalmInterpretation(r.observation);
}
const items = (r: PalmReport) => r.chapters.flatMap((c) => c.items);

describe("mão nítida", () => {
  const r = reportOf(clearHand());

  it("capítulos 6 e 7 com títulos fixos", () => {
    expect(r.chapters.map((c) => [c.number, c.id, c.title])).toEqual([
      [6, "maos", "As características das suas mãos"],
      [7, "linhas", "As linhas da sua palma"],
    ]);
    expect(r.status).toBe("complete");
    expect(r.hand).toBe("right");
  });

  it("um item por característica observada, mais o tipo de mão", () => {
    expect(r.chapters[0].items.map((i) => i.id)).toEqual([
      "maos:hand.palmShape:square",
      "maos:hand.fingerLength:short",
      "maos:hand.type:earth",
    ]);
    expect(r.chapters[1].items.map((i) => i.id)).toEqual([
      "linhas:heart.length:long",
      "linhas:heart.shape:curved",
      "linhas:head.length:medium",
      "linhas:head.slope:sloping",
      "linhas:head.start:joined_life",
      "linhas:life.arc:wide",
      "linhas:fate.presence:present",
    ]);
    // Só a ressalva fixa de proporções (palma e dedos estimados a olho).
    expect(r.chapters[0].limitations).toEqual([PROPORTION_CAVEAT]);
    expect(r.chapters[1].limitations).toEqual([]);
  });

  it("cada item é rastreável até fatos existentes e coerente com a observação", () => {
    const factIds = new Set(r.facts.map((f) => f.id));
    for (const item of items(r)) {
      for (const id of item.factIds) expect(factIds.has(id)).toBe(true);
      const [, feature, value] = item.id.split(":");
      if (feature !== "hand.type")
        expect(item.symbolic).toBe(
          (
            PALM_LIBRARY as Record<string, Record<string, { symbolic: string }>>
          )[feature][value].symbolic,
        );
    }
  });

  it("a evidência fica no fato (auditoria), nunca no texto do item", () => {
    for (const f of r.facts) expect(f.evidence.length).toBeGreaterThan(0);
    const evidences = r.facts.flatMap((f) => f.evidence);
    for (const item of items(r))
      for (const e of evidences) {
        expect(item.symbolic).not.toContain(e);
        expect(item.observation).not.toContain(e);
      }
  });
});

describe("parcial", () => {
  const r = reportOf(partialHand(), "left");

  it("parcial vira item incerto com ressalva do sistema", () => {
    const heart = items(r).find((i) => i.id.startsWith("linhas:heart.shape"))!;
    expect(heart.certainty).toBe("uncertain");
    expect(heart.caveat).toBe(PARTIAL_CAVEAT);
  });

  it("não visível só aparece como limitação, sem item", () => {
    expect(items(r).some((i) => i.id.includes("fingerLength"))).toBe(false);
    expect(items(r).some((i) => i.id.includes("hand.type"))).toBe(false);
    expect(r.chapters[0].limitations).toContain(
      "O comprimento dos dedos não pôde ser observado na foto e não foi interpretado.",
    );
    expect(items(r).some((i) => i.id.includes("fate"))).toBe(false);
    expect(r.chapters[1].limitations).toContain(
      "A linha do destino não foi identificada com clareza na foto e não foi interpretada; isso não quer dizer que ela não exista.",
    );
  });

  it("problemas de imagem viram limitação comum aos dois capítulos", () => {
    for (const c of r.chapters)
      expect(c.limitations[0]).toBe(
        "A foto tinha reflexos; algumas características podem não ter sido observadas.",
      );
  });
});

describe("tipo de mão só com combinação nítida e prevista", () => {
  it("dedos médios não formam tipo elementar", () => {
    const o = clearHand();
    o.features["hand.fingerLength"].value = "medium";
    expect(items(reportOf(o)).some((i) => i.id.includes("hand.type"))).toBe(
      false,
    );
  });

  it("combinação com característica parcial: tipo incerto", () => {
    const o = clearHand();
    o.features["hand.palmShape"].visibility = "partial";
    o.features["hand.fingerLength"].value = "long";
    const t = items(reportOf(o)).find((i) => i.id === "maos:hand.type:air")!;
    expect(t.certainty).toBe("uncertain");
    expect(t.factIds).toEqual([
      "hand.type",
      "hand.palmShape",
      "hand.fingerLength",
    ]);
  });
});

describe("foto insuficiente e linhas ausentes", () => {
  it("foto insuficiente: nenhum item, pedido de nova foto nos dois capítulos", () => {
    const r = reportOf(insufficientPhoto());
    expect(r.status).toBe("insufficient");
    expect(r.facts).toEqual([]);
    for (const c of r.chapters) {
      expect(c.items).toEqual([]);
      expect(c.limitations).toEqual([
        "A foto não permitiu observar a palma com segurança. Para esta parte da leitura, é preciso uma nova foto.",
      ]);
    }
  });

  it("linhas não identificáveis: capítulo 7 vazio, com limitações por linha", () => {
    const r = reportOf(linesMissing());
    expect(r.chapters[1].items).toEqual([]);
    expect(r.chapters[1].limitations).toHaveLength(7);
    expect(r.chapters[0].items.length).toBeGreaterThan(0);
  });
});

describe("sem dados pessoais", () => {
  it("o relatório só contém mão, características e textos do sistema", () => {
    const r = reportOf(clearHand());
    expect(Object.keys(r).sort()).toEqual(
      ["chapters", "disclaimer", "facts", "hand", "status", "version"].sort(),
    );
    expect(JSON.stringify(r)).not.toMatch(/blob:|data:image|base64|exif/iu);
  });
});

describe("traço visto sem classificar (03c.2)", () => {
  it("não é interpretado; a limitação diz que aparece mas não foi classificado", () => {
    const raw = clearHand();
    raw.features["head.length"] = {
      visibility: "not_visible",
      reason: "unclassifiable",
    };
    raw.features["hand.fingerLength"] = {
      visibility: "not_visible",
      reason: "unclassifiable",
    };
    const r = reportOf(raw);
    const all = items(r);
    expect(all.some((i) => i.factIds.includes("head.length"))).toBe(false);
    // Sem dedos classificados, o tipo de mão não é derivado.
    expect(all.some((i) => i.factIds.includes("hand.type"))).toBe(false);
    expect(r.chapters[1].limitations).toContain(
      "O comprimento da linha da cabeça aparece na foto, mas não pôde ser classificado com segurança e não foi interpretado.",
    );
    expect(r.chapters[0].limitations).toContain(
      "O comprimento dos dedos aparece na foto, mas não pôde ser classificado com segurança e não foi interpretado.",
    );
  });

  it("concordância no feminino e linha do destino com texto próprio", () => {
    const raw = clearHand();
    raw.features["head.slope"] = {
      visibility: "not_visible",
      reason: "unclassifiable",
    };
    raw.features["fate.presence"] = {
      visibility: "not_visible",
      reason: "unclassifiable",
    };
    const lim = reportOf(raw).chapters[1].limitations;
    expect(lim).toContain(
      "A inclinação da linha da cabeça aparece na foto, mas não pôde ser classificada com segurança e não foi interpretada.",
    );
    expect(
      lim.some((l) => /linha do destino não foi identificada/u.test(l)),
    ).toBe(true);
  });
});

describe("ressalva de proporções (03F.1)", () => {
  it("palma ou dedos usados, mesmo nítidos: ressalva no capítulo 6", () => {
    const r = reportOf(clearHand());
    expect(r.chapters[0].limitations).toContain(PROPORTION_CAVEAT);
  });

  it("sem palma nem dedos observados: sem a ressalva", () => {
    const raw = clearHand();
    raw.features["hand.palmShape"] = {
      visibility: "not_visible",
      reason: "out_of_frame",
    };
    raw.features["hand.fingerLength"] = {
      visibility: "not_visible",
      reason: "out_of_frame",
    };
    expect(reportOf(raw).chapters[0].limitations).not.toContain(
      PROPORTION_CAVEAT,
    );
  });
});
