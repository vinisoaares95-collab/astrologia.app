// @vitest-environment node
/**
 * Capítulos 8 e 9 (Fase 04D): regressão permanente da avaliação editorial.
 *
 * Usa os motores reais (Swiss Ephemeris, interpretação 02E, mãos 03C) sobre
 * as fixtures do projeto: as 84 combinações da avaliação, as fixtures
 * construídas para variantes ausentes e os 6 casos adversariais de assunto.
 * Sem rede e sem IA.
 */
import { beforeAll, describe, expect, it, vi } from "vitest";

import {
  FORBIDDEN_PATTERNS,
  SENSITIVE_PATTERNS,
} from "../../interpretation/ai/validate";
import { PALM_FORBIDDEN_TEXT_PATTERNS } from "../../palm-reading/analysis/library";
import { presumedGender } from "../../palm-reading/chapters/editorial";
import type { ChapterArticleData } from "../chapter-article";
import {
  handsCases,
  skyBridgeOf,
  skyCases,
  type HandsCase,
  type SkyCase,
} from "./__fixtures__/cases";
import type { BridgeRef, HandsBridge, SkyBridge } from "./bridge";
import { C8, C9, OPPOSITE, SUBJECT, SUBJECT_AXES } from "./library";
import { buildJourneyChapters, type JourneyChapters } from "./render";
import { selectChapter8, selectChapter9 } from "./select";

type Row = {
  sky: SkyCase;
  hands: HandsCase;
  skyB: SkyBridge | null;
  out: JourneyChapters;
};
let rows: Row[] = [];

beforeAll(async () => {
  const skies = await skyCases();
  const hands = handsCases();
  rows = skies.flatMap((sky) =>
    hands.map((h) => {
      const skyB = skyBridgeOf(sky);
      return { sky, hands: h, skyB, out: buildJourneyChapters(skyB, h.bridge) };
    }),
  );
}, 120_000);

const base = () =>
  rows.filter((r) => r.sky.group === "base" && r.hands.group === "base");
const twoSources = (r: Row) => !!r.skyB && !!r.hands.bridge;
const texts = (a: ChapterArticleData) =>
  [
    a.introduction,
    ...a.sections.flatMap((s) => [
      s.text,
      s.heading ?? "",
      s.badge ?? "",
      ...(s.refs ?? []).map((x) => x.text),
    ]),
    a.synthesis,
    ...a.reflectionQuestions,
    ...a.limitations,
    a.unavailableMessage ?? "",
  ].filter(Boolean);
const C8_BAN =
  /(?<!\p{L})(confirma\p{L}*|comprova(?!m)\p{L}*|prova(?!\p{L})|provas|reforç\p{L}*|evidênci\p{L}*|correlaç\p{L}*|não é coincidência|por acaso|Fogo|Terra|Ar(?!\p{L})|Água|mão de)/u;
const C9_BAN =
  /(?<!\p{L})(conex\p{L}*|as duas leituras|as duas tradições|céu e mãos|aproxima\p{L}*)/iu;
const BIRTH =
  /\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}:\d{2}|São Paulo|Recife|Rio Branco|Nova York|Bom Jesus|Porto Alegre|Manaus|ibge:|geonames:|°/;

describe("cobertura: as 84 combinações da avaliação editorial", () => {
  it("são 84 (12 céus × 7 mãos)", () => {
    expect(base()).toHaveLength(84);
  });

  it("capítulo 8: 29 dos 66 casos com as duas fontes; nunca com uma fonte só", () => {
    const b = base();
    expect(b.filter((r) => r.out.chapter8.status === "content")).toHaveLength(
      29,
    );
    expect(b.filter(twoSources)).toHaveLength(66);
    for (const r of b.filter((x) => !twoSources(x)))
      expect(r.out.chapter8.status).toBe("unavailable");
    const reasons = b
      .filter((r) => r.out.selection8.status === "unavailable")
      .map((r) => (r.out.selection8 as { reason: string }).reason);
    const count = (k: string) => reasons.filter((x) => x === k).length;
    expect({
      U1: count("U1"),
      U2: count("U2"),
      U3: count("U3"),
      U5: count("U5"),
      U6: count("U6"),
    }).toEqual({
      U1: 11,
      U2: 6,
      U3: 1,
      U5: 33,
      U6: 4,
    });
  });

  it("capítulo 8: nenhum contraponto nas 84 (Lua e Vênus nunca opostos nesses mapas)", () => {
    for (const r of base())
      if (r.out.selection8.status === "content")
        for (const t of r.out.selection8.themes)
          expect(t.relation).not.toBe("AC");
  });

  it("capítulo 9: 80 de 84; indisponível só sem céu e com mãos sem conteúdo", () => {
    const b = base();
    const on = b.filter((r) => r.out.chapter9.status === "content");
    expect(on).toHaveLength(80);
    for (const r of b.filter((x) => x.out.chapter9.status !== "content")) {
      expect(r.skyB).toBeNull();
      expect(r.out.selection9.reason).toBe("V1");
    }
    // Funciona sem o capítulo 8.
    expect(
      on.filter((r) => r.out.chapter8.status === "unavailable").length,
    ).toBeGreaterThan(0);
    // Só astrologia: todos disponíveis.
    for (const r of b.filter((x) => x.skyB && !x.hands.bridge))
      expect(r.out.chapter9.status).toBe("content");
  });

  it("leitura das mãos parcial: o capítulo 9 continua possível", () => {
    const partial = base().filter((r) => r.hands.status === "partial");
    expect(partial).toHaveLength(36);
    expect(
      partial.filter((r) => r.out.chapter9.status === "content"),
    ).toHaveLength(35);
  });
});

describe("variantes ausentes nas 84 (fixtures construídas)", () => {
  const find = (sky: string, hands: string) =>
    rows.find((r) => r.sky.id === sky && r.hands.id === hands)!;

  it("contraponto só dentro do mesmo assunto (Lua × Vênus)", () => {
    const s = find("K-contraponto", "M-clara").out.selection8;
    expect(s.status).toBe("content");
    if (s.status !== "content") return;
    const t = s.themes.find((x) => x.axis === "expressao")!;
    expect(t.relation).toBe("AC");
    expect(t.sky.map((r) => r.key)).toEqual(["moon"]);
    expect(t.skyOpposite.map((r) => r.key)).toEqual(["venus"]);
  });

  it("diferença no ritmo e capítulo só com diferenças", () => {
    const r = find("K-ritmo-diferença", "M-clara");
    expect(
      r.out.selection8.status === "content" &&
        r.out.selection8.themes.map((t) => `${t.axis}:${t.relation}`),
    ).toEqual(["ritmo:D", "expressao:D"]);
    expect(r.out.chapter8.synthesis).toBe(C8.synthesis.D);
  });

  it("duas imagens nas mãos, variantes de reserva, U4 e U4-misto com a causa real", () => {
    const keys = new Set(
      rows.flatMap((r) =>
        r.out.selection8.status === "content"
          ? r.out.selection8.themes.map((t) => t.libraryKey)
          : [],
      ),
    );
    // Todas as frases-ponte são alcançadas por alguma combinação.
    expect([...keys].sort()).toEqual(Object.keys(C8.bridge).sort());
    const u4 = find("C-ref exato", "M-sem-classificação").out.chapter8;
    expect(u4.unavailableMessage).toBe(C8.U.U4);
    const mixed = find("C-ref exato", "M-sem-elegível").out.chapter8;
    expect(mixed.unavailableMessage).toBe(
      "O comprimento da linha do coração e o início da linha da cabeça foram observados, mas sem uma categoria que corresponda aos temas comparados, e o traçado da linha do coração não pôde ser classificado com segurança nesta leitura. Por isso, nenhuma conexão foi criada.",
    );
  });

  it("horário desconhecido: posição incerta fora das comparações, com a ressalva", () => {
    const a = find("K-lua-incerta", "M-clara").out.chapter8;
    expect(a.limitations).toContain(
      "A posição da Lua depende do horário de nascimento informado e não entra nestas comparações.",
    );
    expect(texts(a).join(" ")).not.toMatch(/Lua em/);
  });

  it("características parciais não sustentam conexões e aparecem nas ressalvas", () => {
    const a = find("C-ref exato", "M-parcial").out.chapter8;
    expect(a.limitations).toContain(
      "O traçado da linha do coração ficou só parcialmente visível na foto e por isso não sustenta nenhuma comparação.",
    );
    expect(texts(a).join(" ")).not.toMatch(/curvada para cima|traçado reto/);
  });
});

describe("invariantes em todas as combinações", () => {
  it("rastreabilidade, assunto e polos do capítulo 8", () => {
    for (const r of rows) {
      const s = r.out.selection8;
      if (s.status !== "content") continue;
      for (const t of s.themes) {
        expect(t.hands.length && t.sky.length).toBeTruthy();
        const subjects = new Set(t.hands.map((x) => SUBJECT[x.key]));
        for (const x of t.hands)
          expect(r.hands.bridge!.items).toContainEqual(x);
        for (const x of [...t.sky, ...t.skyOpposite]) {
          expect(r.skyB!.items).toContainEqual(x);
          expect(subjects.has(SUBJECT[x.key])).toBe(true); // sem contraponto artificial
        }
        if (t.palmPole) {
          const want = t.relation === "D" ? OPPOSITE[t.palmPole] : t.palmPole;
          for (const x of t.sky) expect(x.poles).toContain(want);
          for (const x of t.skyOpposite)
            expect(x.poles).toContain(OPPOSITE[t.palmPole]);
        }
        expect(C8.bridge[t.libraryKey]).toBeTruthy();
      }
    }
  });

  it("capítulo 9: assunto compatível, uma tradição fora do cap. 8, mínimo de 2 e sem repetição", () => {
    for (const r of rows) {
      const s = r.out.selection9;
      const pool: BridgeRef[] = [
        ...(r.skyB?.items ?? []),
        ...(r.hands.bridge && !r.hands.bridge.retakeRecommended
          ? [...r.hands.bridge.items, ...r.hands.bridge.reflect]
          : []),
      ];
      if (s.status === "content") {
        expect(s.themes.length).toBeGreaterThanOrEqual(2);
        expect(s.themes.length).toBeLessThanOrEqual(3);
      } else expect(s.themes.length).toBeLessThan(2);
      expect(new Set(s.themes.map((t) => t.subject)).size).toBe(
        s.themes.length,
      );
      expect(new Set(s.themes.map((t) => t.questionKey)).size).toBe(
        s.themes.length,
      );
      for (const t of s.themes) {
        expect(C9.q[t.questionKey]).toBeTruthy();
        expect(t.sources.length).toBeGreaterThanOrEqual(1);
        for (const x of t.sources) {
          expect(pool).toContainEqual(x);
          expect(SUBJECT[x.key]).toBe(t.subject);
          if (t.axis) {
            expect(SUBJECT_AXES[t.subject]).toContain(t.axis);
            expect(x.poles.some((p) => p.startsWith(`${t.axis}:`))).toBe(true);
          }
        }
        if (t.basis !== "c8")
          expect(new Set(t.sources.map((x) => x.side)).size).toBe(1);
        if (t.variant === "two") {
          const poles = new Set(
            t.sources.map((x) =>
              x.poles.find((p) => p.startsWith(`${t.axis}:`)),
            ),
          );
          expect(poles.size).toBe(2);
        }
      }
    }
  });

  it("determinismo: a mesma entrada gera a mesma saída", () => {
    for (const r of rows.slice(0, 60))
      expect(buildJourneyChapters(r.skyB, r.hands.bridge)).toEqual(r.out);
  });

  it("segurança editorial e privacidade em todo texto montado", () => {
    for (const r of rows)
      for (const [ch, a] of [
        ["8", r.out.chapter8],
        ["9", r.out.chapter9],
      ] as const)
        for (const t of texts(a)) {
          for (const re of [
            ...FORBIDDEN_PATTERNS,
            ...SENSITIVE_PATTERNS,
            ...PALM_FORBIDDEN_TEXT_PATTERNS,
          ])
            expect([r.sky.id, r.hands.id, ch, re.test(t)]).toEqual([
              r.sky.id,
              r.hands.id,
              ch,
              false,
            ]);
          expect(presumedGender(t)).toEqual([]);
          expect(t).not.toMatch(BIRTH);
          expect(t).not.toMatch(/mesma foto|variaram|variou/);
          if (ch === "8") expect(t).not.toMatch(C8_BAN);
          if (ch === "9") expect(t).not.toMatch(C9_BAN);
        }
  });

  it("sem frases repetidas dentro de um capítulo", () => {
    for (const r of rows)
      for (const a of [r.out.chapter8, r.out.chapter9]) {
        const long = texts(a).filter((t) => t.length > 40);
        expect(new Set(long).size).toBe(long.length);
      }
  });

  it("títulos e números de reportParts; capítulo 8 sem perguntas", () => {
    for (const r of rows) {
      expect([r.out.chapter8.number, r.out.chapter8.title]).toEqual([
        8,
        "Conexões simbólicas entre céu e mãos",
      ]);
      expect([r.out.chapter9.number, r.out.chapter9.title]).toEqual([
        9,
        "Seu guia pessoal de reflexão",
      ]);
      expect(r.out.chapter8.reflectionQuestions).toEqual([]);
    }
  });

  it("nenhuma requisição: a montagem não usa a rede", () => {
    const spy = vi.spyOn(globalThis, "fetch");
    for (const r of rows.slice(0, 20))
      buildJourneyChapters(r.skyB, r.hands.bridge);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("casos adversariais: referências de assuntos incompatíveis", () => {
  const R = (
    ref: string,
    side: "sky" | "hands",
    chapter: number,
    label: string,
    poles: string[],
    key: string,
  ): BridgeRef => ({
    ref,
    side,
    chapter,
    label,
    key,
    poles: poles as BridgeRef["poles"],
  });
  const sky = (items: BridgeRef[]): SkyBridge => ({
    version: "t",
    items,
    uncertain: [],
  });
  const hands = (items: BridgeRef[]): HandsBridge => ({
    version: "t",
    retakeRecommended: false,
    simulated: false,
    items,
    reflect: [],
    partial: [],
    unreliable: [],
    noPole: [],
    unclassified: [],
  });
  const heartOpen = [
    R(
      "linhas:heart.length:long",
      "hands",
      7,
      "linha do coração longa",
      ["expressao:expansiva"],
      "heart.length",
    ),
    R(
      "linhas:heart.shape:curved",
      "hands",
      7,
      "linha do coração curvada para cima",
      ["expressao:expansiva"],
      "heart.shape",
    ),
  ];
  const headJoined = [
    R(
      "linhas:head.start:joined_life",
      "hands",
      7,
      "linha da cabeça começando unida à da vida",
      ["ritmo:cautela"],
      "head.start",
    ),
  ];
  const sun = R(
    "identidade:body-sign:sun",
    "sky",
    1,
    "Sol em Câncer",
    ["vinculo:proximidade", "expressao:reservada"],
    "sun",
  );
  const mer = R(
    "mente:body-sign:mercury",
    "sky",
    3,
    "Mercúrio em Câncer",
    ["vinculo:proximidade", "expressao:reservada"],
    "mercury",
  );
  const jup = R(
    "talentos:body-sign:jupiter",
    "sky",
    5,
    "Júpiter em Câncer",
    ["vinculo:proximidade", "expressao:reservada"],
    "jupiter",
  );
  const sat = R(
    "talentos:body-sign:saturn",
    "sky",
    5,
    "Saturno em Capricórnio",
    ["ritmo:cautela", "expressao:reservada"],
    "saturn",
  );
  const marsLeo = R(
    "relacionamentos:body-sign:mars",
    "sky",
    4,
    "Marte em Leão",
    ["expressao:expansiva"],
    "mars",
  );
  const venAries = R(
    "relacionamentos:body-sign:venus",
    "sky",
    4,
    "Vênus em Áries",
    ["ritmo:impulso", "vinculo:autonomia"],
    "venus",
  );
  const ascVir = R(
    "identidade:angle-sign:asc",
    "sky",
    1,
    "Ascendente em Virgem",
    ["ritmo:cautela"],
    "asc",
  );
  const moonLeo = R(
    "emocional:body-sign:moon",
    "sky",
    2,
    "Lua em Leão",
    ["expressao:expansiva"],
    "moon",
  );
  const venCap = R(
    "relacionamentos:body-sign:venus",
    "sky",
    4,
    "Vênus em Capricórnio",
    ["ritmo:cautela", "expressao:reservada"],
    "venus",
  );

  const run = (s: SkyBridge | null, h: HandsBridge | null) => {
    const c8 = selectChapter8(s, h);
    const c9 = selectChapter9(s, h, c8);
    for (const t of c9.themes)
      for (const x of t.sources) expect(SUBJECT[x.key]).toBe(t.subject);
    return { c8, c9 };
  };
  const axisFrom = (c9: ReturnType<typeof selectChapter9>, keys: string[]) =>
    c9.themes.some(
      (t) => t.axis && t.sources.some((x) => keys.includes(x.key)),
    );

  it("X1: vínculo nunca é sustentado por Sol, Mercúrio e Júpiter", () => {
    const { c9 } = run(sky([sun, mer, jup]), null);
    expect(axisFrom(c9, ["sun", "mercury", "jupiter"])).toBe(false);
    expect(c9.themes.map((t) => t.subject)).toEqual([
      "identidade",
      "pensamento",
    ]);
  });

  it("X2: a linha do coração nunca é comparada com Marte (agir) nem com Saturno", () => {
    const { c8, c9 } = run(sky([marsLeo, sat]), hands(heartOpen));
    expect(c8).toEqual({ status: "unavailable", reason: "U6" });
    expect(axisFrom(c9, ["mars", "saturn"])).toBe(false);
  });

  it("X3: o ritmo das mãos nunca é comparado com Vênus, Ascendente ou Saturno", () => {
    const { c8, c9 } = run(sky([venAries, ascVir, sat]), hands(headJoined));
    expect(c8.status).toBe("unavailable");
    expect(
      c9.themes.some(
        (t) =>
          t.axis === "ritmo" &&
          t.sources.some((x) => ["venus", "asc", "saturn"].includes(x.key)),
      ),
    ).toBe(false);
  });

  it("X4: reserva só em posições de outros assuntos não vira tema de expressão", () => {
    const { c9 } = run(sky([sun, mer, jup, sat]), null);
    expect(c9.themes.some((t) => t.axis)).toBe(false);
  });

  it("X5 (controle): Lua × Vênus forma tensão no mesmo assunto, sem Sol nem Mercúrio no tema", () => {
    const { c9 } = run(sky([moonLeo, venCap, sun, mer]), null);
    const t = c9.themes.find((x) => x.subject === "afeto")!;
    expect(t.variant).toBe("two");
    expect(t.sources.map((x) => x.key).sort()).toEqual(["moon", "venus"]);
  });

  it("X6 (controle): com Marte em Leão presente, a expressão só cita a Lua", () => {
    const { c8 } = run(sky([moonLeo, marsLeo]), hands(heartOpen));
    expect(
      c8.status === "content" &&
        c8.themes
          .flatMap((t) => [...t.sky, ...t.skyOpposite])
          .map((x) => x.key),
    ).toEqual(["moon"]);
  });

  it("uma única referência válida sustenta um tema do capítulo 9", () => {
    const { c9 } = run(sky([venCap, sun]), null);
    expect(c9.status).toBe("content");
    expect(c9.themes.find((t) => t.subject === "afeto")!.sources).toEqual([
      venCap,
    ]);
  });

  it("um só assunto não basta: capítulo 9 indisponível (V2)", () => {
    const { c9 } = run(sky([sun, ascVir]), null);
    expect(c9).toMatchObject({ status: "unavailable", reason: "V2" });
  });
});
