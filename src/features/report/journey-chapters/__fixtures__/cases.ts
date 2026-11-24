/**
 * Casos FICTÍCIOS dos capítulos 8 e 9 (Fase 04D), só para testes.
 *
 * - "base": as 84 combinações da avaliação editorial (12 situações do céu ×
 *   7 das mãos), com os mesmos mapas de teste e as mesmas observações de mão
 *   já existentes no projeto.
 * - "construída": casos para variantes que não aparecem nas 84. Os mapas são
 *   calculados pelo próprio motor para datas fictícias encontradas por
 *   varredura; as mãos são variações de `clearHand` que passam pelo
 *   validador da 03C. Nenhum fato astrológico nem observação foi escrito à mão.
 */
import { swissEphemeris } from "../../../astrology/engine/swiss-ephemeris";
import { DEMO_CASES } from "../../../birth-data/demo-cases";
import { normalizeOnServer } from "../../../birth-data/server-normalize";
import { VALIDATION_CASES } from "../../../interpretation/ai/validation-run";
import type { InterpretationReport } from "../../../interpretation/contract";
import { buildInterpretation } from "../../../interpretation/engine";
import {
  fictionalChart,
  testChart,
  TEST_PLACE,
  TEST_TIMES,
} from "../../../interpretation/test-support";
import { buildChartView } from "../../../natal-chart/build-chart";
import {
  clearHand,
  insufficientPhoto,
  linesMissing,
  partialHand,
} from "../../../palm-reading/analysis/__fixtures__/observations";
import { buildPalmInterpretation } from "../../../palm-reading/analysis/engine";
import { validatePalmObservation } from "../../../palm-reading/analysis/validate-observation";
import { retakeRecommendedFor } from "../../../palm-reading/chapters/presentation";
import {
  buildHandsBridge,
  buildSkyBridge,
  type HandsBridge,
  type SkyBridge,
} from "../bridge";

export type Group = "base" | "construída";
export type SkyCase = {
  id: string;
  group: Group;
  report: InterpretationReport | null;
};
export type HandsCase = {
  id: string;
  group: Group;
  bridge: HandsBridge | null;
  status: string;
};

export async function skyCases(): Promise<SkyCase[]> {
  const out: SkyCase[] = [];
  const names = {
    exact: "C-ref exato",
    approximate: "C-ref aprox.",
    unknown: "C-ref desc.",
  };
  for (const [k, t] of Object.entries(TEST_TIMES))
    out.push({
      id: names[k as keyof typeof names],
      group: "base",
      report: buildInterpretation(testChart(t)),
    });
  VALIDATION_CASES.forEach((c, i) =>
    out.push({
      id: `C-val${i + 1}`,
      group: "base",
      report: buildInterpretation(fictionalChart(c)),
    }),
  );
  let n = 0;
  for (const d of DEMO_CASES) {
    const time =
      d.precision === "unknown"
        ? { precision: "unknown" }
        : d.precision === "approximate"
          ? { precision: "approximate", value: d.time, marginMinutes: d.margin }
          : { precision: "exact", value: d.time };
    const r = await normalizeOnServer({
      date: d.date,
      time,
      placeId: d.placeId,
    });
    if (r.status !== "ok") continue; // pedem escolha ou recusam o horário
    out.push({
      id: `C-demo${++n}`,
      group: "base",
      report: buildInterpretation(buildChartView(r.birth, swissEphemeris)),
    });
  }
  out.push({ id: "sem céu", group: "base", report: null });
  const K = (
    date: string,
    time: Parameters<typeof fictionalChart>[0]["time"],
  ) => buildInterpretation(fictionalChart({ date, place: TEST_PLACE, time }));
  // Lua em Leão, Vênus em Capricórnio, Marte em Touro.
  out.push({
    id: "K-contraponto",
    group: "construída",
    report: K("02/01/1991", { precision: "exact", value: "12:00" }),
  });
  // Lua em Câncer, Vênus em Touro, Marte em Áries.
  out.push({
    id: "K-ritmo-diferença",
    group: "construída",
    report: K("06/05/1992", { precision: "exact", value: "12:00" }),
  });
  // Horário desconhecido: Lua incerta, Vênus em Capricórnio.
  out.push({
    id: "K-lua-incerta",
    group: "construída",
    report: K("02/01/1991", { precision: "unknown" }),
  });
  return out;
}

type Raw = ReturnType<typeof clearHand>;
const nv = (reason: string) => ({ visibility: "not_visible", reason }) as never;
const variant = (f: (o: Raw) => void) => {
  const o = clearHand();
  f(o);
  return o;
};
const set = (o: Raw, feature: keyof Raw["features"], value: string) => {
  (o.features[feature] as { value: string }).value = value;
};

export function handsCases(): HandsCase[] {
  const raws: { id: string; group: Group; raw: Raw | null }[] = [
    { id: "M-clara", group: "base", raw: clearHand() },
    { id: "M-parcial", group: "base", raw: partialHand() },
    { id: "M-insuf.", group: "base", raw: insufficientPhoto() as Raw },
    { id: "M-sem-linhas", group: "base", raw: linesMissing() },
    {
      id: "M-dorso",
      group: "base",
      raw: variant(
        (o) =>
          void (o.image = { quality: "adequate", issues: ["back_of_hand"] }),
      ),
    },
    {
      id: "M-separada",
      group: "base",
      raw: variant((o) => {
        o.features["life.arc"] = nv("obscured");
        set(o, "head.start", "separate");
      }),
    },
    { id: "sem mãos", group: "base", raw: null },
    {
      id: "M-duas-imagens",
      group: "construída",
      raw: variant((o) => set(o, "heart.length", "short")),
    },
    {
      id: "M-reservada",
      group: "construída",
      raw: variant((o) => {
        set(o, "heart.length", "short");
        set(o, "heart.shape", "straight");
      }),
    },
    {
      id: "M-sem-elegível",
      group: "construída",
      raw: variant((o) => {
        set(o, "heart.length", "medium");
        o.features["heart.shape"] = nv("unclassifiable");
        set(o, "head.start", "separate");
      }),
    },
    {
      id: "M-sem-classificação",
      group: "construída",
      raw: variant((o) => {
        o.features["heart.length"] = nv("too_faint");
        o.features["heart.shape"] = nv("unclassifiable");
        o.features["head.start"] = nv("ambiguous");
      }),
    },
  ];
  return raws.map(({ id, group, raw }) => {
    if (!raw) return { id, group, bridge: null, status: "—" };
    const v = validatePalmObservation(raw, raw.hand);
    if (!v.ok) return { id, group, bridge: null, status: "recusada" };
    const report = buildPalmInterpretation(v.observation);
    return {
      id,
      group,
      status: report.status,
      bridge: buildHandsBridge(report, retakeRecommendedFor(report), false),
    };
  });
}

export const skyBridgeOf = (c: SkyCase): SkyBridge | null =>
  c.report ? buildSkyBridge(c.report) : null;
