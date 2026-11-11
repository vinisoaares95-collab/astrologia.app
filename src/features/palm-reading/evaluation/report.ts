/**
 * Relatórios da avaliação visual (Fase 03F.1).
 *
 * Duas pastas, para não contaminar a revisão humana:
 * - revisao/ (cega): referência do revisor, ficha com as observações dos
 *   "observadores A e B" (ordem sorteada por foto) e o guia;
 * - restrito/: chave A/B → modelo, resultados técnicos (custo, tokens,
 *   latência, tentativas, códigos do validador) e o relatório técnico.
 *
 * Passar no validador NÃO é acerto: o relatório técnico mede formato e
 * consistência; a exatidão visual vem da revisão humana (apuração).
 * Nada aqui contém imagem, nome de arquivo, caminho ou credencial.
 */
import { FEATURE_IDS, type FeatureId } from "../analysis/contract";
import { FEATURE_LABELS } from "../analysis/library";
import type { EvalPlan } from "./estimate";
import type { EvalRun, FeatureResult, UnitResult } from "./run";

// ── CSV mínimo (RFC 4180) ─────────────────────────────────────────────────

const cell = (v: string | number | null | undefined) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/u.test(s) ? `"${s.replace(/"/gu, '""')}"` : s;
};
export const toCsv = (rows: (string | number | null)[][]) =>
  rows.map((r) => r.map(cell).join(",")).join("\n") + "\n";

export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...body] = rows.filter((r) => r.some((x) => x.trim() !== ""));
  if (!header) return [];
  return body.map((r) =>
    Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? "").trim()])),
  );
}

// ── Chave cega ─────────────────────────────────────────────────────────────

export type BlindKey = {
  /** foto → { A: modelo, B: modelo } */
  photos: Record<string, { A: string; B: string }>;
};

export function blindKey(run: EvalRun, coin: () => boolean): BlindKey {
  const [m1, m2] = run.models;
  const photos: BlindKey["photos"] = {};
  for (const id of [...new Set(run.units.map((u) => u.photoId))])
    photos[id] = coin() ? { A: m1, B: m2 } : { A: m2, B: m1 };
  return { photos };
}

const unitOf = (run: EvalRun, photoId: string, model: string) =>
  run.units.find((u) => u.photoId === photoId && u.model === model);

const visLabel = (
  f: FeatureResult | undefined,
  unit: UnitResult | undefined,
) =>
  !unit || unit.status !== "ok"
    ? "sem_resultado"
    : f!.visibility === "not_visible"
      ? "nao_visivel"
      : f!.visibility === "clear"
        ? "nitida"
        : "parcial";

// ── Revisão humana (cega) ─────────────────────────────────────────────────

export const REFERENCE_HEADER = [
  "foto",
  "caracteristica_id",
  "caracteristica",
  "opcoes_de_valor",
  "revisor_visibilidade",
  "revisor_valor",
] as const;

/** Leitura de referência do revisor, preenchida ANTES de abrir a ficha. */
export function renderReferenceCsv(
  run: EvalRun,
  values: Record<FeatureId, readonly string[]>,
): string {
  const photos = [...new Set(run.units.map((u) => u.photoId))];
  const rows: (string | null)[][] = [[...REFERENCE_HEADER]];
  for (const p of photos)
    for (const id of FEATURE_IDS)
      rows.push([p, id, FEATURE_LABELS[id], values[id].join(" | "), "", ""]);
  return toCsv(rows);
}

export const SHEET_HEADER = [
  "foto",
  "caracteristica_id",
  "caracteristica",
  "A_visibilidade",
  "A_valor",
  "A_evidencia",
  "A_evidencia_confere",
  "B_visibilidade",
  "B_valor",
  "B_evidencia",
  "B_evidencia_confere",
  "comentario",
] as const;

/** Ficha com as observações dos dois observadores, sem nome de modelo. */
export function renderReviewSheet(run: EvalRun, key: BlindKey): string {
  const rows: (string | null)[][] = [[...SHEET_HEADER]];
  for (const [photoId, ab] of Object.entries(key.photos)) {
    const a = unitOf(run, photoId, ab.A);
    const b = unitOf(run, photoId, ab.B);
    for (const id of FEATURE_IDS) {
      const fa = a?.final?.features[id];
      const fb = b?.final?.features[id];
      rows.push([
        photoId,
        id,
        FEATURE_LABELS[id],
        visLabel(fa, a),
        fa?.value ?? "",
        fa?.evidence ?? "",
        "",
        visLabel(fb, b),
        fb?.value ?? "",
        fb?.evidence ?? "",
        "",
        "",
      ]);
    }
  }
  return toCsv(rows);
}

export function renderReviewGuide(
  key: BlindKey,
  values: Record<FeatureId, readonly string[]>,
): string {
  const photos = Object.keys(key.photos);
  return `# Revisão humana — avaliação visual 03F

Fotos: ${photos.join(", ")}. Os observadores A e B são os dois modelos,
sorteados **por foto** (o A de uma foto não é necessariamente o A de outra).
Não abra a pasta \`restrito/\` antes de terminar.

## Passo 1 — sua leitura de referência (\`referencia.csv\`)

Antes de abrir a ficha, olhe cada foto (o arquivo correspondente a cada
identificador está em \`mapa-fotos.json\`, na pasta das fotos, fora do
repositório) e preencha, para cada característica:

- \`revisor_visibilidade\`: \`nitida\`, \`parcial\` ou \`nao_visivel\`
  (na dúvida, \`nao_visivel\` — mesmo critério pedido aos modelos);
- \`revisor_valor\`: um dos valores da coluna \`opcoes_de_valor\` (vazio se
  não visível).

## Passo 2 — conferir as evidências (\`ficha.csv\`)

Para cada observação **visível** de A e de B, preencha
\`A_evidencia_confere\` / \`B_evidencia_confere\` com:

- \`sim\`: a descrição corresponde ao que aparece na foto;
- \`parcial\`: corresponde em parte (local certo, detalhe errado);
- \`nao\`: não corresponde (linha inexistente, local errado, inventado).

Deixe vazio quando o observador marcou \`nao_visivel\` ou \`sem_resultado\`.

## Regras

- Não escreva nomes, rostos, tatuagens, joias, cor de pele, idade ou
  qualquer dado pessoal no \`comentario\`.
- Não copie as fotos para outro lugar nem as anexe a relatórios.
- Passar no validador não significa acerto: é a sua leitura que mede a
  exatidão.

## Critérios definidos (provisórios, 03C)

${FEATURE_IDS.map((id) => `- **${FEATURE_LABELS[id]}** (\`${id}\`): ${values[id].join(", ")}`).join("\n")}
`;
}

// ── Relatório técnico (restrito) ──────────────────────────────────────────

const usd = (n: number) => `US$ ${n.toFixed(4)}`;
const brl = (n: number) => `R$ ${n.toFixed(2)}`;
const mean = (xs: number[]) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;

export function modelSummary(run: EvalRun, model: string) {
  const units = run.units.filter((u) => u.model === model);
  const ran = units.filter((u) => u.status !== "not_run");
  const ok = ran.filter((u) => u.status === "ok");
  const calls = ran.flatMap((u) => u.calls);
  const features = ok.flatMap((u) => Object.values(u.final!.features));
  const codeCount = (pick: (c: (typeof calls)[number]) => boolean) => {
    const m = new Map<string, number>();
    for (const c of calls.filter(pick))
      for (const n of c.notes) m.set(n.code, (m.get(n.code) ?? 0) + 1);
    return Object.fromEntries([...m].sort());
  };
  return {
    model,
    units: units.length,
    ran: ran.length,
    ok: ok.length,
    failed: ran.length - ok.length,
    notRun: units.length - ran.length,
    retried: ran.filter((u) => u.retried).length,
    calls: calls.length,
    respondedModels: [
      ...new Set(calls.map((c) => c.respondedModel).filter(Boolean)),
    ] as string[],
    outcomes: Object.fromEntries(
      [...new Set(calls.map((c) => c.outcome))]
        .sort()
        .map((o) => [o, calls.filter((c) => c.outcome === o).length]),
    ),
    rejectionCodes: codeCount((c) => c.outcome === "rejected"),
    downgradeCodes: codeCount((c) => c.outcome === "ok"),
    identified: features.filter((f) => f.visibility !== "not_visible").length,
    partial: features.filter((f) => f.visibility === "partial").length,
    notVisible: features.filter((f) => f.visibility === "not_visible").length,
    downgraded: features.filter((f) => f.downgradedBy).length,
    inputTokens: calls.reduce((n, c) => n + (c.usage?.inputTokens ?? 0), 0),
    outputTokens: calls.reduce((n, c) => n + (c.usage?.outputTokens ?? 0), 0),
    costUsd: ran.reduce((n, u) => n + u.costUsd, 0),
    meanLatencyMs: mean(calls.map((c) => c.latencyMs)),
    maxLatencyMs: Math.max(0, ...calls.map((c) => c.latencyMs)),
  };
}

/** Concordância entre os modelos (NÃO é exatidão). */
export function agreement(run: EvalRun) {
  const [m1, m2] = run.models;
  let both = 0;
  let same = 0;
  let bothHidden = 0;
  let visibilityOnly = 0;
  let valueDiff = 0;
  const photos = [...new Set(run.units.map((u) => u.photoId))];
  for (const p of photos) {
    const a = unitOf(run, p, m1)?.final;
    const b = unitOf(run, p, m2)?.final;
    if (!a || !b) continue;
    for (const id of FEATURE_IDS) {
      both++;
      const fa = a.features[id];
      const fb = b.features[id];
      const va = fa.visibility !== "not_visible";
      const vb = fb.visibility !== "not_visible";
      if (!va && !vb) {
        bothHidden++;
        same++;
      } else if (va !== vb) visibilityOnly++;
      else if (fa.value === fb.value) same++;
      else valueDiff++;
    }
  }
  return { compared: both, same, bothHidden, visibilityOnly, valueDiff };
}

export function renderPlan(plan: EvalPlan): string {
  const lines = [
    "# Plano financeiro — avaliação visual 03F",
    "",
    `Fotos: ${plan.photos} · tentativas por foto e modelo: ${plan.maxAttempts} · câmbio: R$ ${plan.usdBrl.toFixed(2)}`,
    `Orçamento: ${brl(plan.budgetBrl)} (${usd(plan.budgetUsd)}) · teto da execução: ${usd(plan.safeCapUsd)}`,
    "",
    "| Modelo | Esperado por foto | Pior caso por chamada | Pior caso por foto | Esperado total | Pior caso total |",
    "| --- | --- | --- | --- | --- | --- |",
    ...plan.perModel.map(
      (m) =>
        `| ${m.model} | ${usd(m.expectedPerPhotoUsd)} | ${usd(m.worstPerCallUsd)} | ${usd(m.worstPerUnitUsd)} | ${usd(m.expectedUsd)} | ${usd(m.worstUsd)} |`,
    ),
    `| **Total** | | | | **${usd(plan.expectedUsd)} (${brl(plan.expectedBrl)})** | **${usd(plan.worstUsd)} (${brl(plan.worstBrl)})** |`,
    "",
    plan.withinBudget
      ? `Cabe no orçamento no pior caso. Fotos que caberiam: ${plan.photosWithinBudget}.`
      : `NÃO cabe no orçamento no pior caso: cabem ${plan.photosWithinBudget} fotos. Reduza a amostra ou use 1 tentativa.`,
    "",
  ];
  return lines.join("\n");
}

export function renderTechnicalReport(
  run: EvalRun,
  plan: EvalPlan,
  key: BlindKey,
): string {
  const summaries = run.models.map((m) => modelSummary(run, m));
  const ag = agreement(run);
  const fmt = (o: Record<string, number>) =>
    Object.keys(o).length
      ? Object.entries(o)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ")
      : "—";
  const out: string[] = [
    "# Relatório técnico — avaliação visual 03F (RESTRITO)",
    "",
    "> Passar no validador mede formato e consistência, **não exatidão**.",
    "> Nenhum modelo é declarado melhor por este relatório: a exatidão vem",
    "> da revisão humana (`apuracao.md`).",
    "",
    `Início: ${run.startedAt} · tentativas permitidas: ${run.maxAttempts}`,
    `Gasto: ${usd(run.spentUsd)} de ${usd(run.budgetUsd)} (${brl(run.spentUsd * plan.usdBrl)})${run.stoppedByBudget ? " · **interrompida pelo teto**" : ""}`,
    `Previsto: esperado ${usd(plan.expectedUsd)}, pior caso ${usd(plan.worstUsd)}`,
    "",
    "## Por modelo",
    "",
    "| | " + summaries.map((s) => s.model).join(" | ") + " |",
    "| --- | " + summaries.map(() => "---").join(" | ") + " |",
    ...(
      [
        ["Fotos executadas", (s) => `${s.ran}/${s.units}`],
        ["Observação aceita", (s) => s.ok],
        ["Sem observação aceita", (s) => s.failed],
        ["Não executadas (teto)", (s) => s.notRun],
        ["Precisaram de nova tentativa", (s) => s.retried],
        ["Chamadas", (s) => s.calls],
        ["Modelo que respondeu", (s) => s.respondedModels.join(", ") || "—"],
        ["Resultados por chamada", (s) => fmt(s.outcomes)],
        ["Reprovações do validador", (s) => fmt(s.rejectionCodes)],
        ["Rebaixamentos do validador", (s) => fmt(s.downgradeCodes)],
        ["Características identificadas", (s) => s.identified],
        ["… parcialmente visíveis", (s) => s.partial],
        ["Não visíveis", (s) => s.notVisible],
        ["Rebaixadas a não visível", (s) => s.downgraded],
        ["Tokens de entrada", (s) => s.inputTokens],
        ["Tokens de saída", (s) => s.outputTokens],
        ["Custo", (s) => usd(s.costUsd)],
        ["Latência média", (s) => `${Math.round(s.meanLatencyMs)} ms`],
        ["Latência máxima", (s) => `${Math.round(s.maxLatencyMs)} ms`],
      ] as [string, (s: (typeof summaries)[number]) => string | number][]
    ).map(([label, f]) => `| ${label} | ${summaries.map(f).join(" | ")} |`),
    "",
    "## Concordância entre os modelos (não é exatidão)",
    "",
    `Características comparadas: ${ag.compared} · iguais: ${ag.same} (ambas não visíveis: ${ag.bothHidden}) · divergência de visibilidade: ${ag.visibilityOnly} · valores diferentes: ${ag.valueDiff}`,
    "",
    "## Por chamada",
    "",
    "| Foto | Modelo | Tentativa | Resultado | Modelo que respondeu | Tokens (entrada/saída) | Custo | Latência | Códigos |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
  ];
  for (const u of run.units) {
    if (u.status === "not_run") {
      out.push(
        `| ${u.photoId} | ${u.model} | — | não executada | — | — | — | — | ${u.notRunReason} |`,
      );
      continue;
    }
    for (const c of u.calls)
      out.push(
        `| ${u.photoId} | ${u.model} | ${c.attempt} | ${c.outcome} | ${c.respondedModel ?? "—"} | ${c.usage ? `${c.usage.inputTokens}/${c.usage.outputTokens}` : "—"} | ${c.costUsd === null ? "—" : usd(c.costUsd)} | ${Math.round(c.latencyMs)} ms | ${c.notes.map((n) => (n.feature ? `${n.code}(${n.feature})` : n.code)).join(", ") || "—"} |`,
      );
  }
  out.push(
    "",
    "## Resultado final por foto",
    "",
    "| Foto | Característica | " + run.models.join(" | ") + " |",
    "| --- | --- | " + run.models.map(() => "---").join(" | ") + " |",
  );
  for (const p of Object.keys(key.photos))
    for (const id of FEATURE_IDS)
      out.push(
        `| ${p} | ${id} | ${run.models
          .map((m) => {
            const u = unitOf(run, p, m);
            const f = u?.final?.features[id];
            if (!u || !f) return u?.status ?? "—";
            return f.visibility === "not_visible"
              ? `não visível${f.downgradedBy ? ` (rebaixada: ${f.downgradedBy})` : ""}`
              : `${f.value} (${f.visibility})`;
          })
          .join(" | ")} |`,
      );
  out.push("");
  return out.join("\n");
}

// ── Apuração (após a revisão) ─────────────────────────────────────────────

const VIS = new Set(["nitida", "parcial"]);

export type ModelScore = {
  model: string;
  /** Características em que o revisor via algo e o modelo também. */
  visibleBoth: number;
  /** …e o valor coincidiu com o do revisor. */
  correctValue: number;
  /** Modelo afirmou visível, revisor não via com segurança. */
  falseVisible: number;
  /** Revisor via com nitidez, modelo marcou não visível. */
  missedClear: number;
  /** Modelo marcou não visível e o revisor não via com nitidez. */
  bothHidden: number;
  evidence: { sim: number; parcial: number; nao: number };
  /** Linhas sem preenchimento do revisor (excluídas). */
  unreviewed: number;
};

export function scoreReview(input: {
  reference: Record<string, string>[];
  sheet: Record<string, string>[];
  key: BlindKey;
}): ModelScore[] {
  const ref = new Map(
    input.reference.map((r) => [`${r.foto}|${r.caracteristica_id}`, r]),
  );
  const models = [
    ...new Set(Object.values(input.key.photos).flatMap((x) => [x.A, x.B])),
  ].sort();
  const scores = new Map<string, ModelScore>(
    models.map((m) => [
      m,
      {
        model: m,
        visibleBoth: 0,
        correctValue: 0,
        falseVisible: 0,
        missedClear: 0,
        bothHidden: 0,
        evidence: { sim: 0, parcial: 0, nao: 0 },
        unreviewed: 0,
      },
    ]),
  );
  for (const row of input.sheet) {
    const ab = input.key.photos[row.foto];
    const r = ref.get(`${row.foto}|${row.caracteristica_id}`);
    if (!ab) continue;
    for (const side of ["A", "B"] as const) {
      const s = scores.get(ab[side])!;
      const vis = row[`${side}_visibilidade`];
      if (vis === "sem_resultado") continue;
      const rv = r?.revisor_visibilidade ?? "";
      if (!rv) {
        s.unreviewed++;
        continue;
      }
      const modelSees = VIS.has(vis);
      const reviewerSees = VIS.has(rv);
      if (modelSees && reviewerSees) {
        s.visibleBoth++;
        if (row[`${side}_valor`] === r!.revisor_valor) s.correctValue++;
      } else if (modelSees) s.falseVisible++;
      else if (rv === "nitida") s.missedClear++;
      else s.bothHidden++;
      const ev = row[`${side}_evidencia_confere`] as "sim" | "parcial" | "nao";
      if (modelSees && ev in s.evidence) s.evidence[ev]++;
    }
  }
  return [...scores.values()];
}

export function renderScore(scores: ModelScore[]): string {
  const pct = (a: number, b: number) =>
    b ? `${Math.round((100 * a) / b)}% (${a}/${b})` : "—";
  return [
    "# Apuração da revisão humana — avaliação visual 03F",
    "",
    "> Referência: a leitura do revisor. Amostra pequena (≤ 8 fotos): use os",
    "> números para orientar a decisão, não como medida estatística.",
    "",
    "| | " + scores.map((s) => s.model).join(" | ") + " |",
    "| --- | " + scores.map(() => "---").join(" | ") + " |",
    `| Valor correto quando ambos veem | ${scores.map((s) => pct(s.correctValue, s.visibleBoth)).join(" | ")} |`,
    `| Afirmou visível sem estar (falso visível) | ${scores.map((s) => s.falseVisible).join(" | ")} |`,
    `| Deixou de ver o que estava nítido | ${scores.map((s) => s.missedClear).join(" | ")} |`,
    `| Marcou não visível e na foto não estava nítido | ${scores.map((s) => s.bothHidden).join(" | ")} |`,
    `| Evidência confere (sim / parcial / não) | ${scores.map((s) => `${s.evidence.sim} / ${s.evidence.parcial} / ${s.evidence.nao}`).join(" | ")} |`,
    `| Linhas sem revisão | ${scores.map((s) => s.unreviewed).join(" | ")} |`,
    "",
    "Falso visível é o erro mais grave para o produto (vira interpretação de",
    "algo que não existe); deixar de ver só reduz a leitura.",
    "",
  ].join("\n");
}
