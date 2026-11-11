/**
 * Validação final do motor com Haiku 5.5 (preparação pós-02F.2).
 *
 * Três nascimentos FICTÍCIOS e diferentes entre si (data, local, fuso,
 * estação, precisão do horário), cinco capítulos cada, gerados só com
 * Haiku 5.5. Não é uma comparação cega: registra o que foi gerado, por que
 * cada tentativa foi reprovada, as correções automáticas, as notas de
 * precisão do sistema e o resultado que o cliente leria. Este módulo não faz
 * chamadas: o provedor (real ou simulado) é injetado.
 */
import type { BirthDataInput } from "../../birth-data/contract";
import type { PlaceRecord } from "../../places/types";
import type { InterpretationReport } from "../contract";
import { buildInterpretation } from "../engine";
import { fictionalChart } from "../test-support";
import type { AiProvider, GeneratedReport } from "./contract";
import { EVAL_CONDITIONS, EVAL_BUDGET_BRL, preflight } from "./eval-config";
import { generateReport } from "./generate";
import {
  auditTrail,
  renderClientReport,
  toClientReport,
  type ClientReport,
} from "./presentation";
import {
  PRECISION_PATTERNS,
  validateChapterDraft,
  type AiValidationError,
} from "./validate";

/** Único modelo desta avaliação. */
export const VALIDATION_MODEL = "claude-haiku-5-5";

/**
 * Teto desta avaliação (bem abaixo dos R$ 15 da 02F.1). Uma variável de
 * ambiente só pode baixá-lo.
 */
export const VALIDATION_BUDGET_BRL = 2;

export function validationBudgetBrl(
  env: Record<string, string | undefined>,
): number {
  const v = Number(env.SIDERA_AI_EVAL_BUDGET_BRL);
  const cap = Math.min(VALIDATION_BUDGET_BRL, EVAL_BUDGET_BRL);
  return Number.isFinite(v) && v > 0 ? Math.min(v, cap) : cap;
}

/** Mesmas condições da 02F.1 (comparabilidade), sem fallback pago. */
export const VALIDATION_CONDITIONS = { ...EVAL_CONDITIONS } as const;

// Locais reais (base IBGE do app); pessoas e horários fictícios.
const RECIFE: PlaceRecord = {
  id: "ibge:2611606",
  name: "Recife",
  admin1: "Pernambuco",
  admin1Code: "PE",
  country: "BR",
  lat: -8.0467,
  lon: -34.8771,
  tz: "America/Recife",
};
const PORTO_ALEGRE: PlaceRecord = {
  id: "ibge:4314902",
  name: "Porto Alegre",
  admin1: "Rio Grande do Sul",
  admin1Code: "RS",
  country: "BR",
  lat: -30.0318,
  lon: -51.2065,
  tz: "America/Sao_Paulo",
};
const MANAUS: PlaceRecord = {
  id: "ibge:1302603",
  name: "Manaus",
  admin1: "Amazonas",
  admin1Code: "AM",
  country: "BR",
  lat: -3.1187,
  lon: -60.0212,
  tz: "America/Manaus",
};

export type ValidationCaseDef = {
  id: string;
  label: string;
  date: string;
  place: PlaceRecord;
  time: BirthDataInput["time"];
};

/** Diferentes do caso de referência (São Paulo, 12/05/1990) e entre si. */
export const VALIDATION_CASES: readonly ValidationCaseDef[] = [
  {
    id: "exato",
    label: "Caso 1 · horário exato · Recife, 03/11/1984, 07:15",
    date: "03/11/1984",
    place: RECIFE,
    time: { precision: "exact", value: "07:15" },
  },
  {
    id: "aproximado",
    label:
      "Caso 2 · horário aproximado (± 1 h) · Porto Alegre, 21/07/2001, 22:40",
    date: "21/07/2001",
    place: PORTO_ALEGRE,
    time: { precision: "approximate", value: "22:40", marginMinutes: 60 },
  },
  {
    id: "desconhecido",
    label: "Caso 3 · horário desconhecido · Manaus, 29/02/1996",
    date: "29/02/1996",
    place: MANAUS,
    time: { precision: "unknown" },
  },
];

export type ValidationCase = ValidationCaseDef & {
  report: InterpretationReport;
};

export function buildValidationCases(): ValidationCase[] {
  return VALIDATION_CASES.map((c) => ({
    ...c,
    report: buildInterpretation(fictionalChart(c)),
  }));
}

export function validationPreflight(
  cases: ValidationCase[],
  usdBrl: number,
  budgetBrl: number,
) {
  return preflight(
    cases.map((c) => c.report),
    [VALIDATION_MODEL],
    usdBrl,
    budgetBrl,
  );
}

const TIME_POINT_RE =
  /(?<!\p{L})(?:Ascendente|Meio do Céu|Descendente|Fundo do Céu)(?!\p{L})|(?<!\p{L})casas?\s+(?:\d{1,2}|um|dois|três|quatro|cinco|seis|sete|oito|nove|dez|onze|doze)(?!\p{L}|\d)/gu;

/**
 * Auditoria independente do texto FINAL (IA ou biblioteca), fora das notas
 * e limitações do sistema: revalida cada capítulo e procura afirmações
 * incompatíveis com a precisão do horário.
 */
export function precisionAudit(
  generated: GeneratedReport,
  report: InterpretationReport,
) {
  const precision = report.basis.precision;
  const facts = new Map(report.facts.map((f) => [f.id, f]));
  return generated.chapters.map((ch) => {
    const source = report.chapters.find((c) => c.id === ch.id)!;
    const texts = [
      ch.introduction,
      ...ch.sections.map((s) => s.text),
      ch.synthesis,
      ...ch.reflectionQuestions,
    ];
    const precisionClaims = texts.flatMap((t) =>
      PRECISION_PATTERNS.map((re) => t.match(re)?.[0]).filter(
        (x): x is string => Boolean(x),
      ),
    );
    // Sem horário, nenhum ângulo nem casa pode aparecer no texto.
    const timeDependent =
      precision === "unknown"
        ? texts.flatMap((t) => [...t.matchAll(TIME_POINT_RE)].map((m) => m[0]))
        : [];
    const revalidation: AiValidationError[] = validateChapterDraft(
      {
        introduction: ch.introduction,
        sections: ch.sections.map((s) => ({
          text: s.text,
          itemIds: s.itemIds,
        })),
        synthesis: ch.synthesis,
        reflectionQuestions: ch.reflectionQuestions,
      },
      source,
      report,
    ).errors;
    // Cada intervalo calculado de corpo citado precisa de exatamente uma nota.
    const notes = ch.sections.flatMap((s) => s.notes);
    const expectedRanges = [
      ...new Set(ch.sections.flatMap((s) => s.factIds)),
    ].flatMap((id) => {
      const m = facts.get(id)?.observation.match(/entre (.+?) e (.+?)\)/u);
      return facts.get(id)?.kind === "body-sign" && m
        ? [`entre ${m[1]} e ${m[2]}`]
        : [];
    });
    const rangeNotesMissing = expectedRanges.filter(
      (r) => notes.filter((n) => n.includes(r)).length !== 1,
    );
    return {
      chapter: ch.id,
      source: ch.source,
      precisionClaims,
      timeDependent,
      revalidation: revalidation.map((e) => `${e.code}: ${e.message}`),
      notes,
      rangeNotesMissing,
      /** Nada incompatível com a precisão do horário e notas completas. */
      precisionOk:
        precisionClaims.length === 0 &&
        timeDependent.length === 0 &&
        rangeNotesMissing.length === 0,
      /** O texto final (IA ou biblioteca) passa de novo no validador. */
      revalidationOk: revalidation.length === 0,
    };
  });
}

/** Linha de base: Haiku 5.5 na avaliação da 02F.1 (chave.json da 02F.1). */
export const BASELINE_02F1_HAIKU = {
  reports: 3,
  calls: 20,
  retries: 5,
  failures: 5,
  chaptersFromAi: 15,
  chaptersFromLibrary: 0,
  costUsd: 0.0324,
  errorCodes: {
    UNSUPPORTED_POINT: 7,
    UNSUPPORTED_SIGN: 4,
    UNSUPPORTED_POSITION: 2,
    UNSUPPORTED_ASPECT: 2,
    REPETITION: 1,
  },
} as const;

export type ValidationRun = {
  caseId: string;
  label: string;
  precision: InterpretationReport["basis"]["precision"];
  generated: GeneratedReport;
  client: ClientReport;
  audit: ReturnType<typeof precisionAudit>;
};

/** Gera os três relatórios, um de cada vez (capítulos em paralelo). */
export async function runValidation(
  cases: ValidationCase[],
  provider: AiProvider,
): Promise<ValidationRun[]> {
  const runs: ValidationRun[] = [];
  for (const c of cases) {
    const generated = await generateReport(c.report, provider, {
      maxAttempts: VALIDATION_CONDITIONS.maxAttempts,
      maxOutputTokens: VALIDATION_CONDITIONS.maxOutputTokens,
      timeoutMs: VALIDATION_CONDITIONS.timeoutMs,
    });
    runs.push({
      caseId: c.id,
      label: c.label,
      precision: c.report.basis.precision,
      generated,
      client: toClientReport(generated),
      audit: precisionAudit(generated, c.report),
    });
  }
  return runs;
}

function errorCodes(runs: ValidationRun[]) {
  const counts: Record<string, number> = {};
  for (const r of runs)
    for (const a of r.generated.metrics.attempts)
      for (const e of a.errors) {
        const code = e.split(":")[0];
        counts[code] = (counts[code] ?? 0) + 1;
      }
  return counts;
}

/** Resumo de custo, consumo e falhas (interno). */
export function summarizeValidation(runs: ValidationRun[], usdBrl: number) {
  const sum = (f: (r: ValidationRun) => number) =>
    runs.reduce((n, r) => n + f(r), 0);
  const t = (r: ValidationRun) => r.generated.metrics.totals;
  const costUsd = sum((r) => t(r).costUsd);
  return {
    model: VALIDATION_MODEL,
    servedModels: [
      ...new Set(
        runs.flatMap((r) => r.generated.metrics.attempts.map((a) => a.model)),
      ),
    ],
    reports: runs.length,
    calls: sum((r) => t(r).calls),
    retries: sum((r) => t(r).retries),
    failures: sum((r) => t(r).failures),
    repairs: runs.flatMap((r) =>
      r.generated.metrics.attempts
        .filter((a) => a.repairs?.length)
        .map((a) => ({
          caseId: r.caseId,
          chapter: a.chapter,
          repairs: a.repairs,
        })),
    ),
    chaptersFromAi: sum((r) => t(r).chaptersFromAi),
    chaptersFromLibrary: sum((r) => t(r).chaptersFromLibrary),
    inputTokens: sum((r) => t(r).inputTokens),
    outputTokens: sum((r) => t(r).outputTokens),
    cacheReadInputTokens: sum((r) => t(r).cacheReadInputTokens),
    cacheCreationInputTokens: sum((r) => t(r).cacheCreationInputTokens),
    costUsd,
    costBrl: costUsd * usdBrl,
    unpricedCalls: sum((r) => t(r).unpricedCalls),
    modelMismatches: sum((r) => t(r).modelMismatches),
    wallTimeMsPerReport: runs.map((r) => t(r).wallTimeMs),
    errorCodes: errorCodes(runs),
    precisionOk: runs.every((r) => r.audit.every((a) => a.precisionOk)),
    /** Capítulos cujo texto final não passa de novo no validador. */
    revalidationFailures: runs.flatMap((r) =>
      r.audit
        .filter((a) => !a.revalidationOk)
        .map((a) => ({
          caseId: r.caseId,
          chapter: a.chapter,
          source: a.source,
          errors: a.revalidation,
        })),
    ),
  };
}

/** Arquivos da avaliação: texto do cliente separado da auditoria interna. */
export function validationArtifacts(
  runs: ValidationRun[],
  extra: {
    usdBrl: number;
    budgetBrl: number;
    preflightWorstBrl: number;
    spentUsd: number;
    blockedCalls: number;
  },
): Record<string, string> {
  const summary = summarizeValidation(runs, extra.usdBrl);
  const files: Record<string, string> = {};
  runs.forEach((r, i) => {
    files[`cliente/Caso-${i + 1}-${r.caseId}.md`] =
      `# ${r.label}\n\n${renderClientReport(r.client)}`;
  });
  files["auditoria.json"] =
    JSON.stringify(
      {
        conditions: VALIDATION_CONDITIONS,
        ...extra,
        spentBrl: extra.spentUsd * extra.usdBrl,
        summary,
        baseline02f1: BASELINE_02F1_HAIKU,
        runs: runs.map((r) => ({
          caseId: r.caseId,
          label: r.label,
          precision: r.precision,
          ...auditTrail(r.generated),
          precisionAudit: r.audit,
        })),
      },
      null,
      2,
    ) + "\n";

  const b = BASELINE_02F1_HAIKU;
  const row = (label: string, now: string | number, before: string | number) =>
    `| ${label} | ${now} | ${before} |\n`;
  let md = `# Validação final do motor — Haiku 5.5\n\n`;
  md += `Modelo pedido: ${summary.model} · modelos que responderam: ${summary.servedModels.join(", ") || "nenhum"}\n\n`;
  md += `| Métrica | Agora | 02F.1 (Haiku) |\n| --- | --- | --- |\n`;
  md += row("Relatórios", summary.reports, b.reports);
  md += row("Chamadas", summary.calls, b.calls);
  md += row("Novas tentativas", summary.retries, b.retries);
  md += row("Reprovações", summary.failures, b.failures);
  md += row(
    "Correções automáticas (referência cruzada)",
    summary.repairs.length,
    "—",
  );
  md += row(
    "Capítulos IA / biblioteca",
    `${summary.chaptersFromAi} / ${summary.chaptersFromLibrary}`,
    `${b.chaptersFromAi} / ${b.chaptersFromLibrary}`,
  );
  md += row(
    "Tokens entrada / saída",
    `${summary.inputTokens} / ${summary.outputTokens}`,
    "22319 / 54606",
  );
  md += row(
    "Custo",
    `US$ ${summary.costUsd.toFixed(4)} (R$ ${summary.costBrl.toFixed(2)})`,
    `US$ ${b.costUsd.toFixed(4)}`,
  );
  md += row(
    "Tempo por relatório (s)",
    summary.wallTimeMsPerReport.map((ms) => (ms / 1000).toFixed(1)).join(" / "),
    "25,0 / 30,4 / 27,0",
  );
  md += row(
    "Afirmações incompatíveis com a precisão / notas faltando",
    summary.precisionOk ? "nenhuma" : "HÁ PROBLEMAS (ver auditoria.json)",
    "—",
  );
  md += row(
    "Texto final reprovado na revalidação",
    summary.revalidationFailures.length
      ? summary.revalidationFailures
          .map(
            (f) =>
              `${f.caseId}/${f.chapter} (${f.source}): ${f.errors.join("; ")}`,
          )
          .join(" · ")
      : "nenhum",
    "—",
  );
  md += `\n## Motivos de reprovação (por código)\n\n| Código | Agora | 02F.1 (Haiku) |\n| --- | --- | --- |\n`;
  const codes = new Set([
    ...Object.keys(summary.errorCodes),
    ...Object.keys(b.errorCodes),
  ]);
  for (const c of codes)
    md += row(
      c,
      summary.errorCodes[c] ?? 0,
      (b.errorCodes as Record<string, number>)[c] ?? 0,
    );
  md += `\n## Por caso\n`;
  for (const r of runs) {
    md += `\n### ${r.label}\n\n| Capítulo | Origem | Tentativas | Motivos | Correções | Notas de precisão | Auditoria |\n| --- | --- | --- | --- | --- | --- | --- |\n`;
    for (const a of r.audit) {
      const attempts = r.generated.metrics.attempts.filter(
        (x) => x.chapter === a.chapter,
      );
      const reasons = attempts.flatMap((x) => x.errors).join("; ") || "—";
      const repairs =
        attempts.flatMap((x) => x.repairs ?? []).join("; ") || "—";
      md += `| ${a.chapter} | ${a.source} | ${attempts.length} | ${reasons.replace(/\|/g, "/")} | ${repairs} | ${a.notes.length} | ${a.precisionOk && a.revalidationOk ? "ok" : `${a.precisionOk ? "" : "precisão; "}${a.revalidationOk ? "" : a.revalidation.join("; ")}`} |\n`;
    }
  }
  files["resumo.md"] = md;
  return files;
}
