/**
 * Fidelidade editorial da revisão 04E.2B (textos dos capítulos 1 a 5).
 * Só texto: fatos, cálculos e associações não mudaram.
 */
import { describe, expect, it } from "vitest";

import { C9 } from "../report/journey-chapters/library";
import { libraryDraft } from "./ai/library-chapter";
import type { ChapterId } from "./contract";
import { buildInterpretation, INTERPRETATION_VERSION } from "./engine";
import { AUTHORED } from "./library/authored";
import { BODY_MEANINGS, HOUSE_MEANINGS, SIGN_MEANINGS } from "./library/base";
import { testChart, TEST_TIMES } from "./test-support";

const words = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .match(/[a-z]+/g) ?? [];
const STOP = new Set(
  "a o e de da do das dos em na no nas nos com que se ao aos as os um uma".split(
    " ",
  ),
);
/** Sequências de 3 palavras com ao menos 2 palavras de conteúdo. */
function trigrams(s: string): Set<string> {
  const w = words(s);
  const out = new Set<string>();
  for (let i = 0; i + 2 < w.length; i++) {
    const g = w.slice(i, i + 3);
    if (g.filter((x) => !STOP.has(x)).length >= 2) out.add(g.join(" "));
  }
  return out;
}
const shared = (a: string, b: string) =>
  [...trigrams(a)].filter((g) => trigrams(b).has(g));

const IDS: ChapterId[] = [
  "identidade",
  "emocional",
  "mente",
  "relacionamentos",
  "talentos",
];

describe("biblioteca 02E: revisão 04E.2B", () => {
  it("versão atualizada", () => {
    expect(INTERPRETATION_VERSION).toBe("02e.2");
  });

  it("nenhuma função de corpo repete trecho das qualidades de signo ou das áreas de casa (frases compostas)", () => {
    // As frases compostas juntam a função a qualidades ("…a temas como…") ou
    // a áreas ("…às viagens…"): um trecho em comum vira repetição literal
    // na mesma frase, como "busca de sentido" (E1).
    for (const b of Object.values(BODY_MEANINGS)) {
      for (const s of Object.values(SIGN_MEANINGS))
        expect(shared(b.function, s.qualities), `${b.name}/${s.name}`).toEqual(
          [],
        );
      for (const h of Object.values(HOUSE_MEANINGS))
        expect(shared(b.function, h.area), `${b.name}/${h.name}`).toEqual([]);
    }
  });

  it("textos aprovados aplicados (T3, T4)", () => {
    expect(SIGN_MEANINGS.sagittarius.qualities).toBe(
      "entusiasmo, amplitude de horizontes e desejo de compreender",
    );
    expect(HOUSE_MEANINGS[9].area).toBe(
      "as viagens, os estudos e a visão de mundo",
    );
    const all = Object.values(AUTHORED)
      .map((e) => e.text)
      .join(" ");
    expect(all).not.toMatch(/próprias mãos/u);
    expect(all).toMatch(
      /construir algo concreto, passo a passo, pode trazer satisfação\./u,
    );
  });

  it("duas perguntas em cada capítulo astrológico, todas distintas", () => {
    const report = buildInterpretation(testChart(TEST_TIMES.exact));
    const qs = IDS.flatMap((id) => {
      const q = libraryDraft(report, id).reflectionQuestions;
      expect(q, id).toHaveLength(2);
      for (const x of q) expect(x).toMatch(/\?$/u);
      return q;
    });
    expect(new Set(qs).size).toBe(qs.length);
  });

  it("capítulo 1 (T6): a nova pergunta não parafraseia a de identidade do capítulo 9 nem a de concordar/discordar", () => {
    const report = buildInterpretation(testChart(TEST_TIMES.exact));
    const [first, second] = libraryDraft(
      report,
      "identidade",
    ).reflectionQuestions;
    expect(first).toBe(
      "Quando alguém acaba de conhecer você, o que costuma perceber primeiro — e o que só aparece com o tempo?",
    );
    expect(second).toBe(
      "Qual dessas descrições combina menos com a sua experiência, e por quê?",
    );
    // Checagem automática mínima; a revisão de sentido é humana (04E.2B).
    expect(shared(first, C9.q.identidade)).toEqual([]);
    expect(shared(first, C9.final)).toEqual([]);
    expect(first).not.toMatch(/mais (com )?você|concord|discord/u);
  });
});
