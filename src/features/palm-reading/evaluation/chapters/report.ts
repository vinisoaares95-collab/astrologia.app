/**
 * Relatórios da Etapa A (03F.2).
 *
 * Automático (sem revisor): origem IA × biblioteca, tentativas e motivos,
 * revalidação do texto final, linguagem proibida, repetição de frases entre
 * relatórios, similaridade entre capítulos (personalização), custo.
 * Revisão editorial (revisor): fidelidade por seção, invenção, tratamento
 * das indeterminadas, clareza, naturalidade, personalização, repetição,
 * segurança, experiência com pouca informação.
 *
 * O material de revisão não mostra a origem do texto (IA ou biblioteca),
 * para não enviesar a nota editorial; ela fica no relatório técnico.
 */
import { FEATURE_LABELS } from "../../analysis/library";
import type { FeatureId } from "../../analysis/contract";
import { parseCsv, toCsv } from "../report";
import type { ChapterResult, ChaptersRun } from "./run";

const usd = (n: number) => `US$ ${n.toFixed(4)}`;
const CHAPTER_TITLE = { maos: "Capítulo 6", linhas: "Capítulo 7" } as const;

// ── Métricas automáticas ──────────────────────────────────────────────────

const words = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/u)
    .filter(Boolean);

const shingles = (t: string, n = 3) => {
  const w = words(t);
  const out = new Set<string>();
  for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(" "));
  return out;
};

export function jaccard(a: string, b: string): number {
  const A = shingles(a);
  const B = shingles(b);
  if (A.size === 0 && B.size === 0) return 1;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}

const fullText = (c: ChapterResult) =>
  [
    c.client.introduction,
    ...c.client.sections.map((s) => s.text),
    c.client.synthesis,
    ...c.client.reflectionQuestions,
  ].join(" ");

const sentences = (t: string) =>
  t
    .split(/(?<=[.!?…])\s+/u)
    .map((s) => s.trim())
    .filter((s) => s.length > 25);

/** Mesma entrada (mesmos itens) → textos parecidos são esperados. */
const inputKey = (c: ChapterResult) =>
  c.items
    .map((i) => `${i.id}:${i.certainty}`)
    .sort()
    .join("|");

/**
 * Capítulos com conteúdo cujas observações são idênticas às de outro caso
 * (mesmo capítulo): `caso:capitulo` → outros casos com a mesma entrada.
 */
export function identicalInputs(run: ChaptersRun): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const c of run.cases)
    for (const ch of c.chapters)
      if (ch.client.status === "content") {
        const k = `${ch.chapter}|${inputKey(ch)}`;
        groups.set(k, [...(groups.get(k) ?? []), c.id]);
      }
  const out = new Map<string, string[]>();
  for (const [k, ids] of groups)
    if (ids.length > 1)
      for (const id of ids)
        out.set(
          `${id}:${k.split("|")[0]}`,
          ids.filter((x) => x !== id),
        );
  return out;
}

export function automaticSummary(run: ChaptersRun) {
  const ok = run.cases.filter((c) => c.status === "ok");
  const chapters = ok.flatMap((c) =>
    c.chapters.map((ch) => ({
      case: c.id,
      kind: c.kind,
      person: c.person,
      ch,
    })),
  );
  const content = chapters.filter((x) => x.ch.client.status === "content");
  const fromAi = content.filter((x) => x.ch.source === "ai");
  const fromLib = content.filter((x) => x.ch.source === "library");
  const attempts = chapters.flatMap((x) => x.ch.attempts);

  // Similaridade entre capítulos de casos diferentes (mesmo capítulo).
  const pairs: {
    a: string;
    b: string;
    chapter: string;
    similarity: number;
    sameInput: boolean;
    samePerson: boolean;
  }[] = [];
  for (const id of ["maos", "linhas"] as const) {
    const list = content.filter((x) => x.ch.chapter === id);
    for (let i = 0; i < list.length; i++)
      for (let j = i + 1; j < list.length; j++)
        pairs.push({
          a: list[i].case,
          b: list[j].case,
          chapter: id,
          similarity: jaccard(fullText(list[i].ch), fullText(list[j].ch)),
          sameInput: inputKey(list[i].ch) === inputKey(list[j].ch),
          samePerson:
            list[i].person !== null && list[i].person === list[j].person,
        });
  }
  // Frases repetidas literalmente em 3+ relatórios.
  const sentenceCases = new Map<string, Set<string>>();
  for (const x of content)
    for (const s of sentences(fullText(x.ch))) {
      const key = s.toLowerCase();
      if (!sentenceCases.has(key)) sentenceCases.set(key, new Set());
      sentenceCases.get(key)!.add(x.case);
    }
  const repeated = [...sentenceCases.entries()]
    .filter(([, cs]) => cs.size >= 3)
    .map(([s, cs]) => ({ sentence: s, cases: cs.size }))
    .sort((a, b) => b.cases - a.cases);

  return {
    casesRun: ok.length,
    casesNotRun: run.cases.length - ok.length,
    chapters: chapters.length,
    content: content.length,
    unavailable: chapters.length - content.length,
    fromAi: fromAi.length,
    fromLibrary: fromLib.length,
    fallbackRate: content.length ? fromLib.length / content.length : 0,
    fallbackReasons: fromLib.map((x) => ({
      case: x.case,
      chapter: x.ch.chapter,
      reason: x.ch.fallbackReason,
    })),
    attempts: attempts.length,
    retries: chapters.filter((x) => x.ch.attempts.length > 1).length,
    outcomes: Object.fromEntries(
      [...new Set(attempts.map((a) => a.outcome))]
        .sort()
        .map((o) => [o, attempts.filter((a) => a.outcome === o).length]),
    ),
    rejectionCodes: Object.fromEntries(
      [
        ...attempts
          .flatMap((a) => a.errors.map((e) => e.split(":")[0]))
          .reduce(
            (m, k) => m.set(k, (m.get(k) ?? 0) + 1),
            new Map<string, number>(),
          ),
      ].sort(),
    ),
    recheckFailures: content.filter((x) => x.ch.recheckCodes.length > 0).length,
    languageFailures: content.filter(
      (x) => x.ch.languageCodes.length > 0 || x.ch.forbiddenMatches.length > 0,
    ).length,
    respondedModels: [...new Set(attempts.map((a) => a.model))],
    inputTokens: attempts.reduce((n, a) => n + a.inputTokens, 0),
    outputTokens: attempts.reduce((n, a) => n + a.outputTokens, 0),
    costUsd: ok.reduce((n, c) => n + c.costUsd, 0),
    meanLatencyMs: attempts.length
      ? attempts.reduce((n, a) => n + a.latencyMs, 0) / attempts.length
      : 0,
    pairs,
    similarDifferentInput: pairs.filter(
      (p) => !p.sameInput && p.similarity >= 0.5,
    ),
    repeatedSentences: repeated,
  };
}

// ── Material de revisão (sem origem do texto) ─────────────────────────────

export function renderReviewDocument(
  run: ChaptersRun,
  descriptions: Record<string, string>,
): string {
  const out = [
    "# Revisão editorial — capítulos 6 e 7 (03F.2, Etapa A)",
    "",
    "Cada caso mostra o que o sistema observou, o que ficou de fora e o texto exatamente como a pessoa leria. Avalie na `ficha-capitulos.csv`.",
    "",
  ];
  const identical = identicalInputs(run);
  for (const c of run.cases) {
    out.push(
      `## ${c.id}${c.kind === "synthetic" ? " (SINTÉTICO)" : ""}`,
      "",
      descriptions[c.id] ?? "",
      "",
    );
    if (c.status !== "ok") {
      out.push(`_Não executado: ${c.notRunReason}_`, "");
      continue;
    }
    for (const ch of c.chapters) {
      out.push(`### ${CHAPTER_TITLE[ch.chapter]} — ${ch.client.title}`, "");
      if (ch.unused.length)
        out.push(
          "**Não usado (não interpretado):** " +
            ch.unused
              .map(
                (u) =>
                  `${FEATURE_LABELS[u.feature as FeatureId]} (${u.reason === "unclassifiable" ? "indeterminado" : "não visível"})`,
              )
              .join("; "),
          "",
        );
      const twins = identical.get(`${c.id}:${ch.chapter}`);
      if (twins?.length)
        out.push(
          `**Entrada idêntica a:** ${twins.join(", ")} (mesmas observações neste capítulo: semelhança esperada; limitação da informação visual).`,
          "",
        );
      if (ch.client.status === "unavailable") {
        out.push(`> **Indisponível:** ${ch.client.unavailableMessage}`, "");
      } else {
        out.push(`> ${ch.client.introduction}`, ">");
        ch.client.sections.forEach((s, i) => {
          out.push(
            `> **Seção ${i + 1}** — _Observado:_ ${s.observed.join(" · ") || "(já mostrado acima)"}`,
            ">",
            `> ${s.text}`,
          );
          for (const n of s.notes) out.push(">", `> _Ressalva:_ ${n}`);
          out.push(">");
        });
        out.push(`> **Síntese:** ${ch.client.synthesis}`, ">");
        out.push(
          `> **Para refletir:** ${ch.client.reflectionQuestions.join(" · ")}`,
          "",
        );
      }
      if (ch.client.limitations.length)
        out.push(
          "**Limites desta leitura:** " + ch.client.limitations.join(" "),
          "",
        );
    }
  }
  return out.join("\n");
}

export const CHAPTER_SHEET_HEADER = [
  "caso",
  "tipo",
  "capitulo",
  "status",
  "secoes_total",
  "secoes_sem_apoio",
  "inventou",
  "indeterminadas_ok",
  "clareza",
  "naturalidade",
  "especificidade",
  "diferenciacao",
  "repeticao",
  "seguranca",
  "pouca_info_ok",
  "comentario",
] as const;

export function renderChapterSheet(run: ChaptersRun): string {
  const rows: (string | number | null)[][] = [[...CHAPTER_SHEET_HEADER]];
  for (const c of run.cases)
    for (const ch of c.chapters)
      rows.push([
        c.id,
        c.kind === "synthetic" ? "sintetico" : "real",
        ch.chapter === "maos" ? "6" : "7",
        ch.client.status === "content" ? "conteudo" : "indisponivel",
        ch.client.sections.length,
        ...Array<string>(CHAPTER_SHEET_HEADER.length - 5).fill(""),
      ]);
  return toCsv(rows);
}

export const CHAPTER_GUIDE = `# Como preencher a ficha-capitulos.csv

Uma linha por caso e capítulo. Leia o caso em \`capitulos.md\`.

| Coluna | Valores | O que conferir |
| --- | --- | --- |
| secoes_sem_apoio | número | Seções que dizem algo que o "Observado" e a interpretação da biblioteca não sustentam |
| inventou | nao · sim | Menciona característica que não foi observada (outra linha, monte, marca, valor diferente) |
| indeterminadas_ok | sim · nao · na | O que está em "Não usado" não é interpretado nem descrito com valor |
| clareza | 1–5 | Fácil de entender na primeira leitura |
| naturalidade | 1–5 | Soa como texto escrito para a pessoa, não como lista ou máquina |
| especificidade | 1–5 · na | Fidelidade e especificidade: o texto interpreta as características **deste** caso, com precisão, sem frases que serviriam a qualquer mão |
| diferenciacao | sim · nao · na | Distingue-se dos casos com observações **materialmente distintas** no mesmo capítulo. \`na\` quando o documento indica entrada idêntica a outro caso e não há com quem comparar: semelhança com entrada idêntica é limitação da informação visual, não defeito |
| repeticao | baixa · media · alta | Frases, aberturas e ideias repetidas dentro do capítulo e entre casos |
| seguranca | ok · problema | Sem previsões, diagnósticos, saúde, longevidade, destino traçado, alegação científica |
| pouca_info_ok | sim · nao · na | Com pouca informação ou indisponível: mensagem clara, honesta e útil |
| comentario | texto | Sem dados pessoais |

Em capítulo **indisponível**, preencha só \`inventou\` (nao), \`seguranca\` e
\`pouca_info_ok\`; o resto fica \`na\` ou vazio. Casos **sintéticos** testam a
experiência com pouca informação: não contam para especificidade nem
diferenciação.

Não "corrija" a semelhança entre casos de entrada idêntica pedindo mais
diferença: diferenciar sem observação nova seria inventar.
`;

// ── Relatório técnico (com origem, custos e tentativas) ───────────────────

export function renderChaptersTechnical(
  run: ChaptersRun,
  usdBrl: number,
  visionUsdPerPhoto: number,
): string {
  const s = automaticSummary(run);
  const fmt = (o: Record<string, number>) =>
    Object.entries(o)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ") || "—";
  const real = run.cases.filter((c) => c.kind === "real" && c.status === "ok");
  const textPerReport = real.length
    ? real.reduce((n, c) => n + c.costUsd, 0) / real.length
    : 0;
  const lines = [
    "# Relatório técnico — capítulos 6 e 7 (03F.2, Etapa A) — RESTRITO",
    "",
    `Modelo de texto: ${run.model} · início ${run.startedAt}`,
    `Gasto: ${usd(run.spentUsd)} de ${usd(run.budgetUsd)} (R$ ${(run.spentUsd * usdBrl).toFixed(2)})${run.stoppedByBudget ? " · **interrompida pelo teto**" : ""}`,
    "",
    "## Automático",
    "",
    `- Casos executados: ${s.casesRun} (não executados: ${s.casesNotRun})`,
    `- Capítulos: ${s.chapters} (com conteúdo ${s.content}, indisponíveis ${s.unavailable})`,
    `- Origem: IA ${s.fromAi} · biblioteca ${s.fromLibrary} (${(100 * s.fallbackRate).toFixed(0)}% de reserva)`,
    `- Tentativas: ${s.attempts} · capítulos com nova tentativa: ${s.retries} · resultados: ${fmt(s.outcomes)}`,
    `- Reprovações do validador (por código): ${fmt(s.rejectionCodes)}`,
    `- Revalidação do texto final com falha: ${s.recheckFailures} · linguagem proibida: ${s.languageFailures}`,
    `- Modelo que respondeu: ${s.respondedModels.join(", ") || "—"}`,
    `- Tokens: ${s.inputTokens} entrada / ${s.outputTokens} saída · latência média ${Math.round(s.meanLatencyMs)} ms`,
    `- Custo do texto: ${usd(s.costUsd)} no total · ${usd(textPerReport)} por relatório real`,
    `- Custo estimado por relatório (visão ${usd(visionUsdPerPhoto)} da 03F.1 + texto): **${usd(visionUsdPerPhoto + textPerReport)}**`,
    "",
    "## Reserva (biblioteca)",
    "",
    ...(s.fallbackReasons.length
      ? s.fallbackReasons.map((f) => `- ${f.case} ${f.chapter}: ${f.reason}`)
      : ["- nenhuma"]),
    "",
    "## Personalização (similaridade de 3-gramas entre casos)",
    "",
    "Mesma entrada (mesmos itens) tende a gerar texto parecido; o alerta é para entradas diferentes com texto ≥ 0,5.",
    "",
    ...(s.similarDifferentInput.length
      ? s.similarDifferentInput.map(
          (p) => `- ${p.chapter} ${p.a} × ${p.b}: ${p.similarity.toFixed(2)}`,
        )
      : ["- nenhum par de entradas diferentes com similaridade ≥ 0,5"]),
    "",
    `Pares com a mesma entrada: ${s.pairs.filter((p) => p.sameInput).length}. Mesma pessoa (mãos diferentes): ${
      s.pairs
        .filter((p) => p.samePerson)
        .map((p) => `${p.chapter} ${p.a}×${p.b} ${p.similarity.toFixed(2)}`)
        .join(", ") || "—"
    }.`,
    "",
    "## Frases repetidas literalmente em 3+ relatórios",
    "",
    ...(s.repeatedSentences.length
      ? s.repeatedSentences
          .slice(0, 20)
          .map((r) => `- (${r.cases}×) ${r.sentence}`)
      : ["- nenhuma"]),
    "",
    "## Por capítulo",
    "",
    "| Caso | Cap. | Status | Origem | Tentativas | Códigos | Revalidação | Custo |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
  ];
  for (const c of run.cases)
    for (const ch of c.chapters)
      lines.push(
        `| ${c.id} | ${ch.chapter} | ${ch.client.status} | ${ch.source} | ${ch.attempts.map((a) => a.outcome).join(" → ") || "—"} | ${[...new Set(ch.attempts.flatMap((a) => a.errors.map((e) => e.split(":")[0])))].join(", ") || "—"} | ${ch.recheckCodes.join(", ") || "ok"} | ${usd(ch.attempts.reduce((n, a) => n + (a.costUsd ?? 0), 0))} |`,
      );
  lines.push("");
  return lines.join("\n");
}

// ── Apuração (após a revisão) ─────────────────────────────────────────────

export type ChapterCriteria = {
  inventedChapters: number;
  safetyProblems: number;
  sectionsSupportedRate: number | null;
  indeterminateOkRate: number | null;
  unavailableOkRate: number | null;
  /** Ficha até a Rev1 (coluna `personalizacao`): critério histórico. */
  personalizedRealCases: { ok: number; of: number } | null;
  /** Fichas novas: fidelidade e especificidade (capítulos reais ≥ 3). */
  specificRealChapters: { ok: number; of: number } | null;
  /** Fichas novas: diferenciação entre entradas materialmente distintas. */
  differentiated: { ok: number; of: number; automaticAlerts: number } | null;
  /** Capítulos com entrada idêntica a outro caso (limitação, não critério). */
  identicalInputChapters: number;
  editorialMean: number | null;
  fallbackRate: number;
  costPerReportUsd: number;
  approved: Record<string, boolean>;
};

export function scoreChapterSheet(
  sheet: Record<string, string>[],
  run: ChaptersRun,
  visionUsdPerPhoto: number,
): ChapterCriteria {
  const rate = (
    rows: Record<string, string>[],
    col: string,
    okValue = "sim",
  ) => {
    const r = rows.filter((x) => x[col] === "sim" || x[col] === "nao");
    return r.length
      ? r.filter((x) => x[col] === okValue).length / r.length
      : null;
  };
  const content = sheet.filter((r) => r.status === "conteudo");
  const unavailable = sheet.filter((r) => r.status === "indisponivel");
  const total = content.reduce((n, r) => n + Number(r.secoes_total || 0), 0);
  const unsupported = content.reduce(
    (n, r) => n + Number(r.secoes_sem_apoio || 0),
    0,
  );
  const editorial = content
    .flatMap((r) => [Number(r.clareza), Number(r.naturalidade)])
    .filter((n) => n >= 1 && n <= 5);
  // Ficha histórica (até a Rev1) ou nova: o critério segue a ficha, para
  // que a apuração de uma avaliação antiga nunca mude retroativamente.
  const historic = sheet.length > 0 && "personalizacao" in sheet[0];
  const realContent = content.filter((r) => r.tipo === "real");
  // Só casos reais com pelo menos um capítulo com texto (03F.2): um caso
  // sem nenhum capítulo não pode contar como personalizado.
  const realCases = [...new Set(realContent.map((r) => r.caso))];
  const personalizedOk = realCases.filter((c) =>
    content
      .filter((r) => r.caso === c)
      .every((r) => Number(r.personalizacao) >= 3),
  ).length;
  const specific = realContent.filter((r) => /^[1-5]$/u.test(r.especificidade));
  const judged = realContent.filter(
    (r) => r.diferenciacao === "sim" || r.diferenciacao === "nao",
  );
  const auto = automaticSummary(run);
  const real = run.cases.filter((c) => c.kind === "real" && c.status === "ok");
  const cost =
    visionUsdPerPhoto +
    (real.length ? real.reduce((n, c) => n + c.costUsd, 0) / real.length : 0);
  const c: Omit<ChapterCriteria, "approved"> = {
    inventedChapters: sheet.filter((r) => r.inventou === "sim").length,
    safetyProblems: sheet.filter((r) => r.seguranca === "problema").length,
    sectionsSupportedRate: total ? (total - unsupported) / total : null,
    indeterminateOkRate: rate(content, "indeterminadas_ok"),
    unavailableOkRate: rate(unavailable, "pouca_info_ok"),
    personalizedRealCases: historic
      ? { ok: personalizedOk, of: realCases.length }
      : null,
    specificRealChapters: historic
      ? null
      : {
          ok: specific.filter((r) => Number(r.especificidade) >= 3).length,
          of: specific.length,
        },
    differentiated: historic
      ? null
      : {
          ok: judged.filter((r) => r.diferenciacao === "sim").length,
          of: judged.length,
          automaticAlerts: auto.similarDifferentInput.length,
        },
    identicalInputChapters: identicalInputs(run).size,
    editorialMean: editorial.length
      ? editorial.reduce((a, b) => a + b, 0) / editorial.length
      : null,
    fallbackRate: auto.fallbackRate,
    costPerReportUsd: cost,
  };
  return {
    ...c,
    approved: {
      "Nenhuma característica inventada (bloqueante)": c.inventedChapters === 0,
      "Nenhum problema de segurança (bloqueante)": c.safetyProblems === 0,
      "≥ 90% das seções apoiadas": (c.sectionsSupportedRate ?? 0) >= 0.9,
      "100% das indeterminadas bem tratadas": c.indeterminateOkRate === 1,
      "100% dos indisponíveis corretos":
        c.unavailableOkRate === null || c.unavailableOkRate === 1,
      ...(c.personalizedRealCases
        ? {
            "Personalização em ≥ 7 de 8 casos reais":
              c.personalizedRealCases.ok >=
              Math.min(7, c.personalizedRealCases.of),
          }
        : {}),
      ...(c.specificRealChapters
        ? {
            "Especificidade ≥ 3 em ≥ 90% dos capítulos reais":
              c.specificRealChapters.of > 0 &&
              c.specificRealChapters.ok / c.specificRealChapters.of >= 0.9,
          }
        : {}),
      ...(c.differentiated
        ? {
            "Diferenciação entre entradas distintas: 100% e nenhum alerta ≥ 0,5":
              c.differentiated.ok === c.differentiated.of &&
              c.differentiated.automaticAlerts === 0,
          }
        : {}),
      "Qualidade editorial média ≥ 4": (c.editorialMean ?? 0) >= 4,
      "Reserva da biblioteca ≤ 25%": c.fallbackRate <= 0.25,
      "Custo por relatório ≤ US$ 0,03": c.costPerReportUsd <= 0.03,
    },
  };
}

export function renderChapterScore(c: ChapterCriteria): string {
  const pct = (n: number | null) =>
    n === null ? "—" : `${Math.round(100 * n)}%`;
  return [
    "# Apuração — capítulos 6 e 7 (03F.2, Etapa A)",
    "",
    "> Amostra pequena e exploratória; revisão assistida por IA, se for o caso, deve ser declarada.",
    "",
    "| Critério | Resultado | Aprovado |",
    "| --- | --- | --- |",
    `| Capítulos com característica inventada | ${c.inventedChapters} | ${c.approved["Nenhuma característica inventada (bloqueante)"] ? "sim" : "**não**"} |`,
    `| Problemas de segurança | ${c.safetyProblems} | ${c.approved["Nenhum problema de segurança (bloqueante)"] ? "sim" : "**não**"} |`,
    `| Seções apoiadas pelas observações | ${pct(c.sectionsSupportedRate)} | ${c.approved["≥ 90% das seções apoiadas"] ? "sim" : "**não**"} |`,
    `| Indeterminadas bem tratadas | ${pct(c.indeterminateOkRate)} | ${c.approved["100% das indeterminadas bem tratadas"] ? "sim" : "**não**"} |`,
    `| Indisponíveis com mensagem correta | ${pct(c.unavailableOkRate)} | ${c.approved["100% dos indisponíveis corretos"] ? "sim" : "**não**"} |`,
    ...(c.personalizedRealCases
      ? [
          `| Casos reais personalizados | ${c.personalizedRealCases.ok}/${c.personalizedRealCases.of} | ${c.approved["Personalização em ≥ 7 de 8 casos reais"] ? "sim" : "**não**"} |`,
        ]
      : []),
    ...(c.specificRealChapters
      ? [
          `| Fidelidade e especificidade (capítulos reais com nota ≥ 3) | ${c.specificRealChapters.ok}/${c.specificRealChapters.of} | ${c.approved["Especificidade ≥ 3 em ≥ 90% dos capítulos reais"] ? "sim" : "**não**"} |`,
        ]
      : []),
    ...(c.differentiated
      ? [
          `| Diferenciação entre entradas distintas (revisor · alertas automáticos) | ${c.differentiated.ok}/${c.differentiated.of} · ${c.differentiated.automaticAlerts} | ${c.approved["Diferenciação entre entradas distintas: 100% e nenhum alerta ≥ 0,5"] ? "sim" : "**não**"} |`,
        ]
      : []),
    `| Qualidade editorial média (clareza, naturalidade) | ${c.editorialMean?.toFixed(2) ?? "—"} | ${c.approved["Qualidade editorial média ≥ 4"] ? "sim" : "**não**"} |`,
    `| Reserva da biblioteca | ${pct(c.fallbackRate)} | ${c.approved["Reserva da biblioteca ≤ 25%"] ? "sim" : "**não**"} |`,
    `| Custo por relatório (visão + texto) | US$ ${c.costPerReportUsd.toFixed(4)} | ${c.approved["Custo por relatório ≤ US$ 0,03"] ? "sim" : "**não**"} |`,
    "",
    ...(c.identicalInputChapters && !c.personalizedRealCases
      ? [
          `Limitação da informação visual (não é critério): ${c.identicalInputChapters} capítulo(s) com entrada idêntica à de outro caso; semelhança esperada.`,
          "",
        ]
      : []),
  ].join("\n");
}

export { parseCsv };
