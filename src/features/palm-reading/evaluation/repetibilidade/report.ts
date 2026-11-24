/**
 * Relatório do experimento de repetibilidade: por fotografia e consolidado.
 *
 * Só números e códigos. Nenhuma evidência textual do modelo, imagem, nome de
 * arquivo ou nome de pessoa (as fotos aparecem pelo código opaco e as
 * pessoas pelo pseudônimo).
 */
import { FEATURE_LABELS } from "./labels";
import { REP_MODEL, REP_STAGES } from "./config";
import type { AnalysisRecord, RunResult } from "./contract";
import {
  decide,
  summarizeGroup,
  type Decision,
  type GroupSummary,
} from "./decision";

const pct = (x: number | null | undefined) =>
  x === null || x === undefined
    ? "—"
    : `${(x * 100).toFixed(1).replace(".", ",")}%`;
const ci = (x: [number, number] | null, informative = true) =>
  x
    ? `${pct(x[0])}–${pct(x[1])}${informative ? "" : " (não informativo)"}`
    : "—";
const usd = (x: number) => `US$ ${x.toFixed(4).replace(".", ",")}`;
const sec = (ms: number) => (ms / 1000).toFixed(1).replace(".", ",");
const yes = (x: boolean | null) => (x === null ? "—" : x ? "sim" : "não");
const VERDICT_LABEL = {
  estavel: "estável",
  intermediaria: "intermediária",
  instavel: "instável",
  inconclusiva: "inconclusiva",
} as const;
const DECISION_LABEL = {
  manter: "Manter a análise atual",
  restringir: "Restringir características instáveis",
  captura: "Melhorar as instruções de captura",
  consenso: "Investigar múltiplas análises (consenso)",
  escopo: "Reconsiderar o escopo da leitura das mãos",
  inconclusivo: "Inconclusivo: faltam dados",
} as const;

export type ExperimentReport = {
  groups: GroupSummary[];
  decision: Decision;
  markdown: string;
};

function groupSection(g: GroupSummary): string {
  const title =
    g.origin === "original"
      ? "Arquivos originais reenviados"
      : "Fotografias recém-capturadas";
  const lines = [
    `## ${title}`,
    "",
    `- Fotos: ${g.photos.length}; pessoas: ${g.participants}. As repetições de uma foto **não** são fotos independentes.`,
    `- Inversão nas observações claras: ${pct(g.clearInversionRate)}; com alguma parcial: ${pct(g.partialInversionRate)}.`,
    `- Capítulo 6 estável: ${yes(g.product.ch6Stable)}; capítulo 7 estável: ${yes(g.product.ch7Stable)}; estado da leitura estável: ${yes(g.product.statusStable)}; pedido de nova foto estável: ${yes(g.product.retakeStable)}.`,
    "",
    "### Por característica",
    "",
    "| Característica | Fotos (pessoas) com dado | Células avaliáveis | Inversão | IC 95% nominal | IC 95% por foto | Fotos com inversão oposta | Concordância média | Indeterminada | Oscilação | Só motivo | Claras / parciais | Consenso 3 de 3 | Veredito |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...g.features.map(
      (f) =>
        `| ${FEATURE_LABELS[f.feature]} | ${f.photosWithData} (${f.participantsWithData}) | ${f.evaluableCells} | ${pct(f.inversionRate)} (${f.inversions}/${f.classifiedPairs}) | ${ci(f.inversionWilson)} | ${ci(f.inversionCluster, f.clusterInformative)} | ${f.oppositePhotos} | ${pct(f.meanAgreement)} | ${pct(f.indeterminateShare)} | ${pct(f.oscillationRate)} | ${pct(f.reasonOnlyRate)} | ${pct(f.clearInversionRate)} / ${pct(f.partialInversionRate)} | ${pct(f.consensusInversionRate)} | **${VERDICT_LABEL[f.verdict]}** |`,
    ),
    "",
    "### Por fotografia",
    "",
    "| Foto | Pessoa | Análises (válidas) | Inválidas | Erros | Estado estável | Nova foto (estável) | Cap. 6 igual | Cap. 7 igual | Sessões (concordância) | Custo | Custo médio (cache lido) | Tokens entrada / saída | Latência média / máx. |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    ...g.photos.map(
      (p) =>
        `| ${p.photoId} | ${p.participant} | ${p.executed} (${p.valid}) | ${p.invalid} | ${p.providerErrors} | ${p.statusStable ? "sim" : "não"} (${p.statusModal ?? "—"}) | ${pct(p.retakeShare)} (${p.retakeStable ? "sim" : "não"}) | ${pct(p.ch6Agreement)} | ${pct(p.ch7Agreement)} | ${Object.entries(
          p.bySession,
        )
          .map(([s, v]) => `${s}: ${pct(v.agreement)} (${v.valid})`)
          .join(
            "; ",
          )} | ${usd(p.costUsd)} | ${p.meanWarmCostUsd === null ? "—" : usd(p.meanWarmCostUsd)} | ${p.inputTokens} / ${p.outputTokens} | ${sec(p.meanLatencyMs)} / ${sec(p.maxLatencyMs)} s |`,
    ),
    "",
    ...g.photos.flatMap((p) => [
      `#### ${p.photoId}`,
      "",
      "| Característica | Leitura mais frequente | Concordância | Estrita | Classificadas | Inversões (oposta / gradual) | Oscilações | Só motivo |",
      "| --- | --- | --- | --- | --- | --- | --- | --- |",
      ...p.cells.map(
        (c) =>
          `| ${FEATURE_LABELS[c.feature]} | ${c.modal ?? "—"} | ${pct(c.agreement)} | ${pct(c.strictAgreement)} | ${c.classified}/${c.n} | ${c.inversions} (${c.opposite} / ${c.gradual}) de ${c.classifiedPairs} | ${c.oscillations} | ${c.reasonOnly} |`,
      ),
      "",
    ]),
  ];
  return lines.join("\n");
}

export function buildReport(
  records: AnalysisRecord[],
  runs: { stage: keyof typeof REP_STAGES; result: RunResult }[] = [],
): ExperimentReport {
  // Originais e novas SEMPRE separados.
  const groups = (["original", "nova"] as const)
    .map((o) => ({ o, rs: records.filter((r) => r.origin === o) }))
    .filter((x) => x.rs.length)
    .map((x) => summarizeGroup(x.o, x.rs));
  const decision = decide(groups, records);
  const executed = records.filter((r) => r.outcome !== "not_run");
  const spent = executed.reduce((n, r) => n + r.costUsd, 0);
  const md = [
    "# Experimento de repetibilidade visual — relatório",
    "",
    `Modelo: \`${REP_MODEL}\`, 1 tentativa por análise. Análises executadas: ${executed.length}. Gasto: ${usd(spent)}.`,
    ...runs.map(
      (r) =>
        `- Etapa ${r.stage}: ${r.result.calls} chamadas; ${usd(r.result.spentUsd)} de ${usd(REP_STAGES[r.stage].budgetUsd)}; ${r.result.stoppedBy ? `interrompida (${r.result.stoppedBy})` : "meta atingida"}.`,
    ),
    "",
    '**Leitura dos intervalos.** O IC nominal (Wilson) trata pares de análises como independentes e é otimista. O IC por foto reamostra fotografias; com menos de 5 fotos ele não é informativo. Um resultado "estável" significa só que não houve sinal de instabilidade acima do limite nesta amostra.',
    "",
    "## Decisão pré-registrada",
    "",
    `**${DECISION_LABEL[decision.primary]}.**`,
    "",
    ...decision.triggered.map((t) => `- ${DECISION_LABEL[t.key]}: ${t.why}.`),
    "",
    "| Característica | Veredito final (pior entre os grupos avaliáveis) |",
    "| --- | --- |",
    ...Object.entries(decision.verdicts).map(
      ([f, v]) =>
        `| ${FEATURE_LABELS[f as keyof typeof FEATURE_LABELS]} | ${VERDICT_LABEL[v]} |`,
    ),
    "",
    ...groups.map(groupSection),
  ].join("\n");
  return { groups, decision, markdown: md };
}
