/**
 * Avaliação comparativa cega entre modelos (Fase 02F.1).
 *
 * Cada caso fictício é gerado por cada modelo com as MESMAS entradas e
 * condições (mesmo relatório do motor, prompt, schema, esforço, limite de
 * tokens e de tentativas). Os relatórios recebem rótulos aleatórios
 * ("Relatório A"…), sem nome de modelo, custo ou latência; a chave que liga
 * rótulo a modelo fica em arquivo separado, para abrir só depois da nota.
 * Os artefatos nunca contêm prompts.
 */
import type { InterpretationReport } from "../contract";
import type { AiProvider, GeneratedReport } from "./contract";
import {
  crossChapterRepetition,
  generateReport,
  type GenerateOptions,
} from "./generate";

export const QUALITY_CRITERIA = [
  {
    id: "personalizacao",
    label: "Personalização",
    question:
      "O texto soa escrito para este mapa, articulando as posições, ou poderia servir a qualquer pessoa?",
  },
  {
    id: "profundidade",
    label: "Profundidade interpretativa",
    question:
      "Vai além de repetir a interpretação da biblioteca, relacionando temas com nuance?",
  },
  {
    id: "clareza",
    label: "Clareza da linguagem brasileira",
    question:
      "Português do Brasil natural, frases claras, termos técnicos explicados, linguagem neutra quanto a gênero?",
  },
  {
    id: "coerencia",
    label: "Coerência narrativa",
    question:
      "As seções seguem uma ordem progressiva e se conectam, sem contradições inventadas?",
  },
  {
    id: "invencoes",
    label: "Ausência de informações inventadas",
    question:
      "Cada afirmação astrológica corresponde aos itens citados? (Confira seção por seção.)",
  },
  {
    id: "rastreabilidade",
    label: "Rastreabilidade",
    question:
      "As referências de cada seção correspondem de fato ao que o texto diz?",
  },
  {
    id: "limitacoes",
    label: "Respeito às limitações do mapa",
    question:
      "Horário aproximado/desconhecido e itens incertos são tratados com a devida reserva?",
  },
  {
    id: "repeticoes",
    label: "Repetições",
    question:
      "O texto evita repetir ideias, expressões e aberturas? (5 = sem repetições incômodas.)",
  },
  {
    id: "sintese",
    label: "Qualidade da síntese",
    question:
      "A síntese amarra os temas do capítulo sem trazer informação nova?",
  },
  {
    id: "perguntas",
    label: "Qualidade das perguntas de reflexão",
    question:
      "As perguntas são abertas, pertinentes ao capítulo e não induzem respostas?",
  },
] as const;

export const SCALE_NOTE =
  "Escala de 1 a 5 (1 = inadequado, 3 = aceitável, 5 = excelente). O tamanho do texto não é critério: um texto mais longo só merece nota maior se for de fato melhor nos critérios.";

export type EvalCase = {
  id: string;
  label: string;
  report: InterpretationReport;
};
export type EvalModel = { name: string; provider: AiProvider };

export type EvalRun = {
  caseId: string;
  modelName: string;
  generated: GeneratedReport;
};

/**
 * Gera todos os relatórios, um par (caso, modelo) por vez. Dentro de cada
 * relatório os capítulos rodam em paralelo, como no produto.
 */
export async function runComparison(
  cases: EvalCase[],
  models: EvalModel[],
  options: GenerateOptions,
): Promise<EvalRun[]> {
  const runs: EvalRun[] = [];
  for (const c of cases)
    for (const m of models)
      runs.push({
        caseId: c.id,
        modelName: m.name,
        generated: await generateReport(c.report, m.provider, options),
      });
  return runs;
}

const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

/** Verificações automáticas que não revelam o modelo. */
function automaticChecks(g: GeneratedReport) {
  return {
    chaptersFromAi: g.chapters.filter((c) => c.source === "ai").length,
    chaptersFromLibrary: g.chapters
      .filter((c) => c.source === "library")
      .map((c) => ({ id: c.id, reason: c.fallbackReason })),
    crossChapterRepetition: crossChapterRepetition(g),
    words: g.chapters.reduce(
      (n, c) =>
        n +
        words(c.introduction) +
        c.sections.reduce((m, s) => m + words(s.text), 0) +
        words(c.synthesis),
      0,
    ),
  };
}

export type BlindReport = {
  label: string;
  caseId: string;
  caseLabel: string;
  disclaimer: string;
  chapters: GeneratedReport["chapters"];
  checks: ReturnType<typeof automaticChecks>;
};

export type BlindKeyEntry = {
  label: string;
  caseId: string;
  modelName: string;
  /** Modelos que efetivamente responderam (deve ser só o pedido). */
  servedModels: string[];
  metrics: GeneratedReport["metrics"];
};

/**
 * Embaralha os relatórios e atribui rótulos A, B, C… A função `random`
 * é injetável (testes); na avaliação real use crypto.
 */
export function blindRuns(
  runs: EvalRun[],
  cases: EvalCase[],
  random: () => number,
): { reports: BlindReport[]; key: BlindKeyEntry[] } {
  const order = runs.map((r, i) => ({ r, k: random(), i }));
  order.sort((a, b) => a.k - b.k || a.i - b.i);
  const reports: BlindReport[] = [];
  const key: BlindKeyEntry[] = [];
  order.forEach(({ r }, i) => {
    const label = `Relatório ${String.fromCharCode(65 + i)}`;
    const c = cases.find((x) => x.id === r.caseId)!;
    reports.push({
      label,
      caseId: r.caseId,
      caseLabel: c.label,
      disclaimer: r.generated.disclaimer,
      chapters: r.generated.chapters,
      checks: automaticChecks(r.generated),
    });
    key.push({
      label,
      caseId: r.caseId,
      modelName: r.modelName,
      servedModels: [
        ...new Set(r.generated.metrics.attempts.map((a) => a.model)),
      ],
      metrics: r.generated.metrics,
    });
  });
  return { reports, key };
}

export function renderBlindReport(b: BlindReport): string {
  let md = `# ${b.label} — ${b.caseLabel}\n\n_${b.disclaimer}_\n`;
  for (const ch of b.chapters) {
    md += `\n## ${ch.number}. ${ch.title}${ch.source === "library" ? " · texto da biblioteca (geração reprovada)" : ""}\n\n${ch.introduction}\n`;
    for (const s of ch.sections)
      md += `\n${s.text}\n<sub>Itens: ${s.itemIds.join(", ")} · Fatos: ${s.factIds.join(", ")}</sub>\n`;
    md += `\n**Síntese.** ${ch.synthesis}\n\n**Para refletir.**\n${ch.reflectionQuestions.map((q) => `- ${q}`).join("\n")}\n`;
    if (ch.limitations.length)
      md += `\n**Limitações.** ${ch.limitations.join(" ")}\n`;
  }
  const lib = b.checks.chaptersFromLibrary;
  md += `\n---\n\n**Verificações automáticas.** Capítulos aprovados: ${b.checks.chaptersFromAi} de ${b.chapters.length}.`;
  if (lib.length)
    md += ` Substituídos pela biblioteca: ${lib.map((l) => `${l.id} (${l.reason})`).join("; ")}.`;
  md += ` Repetições entre capítulos: ${b.checks.crossChapterRepetition.length}. Palavras: ${b.checks.words} (informativo; não é critério).\n`;
  return md;
}

export function renderScoreSheet(reports: BlindReport[]): string {
  const labels = reports.map((r) => r.label.replace("Relatório ", ""));
  let md = `# Ficha de avaliação cega\n\n${SCALE_NOTE}\n\nAvalie cada relatório sem abrir \`chave.json\`. Compare os dois relatórios de cada caso:\n\n`;
  const byCase = new Map<string, string[]>();
  for (const r of reports)
    byCase.set(r.caseLabel, [...(byCase.get(r.caseLabel) ?? []), r.label]);
  for (const [c, ls] of byCase) md += `- ${c}: ${ls.join(" e ")}\n`;
  md += `\n## Critérios\n\n`;
  for (const c of QUALITY_CRITERIA) md += `- **${c.label}** — ${c.question}\n`;
  md += `\n## Notas\n\n| Critério | ${labels.join(" | ")} |\n| --- | ${labels.map(() => "---").join(" | ")} |\n`;
  for (const c of QUALITY_CRITERIA)
    md += `| ${c.label} | ${labels.map(() => " ").join(" | ")} |\n`;
  md += `| **Média** | ${labels.map(() => " ").join(" | ")} |\n`;
  md += `\n## Observações por relatório\n\n${reports.map((r) => `### ${r.label}\n\n- Pontos fortes:\n- Problemas (cite capítulo e seção):\n- Afirmações sem origem nos itens:\n`).join("\n")}`;
  return md;
}

/** Resumo de custo e falhas (lido só depois da avaliação). */
export function summarizeKey(key: BlindKeyEntry[], usdToBrl: number) {
  const byModel = new Map<string, BlindKeyEntry[]>();
  for (const k of key)
    byModel.set(k.modelName, [...(byModel.get(k.modelName) ?? []), k]);
  return [...byModel].map(([model, entries]) => {
    const t = entries.map((e) => e.metrics.totals);
    const sum = (f: (x: (typeof t)[number]) => number) =>
      t.reduce((n, x) => n + f(x), 0);
    const usd = sum((x) => x.costUsd);
    return {
      model,
      reports: entries.length,
      calls: sum((x) => x.calls),
      retries: sum((x) => x.retries),
      failures: sum((x) => x.failures),
      chaptersFromAi: sum((x) => x.chaptersFromAi),
      chaptersFromLibrary: sum((x) => x.chaptersFromLibrary),
      inputTokens: sum((x) => x.inputTokens),
      outputTokens: sum((x) => x.outputTokens),
      costUsd: usd,
      costBrl: usd * usdToBrl,
      costBrlPerReport: (usd * usdToBrl) / entries.length,
      unpricedCalls: sum((x) => x.unpricedCalls),
      modelMismatches: sum((x) => x.modelMismatches),
      maxWallTimeMs: Math.max(...t.map((x) => x.wallTimeMs)),
    };
  });
}
