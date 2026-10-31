/**
 * Mapas fictícios para testes e avaliação (não usado pelo app).
 * 12/05/1990 em São Paulo — o mesmo caso de referência das fases 02D/02E.
 */
import { swissEphemeris } from "../astrology/engine/swiss-ephemeris";
import type { BirthDataInput } from "../birth-data/contract";
import { normalizeBirthData } from "../birth-data/normalize";
import { buildChartView } from "../natal-chart/build-chart";
import type { ChartView } from "../natal-chart/contract";
import type { PlaceRecord } from "../places/types";

export const TEST_PLACE: PlaceRecord = {
  id: "t:sp",
  name: "São Paulo",
  admin1: "São Paulo",
  admin1Code: "SP",
  country: "BR",
  lat: -23.5505,
  lon: -46.6333,
  tz: "America/Sao_Paulo",
};

export const TEST_DATE = "12/05/1990";

export const TEST_TIMES = {
  exact: { precision: "exact", value: "14:30" },
  approximate: { precision: "approximate", value: "14:30", marginMinutes: 120 },
  unknown: { precision: "unknown" },
} as const satisfies Record<string, BirthDataInput["time"]>;

export function testChart(time: BirthDataInput["time"]): ChartView {
  const r = normalizeBirthData(
    { date: TEST_DATE, placeId: TEST_PLACE.id, time },
    {
      getPlace: (id) => (id === TEST_PLACE.id ? TEST_PLACE : undefined),
      today: { year: 2026, month: 10, day: 30 },
      tzdbVersion: "teste",
    },
  );
  if (r.status !== "ok") throw new Error(JSON.stringify(r));
  return buildChartView(r.birth, swissEphemeris);
}
