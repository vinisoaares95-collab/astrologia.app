// @vitest-environment node
import { describe, expect, it } from "vitest";

import { swissEphemeris } from "../astrology/engine/swiss-ephemeris";
import type { BirthDataInput } from "../birth-data/contract";
import { normalizeBirthData } from "../birth-data/normalize";
import { buildChartView } from "../natal-chart/build-chart";
import type { ChartView } from "../natal-chart/contract";
import type { PlaceRecord } from "../places/types";
import { toAiPayload } from "./ai/payload";
import { validateAiOutput } from "./ai/validate";
import { CHAPTERS, MAX_ITEMS_PER_CHAPTER, tightness } from "./chapters";
import type { InterpretationReport } from "./contract";
import { buildInterpretation, entryKeyFor } from "./engine";
import { extractFacts } from "./facts";
import { AUTHORED } from "./library/authored";

// Dados fictícios: 12/05/1990 em São Paulo (mesmo caso de referência da 02D).
const sp: PlaceRecord = {
  id: "t:sp",
  name: "São Paulo",
  admin1: "São Paulo",
  admin1Code: "SP",
  country: "BR",
  lat: -23.5505,
  lon: -46.6333,
  tz: "America/Sao_Paulo",
};
const deps = {
  getPlace: (id: string) => (id === sp.id ? sp : undefined),
  today: { year: 2026, month: 10, day: 30 },
  tzdbVersion: "teste",
};

function chartFor(time: BirthDataInput["time"]): ChartView {
  const r = normalizeBirthData(
    { date: "12/05/1990", placeId: sp.id, time },
    deps,
  );
  if (r.status !== "ok") throw new Error(JSON.stringify(r));
  return buildChartView(r.birth, swissEphemeris);
}

const exact = chartFor({ precision: "exact", value: "14:30" });
const approximate = chartFor({
  precision: "approximate",
  value: "14:30",
  marginMinutes: 120,
});
const unknown = chartFor({ precision: "unknown" });

const allItems = (r: InterpretationReport) =>
  r.chapters.flatMap((c) => c.items.map((i) => ({ chapter: c.id, ...i })));
const chapter = (r: InterpretationReport, id: string) =>
  r.chapters.find((c) => c.id === id)!;

/** Saída "ideal": um parágrafo por item, com o texto da própria biblioteca. */
function echoOutput(r: InterpretationReport) {
  return {
    chapters: r.chapters
      .filter((c) => c.items.length > 0)
      .map((c) => ({
        id: c.id,
        paragraphs: c.items.map((i) => ({
          text: [i.symbolic, i.caveat].filter(Boolean).join(" "),
          itemIds: [i.id],
        })),
      })),
  };
}

describe("seleção e prioridade (horário exato)", () => {
  const report = buildInterpretation(exact);

  it("gera os cinco capítulos na ordem, com no máximo 6 itens", () => {
    expect(report.chapters.map((c) => c.number)).toEqual([1, 2, 3, 4, 5]);
    for (const c of report.chapters) {
      expect(c.items.length).toBeGreaterThan(0);
      expect(c.items.length).toBeLessThanOrEqual(MAX_ITEMS_PER_CHAPTER);
    }
  });

  it("abre cada capítulo pelo seu fato central", () => {
    expect(chapter(report, "identidade").items[0].factIds).toEqual([
      "body-sign:sun",
    ]);
    expect(chapter(report, "emocional").items[0].factIds).toEqual([
      "body-sign:moon",
    ]);
    expect(chapter(report, "mente").items[0].factIds).toEqual([
      "body-sign:mercury",
    ]);
    expect(chapter(report, "relacionamentos").items[0].factIds).toEqual([
      "body-sign:venus",
    ]);
    expect(chapter(report, "talentos").items[0].factIds).toEqual([
      "body-sign:saturn",
    ]);
  });

  it("ordena os itens por peso decrescente", () => {
    for (const c of report.chapters) {
      const scores = c.items.map((i) => i.score);
      expect(scores).toEqual([...scores].sort((a, b) => b - a));
    }
  });

  it("usa o Ascendente, a casa do Sol e o regente quando há horário", () => {
    const ids = chapter(report, "identidade").items.flatMap((i) => i.factIds);
    expect(ids).toContain("angle-sign:asc");
    expect(ids).toContain("body-house:sun");
    expect(ids).toContain("chart-ruler:mercury");
    expect(chapter(report, "identidade").limitations).toEqual([]);
  });

  it("aspectos mais exatos pesam mais", () => {
    const f = (orb: number) =>
      ({ aspect: { type: "trine", orb, applying: null } }) as never;
    expect(tightness(f(0))).toBe(1);
    expect(tightness(f(10))).toBeCloseTo(0.4);
    expect(tightness(f(1))).toBeGreaterThan(tightness(f(5)));
  });
});

describe("associação capítulo ↔ elemento astrológico", () => {
  it.each([
    ["exato", exact],
    ["aproximado", approximate],
    ["desconhecido", unknown],
  ])("cada item pertence ao capítulo pelas regras (%s)", (_, chart) => {
    const report = buildInterpretation(chart);
    const facts = new Map(report.facts.map((f) => [f.id, f]));
    for (const item of allItems(report)) {
      const def = CHAPTERS.find((c) => c.id === item.chapter)!;
      for (const id of item.factIds)
        expect(def.rule(facts.get(id)!), `${item.id}`).not.toBeNull();
    }
  });
});

describe("rastreabilidade e posições não inventadas", () => {
  it.each([
    ["exato", exact],
    ["aproximado", approximate],
    ["desconhecido", unknown],
  ])(
    "todo item aponta para fatos existentes e para o ChartView (%s)",
    (_, chart) => {
      const report = buildInterpretation(chart);
      const facts = new Map(report.facts.map((f) => [f.id, f]));
      for (const item of allItems(report)) {
        expect(item.factIds.length).toBeGreaterThan(0);
        for (const id of item.factIds) {
          const fact = facts.get(id)!;
          expect(fact).toBeDefined();
          expect(fact.source.length).toBeGreaterThan(0);
          expect(item.observation).toContain(fact.observation);
        }
      }
    },
  );

  it("fatos copiam signos, casas e aspectos do cálculo", () => {
    for (const f of extractFacts(exact)) {
      if (f.kind === "body-sign") {
        const b = exact.bodies.find((x) => x.body === f.bodies[0])!;
        expect(f.sign).toBe(b.sign);
        expect(f.values.longitude).toBeCloseTo(b.longitude, 3);
      }
      if (f.kind === "body-house") {
        const b = exact.bodies.find((x) => x.body === f.bodies[0])!;
        expect(f.house).toBe(b.house);
      }
      if (f.kind === "aspect")
        expect(
          exact.aspects.some(
            (a) =>
              a.type === f.aspect!.type &&
              [a.a, a.b].sort().join() === [...f.bodies].sort().join(),
          ),
        ).toBe(true);
    }
  });

  it.each([
    ["exato", exact],
    ["aproximado", approximate],
    ["desconhecido", unknown],
  ])("os textos da própria biblioteca passam no validador (%s)", (_, chart) => {
    const report = buildInterpretation(chart);
    expect(validateAiOutput(echoOutput(report), report)).toEqual({
      ok: true,
      errors: [],
    });
  });
});

describe("horário desconhecido", () => {
  const report = buildInterpretation(unknown);

  it("não cria fatos de ângulos, casas, cúspides nem regente", () => {
    const kinds = new Set(report.facts.map((f) => f.kind));
    for (const k of [
      "angle-sign",
      "body-house",
      "cusp-sign",
      "chart-ruler",
    ] as const)
      expect(kinds.has(k)).toBe(false);
  });

  it("nenhum texto selecionado fala de Ascendente, Meio do Céu ou casas", () => {
    for (const item of allItems(report))
      expect(item.symbolic + item.observation).not.toMatch(
        /Ascendente|Meio do Céu|casa \d/,
      );
  });

  it("registra as limitações", () => {
    expect(chapter(report, "identidade").limitations.join(" ")).toMatch(
      /Ascendente e regente do mapa não considerados/,
    );
    expect(chapter(report, "talentos").limitations.join(" ")).toMatch(
      /Meio do Céu não considerado/,
    );
    for (const c of report.chapters)
      expect(c.limitations.join(" ")).toMatch(/Casas não consideradas/);
  });

  it("aspectos que não valem o dia inteiro entram com metade do peso e ressalva", () => {
    const uncertain = allItems(report).filter(
      (i) => i.certainty === "uncertain",
    );
    expect(uncertain.length).toBeGreaterThan(0);
    for (const i of uncertain) {
      expect(i.caveat).toMatch(/reserva/);
      expect(i.factIds[0]).toMatch(/^aspect:/);
    }
  });
});

describe("horário aproximado", () => {
  const report = buildInterpretation(approximate);

  it("não interpreta Ascendente que muda de signo na janela", () => {
    const asc = report.facts.find((f) => f.id === "angle-sign:asc")!;
    expect(asc.certainty).toBe("uncertain");
    expect(allItems(report).some((i) => i.factIds.includes(asc.id))).toBe(
      false,
    );
    expect(chapter(report, "identidade").limitations.join(" ")).toMatch(
      /Ascendente em Virgem no centro da janela/,
    );
  });

  it("casas que variam na janela viram limitação, não interpretação", () => {
    const houses = report.facts.filter((f) => f.kind === "body-house");
    expect(houses.length).toBeGreaterThan(0);
    for (const f of houses) expect(f.certainty).toBe("uncertain");
    expect(allItems(report).some((i) => /^house:/.test(i.entryKey))).toBe(
      false,
    );
    expect(chapter(report, "identidade").limitations.join(" ")).toMatch(
      /o Sol \(casas 7, 8, 9\)/,
    );
  });

  it("sem cúspides nem aspectos com ângulos", () => {
    expect(report.facts.some((f) => f.kind === "cusp-sign")).toBe(false);
    expect(
      report.facts.some(
        (f) =>
          f.kind === "aspect" &&
          f.bodies.some((b) => b === "asc" || b === "mc"),
      ),
    ).toBe(false);
  });
});

describe("dados incertos ou ausentes", () => {
  it("signo que muda na janela não é interpretado e vira limitação", () => {
    const chart: ChartView = {
      ...unknown,
      bodies: unknown.bodies.map((b) =>
        b.body === "moon"
          ? { ...b, range: { ...b.range!, crossesSign: true } }
          : b,
      ),
    };
    const report = buildInterpretation(chart);
    const emocional = chapter(report, "emocional");
    expect(
      emocional.items.some((i) => i.factIds.includes("body-sign:moon")),
    ).toBe(false);
    expect(emocional.limitations.join(" ")).toMatch(
      /Não interpretado por incerteza do horário: Lua a/,
    );
  });

  it("retrogradação com estação na janela não é afirmada", () => {
    const chart: ChartView = {
      ...unknown,
      bodies: unknown.bodies.map((b) =>
        b.body === "mercury" ? { ...b, motionVaries: true } : b,
      ),
    };
    const report = buildInterpretation(chart);
    const retro = report.facts.find((f) => f.id === "body-retrograde:mercury")!;
    expect(retro.certainty).toBe("uncertain");
    expect(retro.observation).toMatch(/muda de direção/);
    expect(allItems(report).some((i) => i.factIds.includes(retro.id))).toBe(
      false,
    );
    expect(chapter(report, "mente").limitations.join(" ")).toMatch(
      /muda de direção/,
    );
  });

  it("mapa sem aspectos continua gerando os capítulos centrais", () => {
    const report = buildInterpretation({ ...exact, aspects: [] });
    for (const c of report.chapters) expect(c.items.length).toBeGreaterThan(0);
    expect(report.facts.some((f) => f.kind === "aspect")).toBe(false);
  });
});

describe("repetição e tensões narrativas", () => {
  it.each([
    ["exato", exact],
    ["aproximado", approximate],
    ["desconhecido", unknown],
  ])("nenhum fato, chave ou texto se repete no relatório (%s)", (_, chart) => {
    const items = allItems(buildInterpretation(chart));
    const facts = items.flatMap((i) => i.factIds);
    expect(new Set(facts).size).toBe(facts.length);
    expect(new Set(items.map((i) => i.entryKey)).size).toBe(items.length);
    expect(new Set(items.map((i) => i.symbolic)).size).toBe(items.length);
  });

  it("chaves iguais (planetas lentos retrógrados) são agrupadas num item", () => {
    const chart: ChartView = {
      ...unknown,
      aspects: [],
      bodies: unknown.bodies.map((b) =>
        ["uranus", "neptune", "pluto"].includes(b.body)
          ? { ...b, retrograde: true }
          : b,
      ),
    };
    const report = buildInterpretation(chart);
    const outer = allItems(report).filter((i) => i.entryKey === "retro:outer");
    expect(outer).toHaveLength(1);
    expect(outer[0].factIds).toEqual([
      "body-retrograde:neptune",
      "body-retrograde:pluto",
      "body-retrograde:uranus",
    ]);
  });

  it("aponta tendências opostas no mesmo eixo", () => {
    const rel = chapter(buildInterpretation(exact), "relacionamentos");
    expect(rel.tensions).toEqual([
      expect.objectContaining({
        axis: "vinculo",
        itemIds: [
          "relacionamentos:body-sign:venus",
          "relacionamentos:body-sign:mars",
        ],
      }),
    ]);
  });
});

describe("biblioteca editorial", () => {
  it("as chaves autorais seguem o formato que o motor procura", () => {
    const keys = new Set(extractFacts(exact).map(entryKeyFor));
    for (const key of Object.keys(AUTHORED))
      expect(key).toMatch(
        /^(sign:\w+:\w+|house:\w+:\d+|aspect:\w+-\w+:(conjunction|harmonious|tense)|retro:\w+|element-(dominant|absent):\w+)$/,
      );
    expect([...keys].some((k) => k in AUTHORED)).toBe(true);
  });

  it("os textos autorais não usam linguagem determinista", () => {
    for (const [key, entry] of Object.entries(AUTHORED))
      expect(entry.text, key).not.toMatch(
        /certamente|com certeza|comprovad|cientificamente|garant|diagn[oó]stic|você (vai|irá)|seu destino/i,
      );
  });
});

describe("preparação para IA", () => {
  const report = buildInterpretation(exact);
  const payload = toAiPayload(report);

  it("o payload leva só os itens selecionados, com observação e interpretação separadas", () => {
    const ids = payload.chapters.flatMap((c) => c.items.map((i) => i.id));
    expect(ids).toEqual(allItems(report).map((i) => i.id));
    for (const c of payload.chapters)
      for (const i of c.items) {
        expect(i.observation).toBeTruthy();
        expect(i.interpretation).toBeTruthy();
      }
    expect(JSON.parse(JSON.stringify(payload))).toEqual(payload);
  });

  it("o validador recusa posições, casas, aspectos e graus inventados", () => {
    const sunItem = "identidade:body-sign:sun";
    const make = (text: string) => ({
      chapters: [
        ...echoOutput(report).chapters.filter((c) => c.id !== "identidade"),
        { id: "identidade", paragraphs: [{ text, itemIds: [sunItem] }] },
      ],
    });
    const codes = (text: string) =>
      validateAiOutput(make(text), report).errors.map((e) => e.code);

    expect(
      codes("Com o Sol em Touro, você pode valorizar o concreto."),
    ).toEqual([]);
    // Desde a 02F, o signo citado também é conferido isoladamente.
    expect(codes("Com o Sol em Leão, você pode brilhar.")).toEqual([
      "UNSUPPORTED_POSITION",
      "UNSUPPORTED_SIGN",
    ]);
    expect(codes("O Sol na casa 12 pede recolhimento.")).toEqual([
      "UNSUPPORTED_HOUSE",
    ]);
    expect(codes("Uma quadratura forte marca você.")).toEqual([
      "UNSUPPORTED_ASPECT",
    ]);
    expect(codes("O Sol a 5°10′ de Touro.")).toEqual(["UNSUPPORTED_DEGREE"]);
    expect(codes("O Sol a 21°43′ de Touro.")).toEqual([]);
    expect(codes("Você certamente terá sucesso.")).toEqual([
      "FORBIDDEN_LANGUAGE",
    ]);
  });

  it("o validador recusa citações fora do capítulo, capítulos ausentes e formato inválido", () => {
    const wrong = {
      chapters: [
        {
          id: "identidade",
          paragraphs: [
            { text: "Texto.", itemIds: ["emocional:body-sign:moon"] },
          ],
        },
      ],
    };
    const codes = validateAiOutput(wrong, report).errors.map((e) => e.code);
    expect(codes).toContain("UNKNOWN_ITEM");
    expect(codes).toContain("MISSING_CHAPTER");
    expect(validateAiOutput({}, report).errors[0].code).toBe("INVALID_SHAPE");
    expect(
      validateAiOutput({ chapters: [{ id: "x", paragraphs: [] }] }, report)
        .errors[0].code,
    ).toBe("UNKNOWN_CHAPTER");
  });

  it("o validador exige a ressalva em itens incertos", () => {
    const r = buildInterpretation(unknown);
    const item = allItems(r).find((i) => i.certainty === "uncertain")!;
    const out = echoOutput(r);
    const c = out.chapters.find((x) => x.id === item.chapter)!;
    c.paragraphs = c.paragraphs.map((p) =>
      p.itemIds[0] === item.id ? { ...p, text: item.symbolic } : p,
    );
    expect(validateAiOutput(out, r).errors.map((e) => e.code)).toEqual([
      "MISSING_CAVEAT",
    ]);
  });
});

describe("estabilidade", () => {
  it("a mesma entrada gera exatamente o mesmo relatório", () => {
    expect(buildInterpretation(exact)).toEqual(buildInterpretation(exact));
    expect(JSON.stringify(buildInterpretation(unknown))).toBe(
      JSON.stringify(buildInterpretation(unknown)),
    );
  });

  it("relatório de exemplo (São Paulo, 12/05/1990 14:30, fictício)", async () => {
    const report = buildInterpretation(exact);
    await expect(JSON.stringify(report, null, 2) + "\n").toMatchFileSnapshot(
      "./__fixtures__/example-report.sao-paulo-1990.json",
    );
  });
});
