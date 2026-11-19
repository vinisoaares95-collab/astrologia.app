// @vitest-environment node
/**
 * Ajustes editoriais finais da Etapa A (03F.2). Exemplos positivos e
 * negativos tirados dos textos reais das duas execuções e da biblioteca;
 * nenhuma chamada paga.
 */
import { describe, expect, it } from "vitest";

import {
  AiProviderError,
  type AiProvider,
} from "../../interpretation/ai/contract";
import { clearHand, partialHand } from "../analysis/__fixtures__/observations";
import { FEATURE_VALUES, type FeatureId } from "../analysis/contract";
import { buildPalmInterpretation } from "../analysis/engine";
import { PALM_LIBRARY } from "../analysis/library";
import { unavailableMessage } from "../analysis/phrasing";
import { validatePalmObservation } from "../analysis/validate-observation";
import type { ChapterDraft } from "./contract";
import {
  presumedGender,
  stripDisclaimers,
  stripDisclaimerText,
} from "./editorial";
import { generatePalmChapters } from "./generate";
import { palmLibraryDraft } from "./library-draft";
import { createMockPalmTextProvider } from "./mock-text-provider";
import { validatePalmChapterDraft } from "./validate";

const reportOf = (raw: unknown) => {
  const r = validatePalmObservation(raw, (raw as { hand: "right" }).hand);
  if (!r.ok) throw new Error("fixture");
  return buildPalmInterpretation(r.observation);
};

describe("gênero presumido sobre a pessoa", () => {
  it.each([
    // As 5 construções encontradas nas duas execuções reais.
    "Como você percebe quando está mais guiado pelo impulso e quando está mais guiado pela reflexão?",
    "com passos medidos e com o tempo necessário para se sentir seguro.",
    "Que tipo de mudança você se sente mais disposto a enfrentar?",
    "Em que situações você se sente mais guiado pela intuição?",
    // Mesmas construções no feminino e com "você" explícito.
    "Você fica mais tranquila quando tem um plano.",
    "você é bastante cuidadoso nas escolhas",
    "Talvez você esteja preparada para mudar.",
  ])("recusa: %s", (t) => {
    expect(presumedGender(t)).not.toEqual([]);
  });

  it.each([
    // Masculino/feminino que descreve coisas, não a pessoa.
    "A linha da cabeça está inclinada em direção ao pulso.",
    "um ritmo mais cuidadoso diante do novo",
    "a preferência por um caminho seguro e conhecido",
    "um pensamento voltado ao concreto, prático e lógico",
    "O arco é mais fechado, próximo à base do polegar.",
    "A palma é mais longa do que larga.",
    "uma linha do coração longa e curva",
    "um temperamento aberto ao novo",
    // Construções neutras recomendadas.
    "Você se guia pela intuição e se sente à vontade com o novo.",
    "você tende a avaliar antes de agir",
  ])("aceita: %s", (t) => {
    expect(presumedGender(t)).toEqual([]);
  });

  it("nenhum falso positivo nas interpretações da biblioteca", () => {
    for (const f of Object.keys(PALM_LIBRARY) as FeatureId[])
      for (const v of FEATURE_VALUES[f]) {
        const e = (
          PALM_LIBRARY[f] as Record<
            string,
            { symbolic: string; observation: string }
          >
        )[v];
        expect(presumedGender(`${e.observation} ${e.symbolic}`)).toEqual([]);
      }
  });

  it("o validador recusa com orientação para reescrever", () => {
    const report = reportOf(clearHand());
    const chapter = report.chapters[1];
    const d = palmLibraryDraft(chapter);
    d.reflectionQuestions[0] = "Em que situações você se sente mais seguro?";
    const errors = validatePalmChapterDraft(d, chapter, report).errors;
    expect(errors.map((e) => e.code)).toEqual(["PRESUMED_GENDER"]);
    // Pede reformulação, não troca de flexão (03F.2, Rev2).
    expect(errors[0].fix).toMatch(/"se sente mais seguro"/u);
    expect(errors[0].fix).toMatch(/verbo ou expressão neutra/u);
    expect(errors[0].fix).toMatch(/você encontra segurança/u);
    expect(errors[0].fix).toMatch(
      /Trocar o masculino pelo feminino, ou o contrário, continua presumindo gênero/u,
    );
  });
});

describe("orações de aviso redundantes", () => {
  it.each([
    // Rev1 e primeira execução: só a oração sai; o conteúdo fica.
    [
      "Juntas, essas características descrevem tendências que a tradição associa à sensibilidade, à imaginação e ao equilíbrio, sem definir quem você é.",
      "Juntas, essas características descrevem tendências que a tradição associa à sensibilidade, à imaginação e ao equilíbrio.",
    ],
    [
      "São pistas para pensar sobre o seu presente, e não uma definição de quem você é.",
      "São pistas para pensar sobre o seu presente.",
    ],
    [
      "Use essas leituras como pontos de partida para pensar sobre o seu momento, sem tomá-las como verdades fixas.",
      "Use essas leituras como pontos de partida para pensar sobre o seu momento.",
    ],
    [
      "Como a observação foi feita de forma parcial, vale tomar essa leitura como um convite à reflexão, e não como uma definição fechada.",
      "Como a observação foi feita de forma parcial, vale tomar essa leitura como um convite à reflexão.",
    ],
    [
      "Nada disso fixa quem você é; são convites para observar como esses traços aparecem no seu dia a dia.",
      "São convites para observar como esses traços aparecem no seu dia a dia.",
    ],
    [
      "Trata-se de uma leitura simbólica sobre o modo de viver, e não um fato comprovado nem um retrato definitivo de quem você é. Vale observar o seu ritmo.",
      "Trata-se de uma leitura simbólica sobre o modo de viver. Vale observar o seu ritmo.",
    ],
  ])("%s", (before, after) => {
    expect(stripDisclaimerText(before)).toBe(after);
  });

  it.each([
    "A linha da cabeça longa é associada a um pensamento abrangente, sem pressa de concluir.",
    "Você tende a avaliar antes de agir, e não se lança sem pensar.",
    "Em que situações você reconhece essa leitura, e em quais não?",
  ])("não mexe em texto sem aviso: %s", (t) => {
    expect(stripDisclaimerText(t)).toBe(t);
  });

  it("perguntas não mudam; campo que ficaria vazio cancela a remoção", () => {
    const report = reportOf(clearHand());
    const d: ChapterDraft = palmLibraryDraft(report.chapters[1]);
    expect(stripDisclaimers(d)).toBeNull();
    d.introduction = "Nada disso fixa quem você é; é um retrato para refletir.";
    const r = stripDisclaimers(d)!;
    expect(r.draft.introduction).toBe("É um retrato para refletir.");
    expect(r.removed).toEqual(["introduction: aviso redundante removido"]);
    expect(d.introduction).toMatch(/^Nada disso/u); // original intacto
    const only = { ...d, synthesis: ", sem definir quem você é." };
    expect(stripDisclaimers(only)).toBeNull();
  });

  it("no fluxo completo: aviso removido, texto revalidado e registrado", async () => {
    const report = reportOf(clearHand());
    const inner = createMockPalmTextProvider();
    const provider: AiProvider = {
      ...inner,
      async generate(req) {
        const res = await inner.generate(req);
        const d = JSON.parse(res.text) as ChapterDraft;
        d.synthesis = d.synthesis.replace(/\.$/u, ", sem definir quem você é.");
        return { ...res, text: JSON.stringify(d) };
      },
    };
    const g = await generatePalmChapters(report, provider);
    for (const c of g.chapters) {
      expect(c.source).toBe("ai");
      expect(c.synthesis).not.toMatch(/quem você é/u);
    }
    expect(
      g.attempts
        .flatMap((a) => a.repairs ?? [])
        .filter((r) => /aviso/u.test(r)),
    ).toHaveLength(2);
  });
});

describe("posição da ressalva única", () => {
  it("vem depois da última seção com característica parcial", async () => {
    // Duas linhas parciais (coração e vida), em seções diferentes.
    const raw = partialHand();
    raw.features["life.arc"] = {
      ...raw.features["life.arc"],
      visibility: "partial",
    };
    const report = reportOf(raw);
    const failing: AiProvider = {
      id: "x",
      model: "x",
      async generate() {
        throw new AiProviderError("unavailable", "teste");
      },
    };
    const g = await generatePalmChapters(report, failing);
    const linhas = g.chapters.find((c) => c.id === "linhas")!;
    const uncertain = new Set(
      report.chapters[1].items
        .filter((i) => i.certainty === "uncertain")
        .map((i) => i.id),
    );
    const idx = linhas.sections
      .map((s, i) => (s.itemIds.some((id) => uncertain.has(id)) ? i : -1))
      .filter((i) => i >= 0);
    // A fixture tem parciais em mais de uma seção: a ressalva vai na última.
    expect(idx.length).toBeGreaterThan(1);
    linhas.sections.forEach((s, i) =>
      expect(s.notes.length).toBe(i === idx.at(-1) ? 1 : 0),
    );
  });
});

describe("orientação de nova foto pelo motivo da característica", () => {
  it("fora do quadro pede a mão inteira mesmo sem o problema na lista (sint-02)", () => {
    const m = unavailableMessage(
      "maos",
      [
        { feature: "hand.palmShape", reason: "out_of_frame" },
        { feature: "hand.fingerLength", reason: "out_of_frame" },
      ],
      ["blurry"],
    );
    expect(m).toMatch(/mão inteira no quadro, do pulso às pontas dos dedos/u);
    expect(m).toMatch(/celular apoiado e foco na palma/u);
  });

  it("sem repetir quando o problema já está na lista", () => {
    const m = unavailableMessage(
      "maos",
      [{ feature: "hand.fingerLength", reason: "out_of_frame" }],
      ["hand_cropped", "angled"],
    );
    expect(m.match(/mão inteira no quadro/gu)).toHaveLength(1);
  });
});

describe("nova tentativa depois de gênero presumido (Rev2)", () => {
  const report = (() => {
    const r = validatePalmObservation(clearHand(), "right");
    if (!r.ok) throw new Error("fixture");
    return buildPalmInterpretation(r.observation);
  })();
  // Simula o padrão da Rev2: 1ª "seguro"; 2ª só troca para "segura" ou
  // reformula, conforme a orientação recebida.
  function provider(second: (user: string) => string) {
    const inner = createMockPalmTextProvider();
    const calls: string[] = [];
    let n = 0;
    const p: AiProvider = {
      ...inner,
      async generate(req) {
        const res = await inner.generate(req);
        if (!/"id":\s*"linhas"/u.test(req.user)) return res;
        calls.push(req.user);
        const d = JSON.parse(res.text) as ChapterDraft;
        d.reflectionQuestions[0] =
          n++ === 0
            ? "O que ajuda você a se sentir seguro diante do novo?"
            : second(req.user);
        return { ...res, text: JSON.stringify(d) };
      },
    };
    return { p, calls };
  }

  it("a orientação enviada pede reformulação, não troca de flexão", async () => {
    const { p, calls } = provider(
      () => "O que ajuda você a encontrar segurança diante do novo?",
    );
    const g = await generatePalmChapters(report, p);
    expect(calls).toHaveLength(2);
    expect(calls[1]).toMatch(/Reformule a frase de "se sentir seguro"/u);
    expect(calls[1]).toMatch(/continua presumindo gênero/u);
    const linhas = g.chapters.find((c) => c.id === "linhas")!;
    expect(linhas.source).toBe("ai");
    expect(linhas.reflectionQuestions[0]).toMatch(/encontrar segurança/u);
  });

  it("só trocar pelo feminino continua recusado e cai na biblioteca", async () => {
    const { p } = provider(
      () => "O que ajuda você a se sentir segura diante do novo?",
    );
    const g = await generatePalmChapters(report, p);
    const linhas = g.chapters.find((c) => c.id === "linhas")!;
    expect(linhas.source).toBe("library");
    expect(linhas.fallbackReason).toMatch(/PRESUMED_GENDER/u);
  });
});
