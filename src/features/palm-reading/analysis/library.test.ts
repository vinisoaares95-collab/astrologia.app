import { describe, expect, it } from "vitest";

import {
  FORBIDDEN_PATTERNS,
  SENSITIVE_PATTERNS,
} from "../../interpretation/ai/validate";
import { FEATURE_IDS, FEATURE_VALUES } from "./contract";
import {
  FEATURE_LABELS,
  HAND_TYPES,
  PALM_DISCLAIMER,
  PALM_FORBIDDEN_TEXT_PATTERNS,
  PALM_LIBRARY,
  PARTIAL_CAVEAT,
} from "./library";

const entries = FEATURE_IDS.flatMap((id) =>
  (FEATURE_VALUES[id] as readonly string[]).map((value) => ({
    id,
    value,
    entry: (PALM_LIBRARY[id] as Record<string, Record<string, string>>)[value],
  })),
);
const symbolicTexts = [
  ...entries.map((e) => e.entry.symbolic),
  ...Object.values(HAND_TYPES).map((t) => t.symbolic),
];
const allClientTexts = [
  ...symbolicTexts,
  ...entries.map((e) => e.entry.observation),
  PARTIAL_CAVEAT,
];

describe("biblioteca de quiromancia", () => {
  it("cobre todas as categorias do contrato, e só elas", () => {
    for (const id of FEATURE_IDS)
      expect(Object.keys(PALM_LIBRARY[id]).sort()).toEqual(
        [...FEATURE_VALUES[id]].sort(),
      );
    for (const e of entries) {
      expect(e.entry.definition.length).toBeGreaterThan(20);
      expect(e.entry.observation.length).toBeGreaterThan(10);
      expect(e.entry.symbolic.length).toBeGreaterThan(40);
    }
    expect(Object.keys(FEATURE_LABELS).sort()).toEqual([...FEATURE_IDS].sort());
  });

  it("toda leitura é apresentada como tradição simbólica", () => {
    for (const t of symbolicTexts)
      expect(t).toMatch(/tradiç|tradicional|quiromancia/iu);
  });

  it("sem linguagem determinista, saúde, finanças ou decisões de relacionamento", () => {
    for (const t of allClientTexts)
      for (const re of [...FORBIDDEN_PATTERNS, ...SENSITIVE_PATTERNS])
        expect(t, `${re} em: ${t}`).not.toMatch(re);
  });

  it("sem longevidade, fertilidade, dinheiro, casamento ou futuro", () => {
    for (const t of allClientTexts)
      for (const re of PALM_FORBIDDEN_TEXT_PATTERNS)
        expect(t, `${re} em: ${t}`).not.toMatch(re);
  });

  it("o aviso do capítulo separa foto, tradição e ciência", () => {
    expect(PALM_DISCLAIMER).toMatch(/fotografia/u);
    expect(PALM_DISCLAIMER).toMatch(/tradição simbólica da quiromancia/u);
    expect(PALM_DISCLAIMER).toMatch(
      /não são fatos científicos, diagnósticos nem previsões/u,
    );
  });

  it("os padrões proibidos pegam o que devem pegar", () => {
    const caught = (t: string) =>
      PALM_FORBIDDEN_TEXT_PATTERNS.some((re) => re.test(t));
    for (const t of [
      "Uma linha da vida curta indica a duração da vida.",
      "Sugere vida longa.",
      "Você terá dois filhos.",
      "Linha ligada ao casamento.",
      "Pode indicar riqueza.",
      "Atenção à saúde.",
      "No futuro, uma mudança.",
    ])
      expect(caught(t), t).toBe(true);
    expect(
      caught("uma leitura sobre o modo de viver, não sobre a duração da vida."),
    ).toBe(false);
  });

  it("a linha da vida nunca fala de duração da vida (só para negá-la)", () => {
    for (const v of FEATURE_VALUES["life.arc"]) {
      const t = PALM_LIBRARY["life.arc"][v].symbolic;
      expect(t).toMatch(/não sobre a duração da vida/u);
      expect(t).not.toMatch(/comprimento|curta|longa/iu);
    }
  });

  it("linha do destino só tem leitura para 'presente'", () => {
    expect(Object.keys(PALM_LIBRARY["fate.presence"])).toEqual(["present"]);
    expect(PALM_LIBRARY["fate.presence"].present.symbolic).toMatch(
      /não a um destino fixo/u,
    );
  });

  it("as frases de observação descrevem, não interpretam", () => {
    for (const e of entries)
      expect(e.entry.observation).not.toMatch(
        /tradiç|associad|signific|sugere|costuma/iu,
      );
  });

  it("tipos de mão: quatro combinações nítidas, nenhuma com dedos médios", () => {
    expect(
      Object.values(HAND_TYPES)
        .map((t) => `${t.palm}/${t.fingers}`)
        .sort(),
    ).toEqual([
      "rectangular/long",
      "rectangular/short",
      "square/long",
      "square/short",
    ]);
  });
});
