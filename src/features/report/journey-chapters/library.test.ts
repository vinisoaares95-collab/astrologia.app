// @vitest-environment node
/**
 * Biblioteca dos capítulos 8 e 9: fidelidade ao documento aprovado e regras
 * editoriais conferíveis sem montar capítulos.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { libraryDraft } from "../../interpretation/ai/library-chapter";
import {
  FORBIDDEN_PATTERNS,
  SENSITIVE_PATTERNS,
} from "../../interpretation/ai/validate";
import type { ChapterId } from "../../interpretation/contract";
import { buildInterpretation } from "../../interpretation/engine";
import { BODY_MEANINGS } from "../../interpretation/library/base";
import { testChart, TEST_TIMES } from "../../interpretation/test-support";
import {
  PALM_FORBIDDEN_TEXT_PATTERNS,
  PALM_LIBRARY,
} from "../../palm-reading/analysis/library";
import { buildPalmInterpretation } from "../../palm-reading/analysis/engine";
import { validatePalmObservation } from "../../palm-reading/analysis/validate-observation";
import {
  clearHand,
  partialHand,
} from "../../palm-reading/analysis/__fixtures__/observations";
import { palmLibraryDraft } from "../../palm-reading/chapters/library-draft";
import { presumedGender } from "../../palm-reading/chapters/editorial";
import {
  C8,
  C9,
  JOURNEY_LIBRARY_VERSION,
  PALM_POLES,
  SUBJECT,
} from "./library";

const DOC = readFileSync(
  join(__dirname, "../../../../docs/fase-04d-biblioteca-consolidada.md"),
  "utf8",
).replace(/\s+/g, " ");
const flat = (o: unknown): string[] =>
  typeof o === "string" ? [o] : Object.values(o as object).flatMap(flat);
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

describe("biblioteca 04D", () => {
  it("todo texto é literalmente o do documento editorial aprovado", () => {
    const missing = [...flat(C8), ...flat(C9)].filter((t) => !DOC.includes(t));
    expect(missing).toEqual([]);
  });

  it("nenhum texto aciona os padrões de segurança do projeto nem presume gênero", () => {
    for (const t of [...flat(C8), ...flat(C9)]) {
      for (const re of [
        ...FORBIDDEN_PATTERNS,
        ...SENSITIVE_PATTERNS,
        ...PALM_FORBIDDEN_TEXT_PATTERNS,
      ])
        expect([t, re.test(t)]).toEqual([t, false]);
      expect(presumedGender(t)).toEqual([]);
    }
  });

  it("perguntas do capítulo 9 inéditas em relação às dos capítulos 1 a 7", () => {
    const report = buildInterpretation(testChart(TEST_TIMES.exact));
    const ids: ChapterId[] = [
      "identidade",
      "emocional",
      "mente",
      "relacionamentos",
      "talentos",
    ];
    const existing = ids.flatMap(
      (id) => libraryDraft(report, id).reflectionQuestions,
    );
    for (const raw of [clearHand(), partialHand()]) {
      const v = validatePalmObservation(raw, raw.hand);
      if (!v.ok) throw new Error();
      for (const ch of buildPalmInterpretation(v.observation).chapters)
        existing.push(...palmLibraryDraft(ch).reflectionQuestions);
    }
    expect(existing.length).toBeGreaterThan(10);
    const first3 = (s: string) => norm(s).split(" ").slice(0, 3).join(" ");
    for (const q of Object.values(C9.q))
      for (const e of existing) {
        expect(norm(q)).not.toBe(norm(e));
        expect(first3(q)).not.toBe(first3(e));
      }
    expect(new Set(Object.values(C9.q)).size).toBe(Object.keys(C9.q).length);
  });

  it("as perguntas aprovadas na revisão definitiva (d71f524) estão na biblioteca", () => {
    expect(C9.q.identidade).toBe(
      "Que atividade ou escolha do seu dia a dia parece mais com você, e por quê?",
    );
    expect(C9.q.pensamento).toBe(
      "Como você costuma chegar a uma conclusão quando algo importante está em jogo?",
    );
    expect(Object.keys(C9.practice).sort()).toEqual([
      "expressao",
      "foco",
      "ritmo",
      "vinculo",
    ]); // genérica retirada
  });

  it("tabela das mãos: só valores com texto aprovado e polo sustentado pelo próprio texto", () => {
    const WORD: Record<string, RegExp> = {
      "heart.length:short": /reservado/,
      "heart.length:long": /expansivo/,
      "heart.shape:straight": /contido/,
      "heart.shape:curved": /aberta/,
      "head.start:joined_life": /cautela/,
    };
    expect(Object.keys(PALM_POLES).sort()).toEqual(Object.keys(WORD).sort());
    for (const [k, re] of Object.entries(WORD)) {
      const [f, v] = k.split(":");
      const text = (
        PALM_LIBRARY as Record<string, Record<string, { symbolic: string }>>
      )[f][v].symbolic;
      expect(text).toMatch(re);
    }
  });

  it("assuntos do céu vêm das funções aprovadas dos corpos", () => {
    const FN: Record<string, RegExp> = {
      moon: /emocionais/,
      venus: /afeto/,
      mars: /agir/,
      sun: /identidade/,
      mercury: /pensar/,
    };
    for (const [b, re] of Object.entries(FN)) {
      expect(SUBJECT[b]).toBeTruthy();
      expect(BODY_MEANINGS[b as keyof typeof BODY_MEANINGS].function).toMatch(
        re,
      );
    }
    // Lentos, Júpiter e Saturno sem assunto: não sustentam temas.
    for (const b of ["jupiter", "saturn", "uranus", "neptune", "pluto"])
      expect(SUBJECT[b]).toBeUndefined();
  });
});

describe("capítulo 8: redundância (04E.2B)", () => {
  const w = (t: string) => t.toLowerCase().match(/[\p{L}]+/gu) ?? [];
  const grams = (t: string, k: number) => {
    const x = w(t);
    return new Set(
      x.slice(0, x.length - k + 1).map((_, i) => x.slice(i, i + k).join(" ")),
    );
  };

  it("versão 04d.3 com a introdução e a síntese de diferença revisadas", () => {
    expect(JOURNEY_LIBRARY_VERSION).toBe("04d.3");
    expect(C8.intro).toBe(
      "Este capítulo coloca lado a lado as imagens que a astrologia e a quiromancia usaram nos capítulos anteriores. São tradições simbólicas independentes: quando usam imagens parecidas, a semelhança é de linguagem, não uma constatação sobre você.",
    );
    expect(C8.synthesis.D).toBe(
      "Nos temas comparados, as duas tradições apontam para lados diferentes: são sistemas simbólicos distintos, e cada um pode ser confrontado com o que você vive.",
    );
  });

  it("a introdução não repete trechos das frases-ponte nem das sínteses", () => {
    const intro = grams(C8.intro, 4);
    for (const t of [
      ...Object.values(C8.bridge),
      ...Object.values(C8.synthesis),
    ])
      expect(
        [...grams(t, 4)].filter((g) => intro.has(g)),
        t,
      ).toEqual([]);
  });

  it("a ideia de 'não é erro' fica só no aviso essencial", () => {
    expect(C8.R0).toMatch(/não indicam erro/u);
    for (const t of [C8.intro, ...Object.values(C8.synthesis)])
      expect(t).not.toMatch(/\berro\b/u);
  });
});
