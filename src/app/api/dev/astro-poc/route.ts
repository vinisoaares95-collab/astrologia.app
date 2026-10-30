import { connection } from "next/server";

/**
 * Rota de DIAGNÓSTICO da Fase 02B — desligada por padrão.
 *
 * Só responde com `SIDERA_ASTRO_POC=1` (uso local) e calcula apenas um caso
 * fictício fixo, sem aceitar dados de entrada. Serve para verificar, num
 * build de produção, que o addon nativo e os arquivos de efemérides são
 * empacotados e carregados. NÃO habilitar em nenhum ambiente público:
 * o Swiss Ephemeris está sob AGPL até a decisão de licenciamento.
 */
export async function GET() {
  // Garante execução na requisição (nunca pré-renderizado no build).
  await connection();
  if (process.env.SIDERA_ASTRO_POC !== "1") {
    return new Response("Not Found", { status: 404 });
  }

  const started = performance.now();
  const [{ computeNatalChart }, { swissEphemeris }] = await Promise.all([
    import("@/features/astrology/service/compute-natal-chart"),
    import("@/features/astrology/engine/swiss-ephemeris"),
  ]);
  const loaded = performance.now();
  const chart = computeNatalChart(
    {
      instant: { year: 1990, month: 5, day: 12, hour: 17, minute: 30 },
      location: { latitude: -23.5505, longitude: -46.6333 },
      timePrecision: "exact",
    },
    swissEphemeris,
  );
  const done = performance.now();

  return Response.json({
    fictitiousCase: "1990-05-12T17:30Z, São Paulo",
    timingsMs: {
      moduleLoad: +(loaded - started).toFixed(2),
      compute: +(done - loaded).toFixed(2),
    },
    meta: chart.meta,
    angles: chart.angles,
    sun: chart.bodies[0],
    aspects: chart.aspects.length,
  });
}
