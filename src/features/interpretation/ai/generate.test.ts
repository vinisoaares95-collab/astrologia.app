// @vitest-environment node
import Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";

import type { ChapterId, InterpretationReport } from "../contract";
import { buildInterpretation } from "../engine";
import { TEST_TIMES, testChart } from "../test-support";
import { createAnthropicProvider, toProviderError } from "./anthropic-provider";
import { readAiConfig } from "./config";
import { AiProviderError, type GeneratedReport } from "./contract";
import { generateReport, libraryReport } from "./generate";
import { libraryDraft } from "./library-chapter";
import { createMockProvider } from "./mock-provider";
import { estimateCostUsd, MODEL_PRICES } from "./pricing";
import { buildChapterRequest, chapterSchema, SYSTEM_PROMPT } from "./prompt";
import { validateChapterDraft } from "./validate";

const charts = {
  exact: testChart(TEST_TIMES.exact),
  approximate: testChart(TEST_TIMES.approximate),
  unknown: testChart(TEST_TIMES.unknown),
};
const reports = {
  exact: buildInterpretation(charts.exact),
  approximate: buildInterpretation(charts.approximate),
  unknown: buildInterpretation(charts.unknown),
};
const cases = Object.keys(reports) as (keyof typeof reports)[];

const chapterOf = (r: InterpretationReport, id: ChapterId) =>
  r.chapters.find((c) => c.id === id)!;
/** Relógio determinístico: cada leitura avança 100 ms. */
const fakeClock = () => {
  let t = 0;
  return () => (t += 100);
};

function codesFor(
  report: InterpretationReport,
  id: ChapterId,
  patch: (d: ReturnType<typeof libraryDraft>) => void,
) {
  const draft = libraryDraft(report, id);
  patch(draft);
  return validateChapterDraft(draft, chapterOf(report, id), report).errors.map(
    (e) => e.code,
  );
}

const message = (
  overrides: Partial<Anthropic.Beta.Messages.BetaMessage> = {},
) =>
  ({
    model: "claude-sonnet-5-5",
    stop_reason: "end_turn",
    content: [{ type: "text", text: '{"ok":true}' }],
    usage: {
      input_tokens: 1200,
      output_tokens: 800,
      cache_read_input_tokens: 900,
      cache_creation_input_tokens: 0,
    },
    ...overrides,
  }) as unknown as Anthropic.Beta.Messages.BetaMessage;

describe("dados enviados ao modelo", () => {
  it.each(cases)(
    "não contêm dados de nascimento nem pessoais (%s)",
    async (c) => {
      const provider = createMockProvider();
      await generateReport(reports[c], provider);
      const chart = charts[c];
      const forbidden = [
        "12/05/1990",
        "1990-05-12",
        "1990",
        "São Paulo",
        "Sao_Paulo",
        "-23.55",
        "-46.63",
        "14:30",
        "17:30",
        String(chart.parameters.julianDayUt).slice(0, 7),
        "birth",
        "nome",
        "e-mail",
      ];
      expect(provider.calls).toHaveLength(5);
      for (const call of provider.calls)
        for (const term of forbidden)
          expect(call.system + call.user, term).not.toContain(term);
    },
  );

  it("o system prompt é idêntico em todas as chamadas (cacheável)", async () => {
    const provider = createMockProvider();
    await generateReport(reports.exact, provider);
    expect(new Set(provider.calls.map((c) => c.system))).toEqual(
      new Set([SYSTEM_PROMPT]),
    );
  });

  it("o schema usa só recursos aceitos pela saída estruturada", () => {
    const json = JSON.stringify(chapterSchema(["a", "b"]));
    for (const unsupported of [
      "minLength",
      "maxLength",
      "maxItems",
      "minimum",
      "maximum",
      "pattern",
    ])
      expect(json).not.toContain(unsupported);
    expect(json.match(/"minItems":(\d+)/g)).toEqual([
      '"minItems":1',
      '"minItems":1',
      '"minItems":1',
    ]);
  });

  it("restringe os itemIds aos itens do próprio capítulo", () => {
    const req = buildChapterRequest(reports.exact, "mente", {
      maxOutputTokens: 1000,
      timeoutMs: 1000,
    });
    const ids = chapterOf(reports.exact, "mente").items.map((i) => i.id);
    expect(JSON.stringify(req.schema)).toContain(JSON.stringify(ids));
  });
});

describe("geração com respostas simuladas", () => {
  it.each(cases)(
    "resposta válida vira capítulo de IA rastreável (%s)",
    async (c) => {
      const report = reports[c];
      const out = await generateReport(report, createMockProvider(), {
        now: fakeClock(),
      });
      expect(out.chapters.map((ch) => ch.source)).toEqual(Array(5).fill("ai"));
      for (const ch of out.chapters) {
        const src = chapterOf(report, ch.id);
        expect(ch.title).toBe(src.title);
        expect(ch.limitations).toEqual(src.limitations);
        const facts = new Set(src.items.flatMap((i) => i.factIds));
        for (const s of ch.sections) {
          expect(s.itemIds.length).toBeGreaterThan(0);
          for (const f of s.factIds) expect(facts.has(f)).toBe(true);
        }
      }
      expect(out.metrics.totals).toMatchObject({
        calls: 5,
        retries: 0,
        failures: 0,
        chaptersFromAi: 5,
        chaptersFromLibrary: 0,
        costUsd: 0,
      });
      expect(out.metrics.totals.inputTokens).toBeGreaterThan(0);
    },
  );

  it("posição inventada → nova tentativa com correções → biblioteca", async () => {
    const provider = createMockProvider(["invented-position"]);
    const out = await generateReport(reports.exact, provider);
    for (const ch of out.chapters) {
      expect(ch.source).toBe("library");
      expect(ch.fallbackReason).toMatch(/UNSUPPORTED_POSITION/);
    }
    expect(out.metrics.totals.calls).toBe(10);
    expect(out.metrics.totals.retries).toBe(5);
    const retry = provider.calls.filter((c) => c.user.includes("reprovada"));
    expect(retry).toHaveLength(5);
    expect(retry[0].user).toMatch(/Sol em Leão/);
  });

  it("sucesso na segunda tentativa conta como nova tentativa", async () => {
    const out = await generateReport(
      reports.exact,
      createMockProvider(["forbidden-language", "valid"]),
    );
    expect(out.chapters.every((c) => c.source === "ai")).toBe(true);
    expect(out.metrics.totals).toMatchObject({
      calls: 10,
      retries: 5,
      failures: 5,
    });
    expect(
      out.metrics.attempts.filter((a) => a.outcome === "validation_failed"),
    ).toHaveLength(5);
  });

  it.each([
    ["invalid-json", "invalid_json", /JSON/],
    ["truncated", "truncated", /incompleta/],
    ["refusal", "refusal", /recusou/],
    ["missing-item", "validation_failed", /MISSING_ITEM/],
  ] as const)(
    "%s → biblioteca, sem entregar resposta inválida",
    async (scenario, outcome, reason) => {
      const out = await generateReport(
        reports.exact,
        createMockProvider([scenario]),
      );
      expect(out.metrics.attempts[0].outcome).toBe(outcome);
      for (const ch of out.chapters) {
        expect(ch.source).toBe("library");
        expect(ch.fallbackReason).toMatch(reason);
        expect(
          validateChapterDraft(
            {
              ...ch,
              sections: ch.sections.map((s) => ({
                text: s.text,
                itemIds: s.itemIds,
              })),
            },
            chapterOf(reports.exact, ch.id),
            reports.exact,
          ).ok,
        ).toBe(true);
      }
    },
  );

  it("API indisponível: tenta de novo uma vez e cai na biblioteca", async () => {
    const out = await generateReport(
      reports.exact,
      createMockProvider(["error:unavailable"]),
    );
    expect(out.metrics.totals.calls).toBe(10);
    expect(out.chapters.every((c) => c.source === "library")).toBe(true);
    expect(out.chapters[0].fallbackReason).toMatch(/unavailable/);
  });

  it("credencial inválida não gera nova tentativa", async () => {
    const out = await generateReport(
      reports.exact,
      createMockProvider(["error:auth"]),
    );
    expect(out.metrics.totals.calls).toBe(5);
    expect(out.metrics.totals.retries).toBe(0);
  });

  it("o número de tentativas é limitado (máximo 3)", async () => {
    const out = await generateReport(
      reports.exact,
      createMockProvider(["error:timeout"]),
      { maxAttempts: 50 },
    );
    expect(out.metrics.totals.calls).toBe(15);
  });

  it("capítulos independentes: falha em um não descarta os outros", async () => {
    const out = await generateReport(
      reports.exact,
      createMockProvider((req) =>
        req.user.includes('"id": "mente"') ? "invented-position" : "valid",
      ),
    );
    expect(out.chapters.map((c) => `${c.id}:${c.source}`)).toEqual([
      "identidade:ai",
      "emocional:ai",
      "mente:library",
      "relacionamentos:ai",
      "talentos:ai",
    ]);
  });
});

describe("validador de capítulo (02F)", () => {
  const r = reports.exact;

  it.each(cases)("a versão da biblioteca é sempre válida (%s)", (c) => {
    for (const ch of reports[c].chapters)
      expect(
        validateChapterDraft(libraryDraft(reports[c], ch.id), ch, reports[c])
          .errors,
      ).toEqual([]);
  });

  it("recusa signos parafraseados e citados sem origem", () => {
    expect(
      codesFor(r, "identidade", (d) => {
        d.introduction = "Seu jeito leonino aparece logo.";
      }),
    ).toEqual(["UNSUPPORTED_SIGN"]);
    expect(
      codesFor(r, "identidade", (d) => {
        d.introduction = "Há algo de taurino na sua forma de ser.";
      }),
    ).toEqual([]);
    expect(
      codesFor(r, "mente", (d) => {
        d.synthesis = "A energia de Escorpião aprofunda tudo.";
      }),
    ).toEqual(["UNSUPPORTED_SIGN"]);
  });

  it("recusa pontos, casas e aspectos sem origem, inclusive por extenso", () => {
    expect(
      codesFor(r, "mente", (d) => {
        d.synthesis = "Plutão reforça essa busca.";
      }),
    ).toEqual(["UNSUPPORTED_POINT"]);
    expect(
      codesFor(r, "identidade", (d) => {
        d.sections[0].text += " A décima segunda casa pede recolhimento.";
      }),
    ).toEqual(["UNSUPPORTED_HOUSE"]);
    expect(
      codesFor(r, "mente", (d) => {
        d.sections[1].text += " Isso aparece na casa oito.";
      }),
    ).toEqual([]);
    expect(
      codesFor(r, "mente", (d) => {
        d.synthesis = "Uma oposição marca esse tema.";
      }),
    ).toEqual(["UNSUPPORTED_ASPECT"]);
  });

  it("sem horário, só cita Ascendente e casas para explicar a limitação", () => {
    const u = reports.unknown;
    expect(
      codesFor(u, "identidade", (d) => {
        d.synthesis = "O Ascendente completa esse retrato.";
      }),
    ).toEqual(["UNSUPPORTED_POINT"]);
    expect(
      codesFor(u, "identidade", (d) => {
        d.synthesis =
          "Sem o horário de nascimento, o Ascendente e as casas não puderam ser calculados.";
      }),
    ).toEqual([]);
  });

  it("recusa saúde, finanças, decisões de relacionamento e determinismo", () => {
    const patch = (text: string) =>
      codesFor(r, "relacionamentos", (d) => {
        d.synthesis = text;
      });
    expect(patch("Vale procurar tratamento para essa ansiedade.")).toEqual([
      "HEALTH_FINANCE_RELATIONSHIP",
    ]);
    expect(patch("É um bom momento para investir.")).toEqual([
      "HEALTH_FINANCE_RELATIONSHIP",
    ]);
    expect(patch("Talvez seja hora de terminar o relacionamento.")).toEqual([
      "HEALTH_FINANCE_RELATIONSHIP",
    ]);
    expect(patch("Seu mapa determina como você ama.")).toEqual([
      "FORBIDDEN_LANGUAGE",
    ]);
  });

  it("exige ressalva em itens incertos", () => {
    const u = reports.unknown;
    const ch = u.chapters.find((c) =>
      c.items.some((i) => i.certainty === "uncertain"),
    )!;
    const idx = ch.items.findIndex((i) => i.certainty === "uncertain");
    expect(
      codesFor(u, ch.id, (d) => {
        d.sections[idx].text = ch.items[idx].symbolic;
      }),
    ).toEqual(["MISSING_CAVEAT"]);
  });

  it("recusa repetição, excesso de tamanho e perguntas malformadas", () => {
    expect(
      codesFor(r, "mente", (d) => {
        d.synthesis = `${d.sections[0].text} ${d.sections[0].text}`.slice(
          0,
          540,
        );
      }),
    ).toContain("REPETITION");
    expect(
      codesFor(r, "mente", (d) => {
        d.introduction = "Texto longo. ".repeat(40);
      }),
    ).toContain("TOO_LONG");
    expect(
      codesFor(r, "mente", (d) => {
        d.reflectionQuestions = ["Uma afirmação sem interrogação."];
      }),
    ).toEqual(["INVALID_SHAPE"]);
    expect(
      codesFor(r, "mente", (d) => {
        d.reflectionQuestions = [];
      }),
    ).toEqual(["INVALID_SHAPE"]);
  });

  it("recusa itens de outro capítulo e formatos inválidos", () => {
    expect(
      codesFor(r, "mente", (d) => {
        d.sections[0].itemIds = ["identidade:body-sign:sun"];
      }),
    ).toEqual(expect.arrayContaining(["UNKNOWN_ITEM", "MISSING_ITEM"]));
    const ch = chapterOf(r, "mente");
    expect(validateChapterDraft(null, ch, r).errors[0].code).toBe(
      "INVALID_SHAPE",
    );
    expect(
      validateChapterDraft({ introduction: "x" }, ch, r).errors.map(
        (e) => e.part,
      ),
    ).toEqual(["synthesis", "sections", "reflectionQuestions"]);
  });
});

describe("adaptador Anthropic (sem rede)", () => {
  it("monta a requisição com schema, cache e fallback de recusa", async () => {
    const bodies: unknown[] = [];
    const provider = createAnthropicProvider({
      model: "claude-sonnet-5-5",
      effort: "medium",
      create: async (body, opts) => {
        bodies.push({ body, opts });
        return message();
      },
    });
    const req = buildChapterRequest(reports.exact, "mente", {
      maxOutputTokens: 4000,
      timeoutMs: 30_000,
    });
    const res = await provider.generate(req);
    expect(bodies[0]).toMatchObject({
      body: {
        model: "claude-sonnet-5-5",
        max_tokens: 4000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: {
          effort: "medium",
          format: { type: "json_schema", schema: req.schema },
        },
        system: [{ text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: req.user }],
      },
      opts: { timeout: 30_000 },
    });
    expect(res).toEqual({
      model: "claude-sonnet-5-5",
      text: '{"ok":true}',
      stopReason: "end",
      usage: {
        inputTokens: 1200,
        outputTokens: 800,
        cacheReadInputTokens: 900,
        cacheCreationInputTokens: 0,
      },
    });
  });

  it("traduz recusa e truncamento", async () => {
    for (const [stop, expected] of [
      ["refusal", "refusal"],
      ["max_tokens", "max_tokens"],
      ["pause_turn", "other"],
    ] as const) {
      const provider = createAnthropicProvider({
        model: "claude-sonnet-5-5",
        effort: "low",
        create: async () => message({ stop_reason: stop }),
      });
      const res = await provider.generate(
        buildChapterRequest(reports.exact, "mente", {
          maxOutputTokens: 1,
          timeoutMs: 1,
        }),
      );
      expect(res.stopReason).toBe(expected);
    }
  });

  it("traduz erros do SDK em categorias com regra de nova tentativa", () => {
    const h = new Headers();
    const cases: [unknown, string, boolean][] = [
      [new Anthropic.APIConnectionTimeoutError(), "timeout", true],
      [new Anthropic.APIConnectionError({}), "network", true],
      [
        new Anthropic.RateLimitError(429, undefined, "x", h),
        "rate_limit",
        true,
      ],
      [
        new Anthropic.InternalServerError(529, undefined, "x", h),
        "unavailable",
        true,
      ],
      [
        new Anthropic.AuthenticationError(401, undefined, "x", h),
        "auth",
        false,
      ],
      [
        new Anthropic.BadRequestError(400, undefined, "x", h),
        "bad_request",
        false,
      ],
      [new Error("?"), "unknown", false],
    ];
    for (const [error, kind, retryable] of cases) {
      const e = toProviderError(error);
      expect(e).toBeInstanceOf(AiProviderError);
      expect([e.kind, e.retryable]).toEqual([kind, retryable]);
    }
  });
});

describe("configuração e custos", () => {
  it("só usa a API real com flag, provedor e chave no servidor", () => {
    const full = {
      SIDERA_AI_ENABLED: "1",
      SIDERA_AI_PROVIDER: "anthropic",
      ANTHROPIC_API_KEY: "chave-de-teste",
    };
    expect(readAiConfig(full)).toMatchObject({
      mode: "anthropic",
      model: "claude-sonnet-5-5",
      effort: "medium",
    });
    expect(readAiConfig({ ...full, SIDERA_AI_ENABLED: "0" }).mode).toBe("mock");
    expect(readAiConfig({ ...full, ANTHROPIC_API_KEY: "" }).mode).toBe("mock");
    expect(readAiConfig({ ...full, SIDERA_AI_PROVIDER: "openai" }).mode).toBe(
      "mock",
    );
    expect(
      readAiConfig({ ...full, SIDERA_AI_MODEL: "claude-haiku-5-5" }).model,
    ).toBe("claude-haiku-5-5");
  });

  it("estima custo com os preços oficiais e o consumo informado", () => {
    const usage = {
      inputTokens: 1_000_000,
      outputTokens: 1_000_000,
      cacheReadInputTokens: 1_000_000,
      cacheCreationInputTokens: 1_000_000,
    };
    expect(estimateCostUsd("claude-sonnet-5-5", usage)).toBeCloseTo(
      2 + 10 + 0.1 + 2.5,
    );
    expect(estimateCostUsd("claude-haiku-5-5", usage)).toBeCloseTo(
      0.1 + 0.5 + 0.01 + 0.125,
    );
    expect(estimateCostUsd("modelo-desconhecido", usage)).toBeNull();
    expect(Object.keys(MODEL_PRICES)).toContain("claude-opus-5-5");
  });

  it("soma o custo real das tentativas (inclusive as reprovadas)", async () => {
    let n = 0;
    const provider = createAnthropicProvider({
      model: "claude-sonnet-5-5",
      effort: "medium",
      create: async (body) => {
        n++;
        const valid = n > 5; // 1ª rodada inválida, 2ª válida
        const id = (body.messages[0].content as string).match(
          /"id": "(\w+)",\s*"number"/,
        )![1] as ChapterId;
        const draft = libraryDraft(reports.exact, id);
        return message({
          content: [
            {
              type: "text",
              text: valid ? JSON.stringify(draft) : "{",
              citations: null,
            },
          ],
          usage: {
            input_tokens: 1000,
            output_tokens: 500,
            cache_read_input_tokens: 0,
            cache_creation_input_tokens: 0,
          } as Anthropic.Beta.Messages.BetaUsage,
        });
      },
    });
    const out: GeneratedReport = await generateReport(reports.exact, provider);
    expect(out.metrics.totals).toMatchObject({
      calls: 10,
      inputTokens: 10_000,
      outputTokens: 5_000,
      chaptersFromAi: 5,
    });
    // 10 000 × $2/M + 5 000 × $10/M = $0,07
    expect(out.metrics.totals.costUsd).toBeCloseTo(0.07, 6);
  });
});

describe("exemplos determinísticos (biblioteca) dos três horários", () => {
  it.each(cases)("%s", async (c) => {
    const out = libraryReport(
      reports[c],
      "Exemplo determinístico: geração com IA não executada.",
    );
    expect(out.chapters.every((ch) => ch.source === "library")).toBe(true);
    const content = { ...out, metrics: undefined };
    await expect(JSON.stringify(content, null, 2) + "\n").toMatchFileSnapshot(
      `./__fixtures__/library-report.${c}.json`,
    );
  });

  it("falha total do provedor produz o mesmo conteúdo da biblioteca", async () => {
    const failed = await generateReport(
      reports.exact,
      createMockProvider(["error:auth"]),
    );
    const library = libraryReport(reports.exact, "x");
    expect(
      failed.chapters.map((c) => ({ ...c, fallbackReason: null })),
    ).toEqual(library.chapters.map((c) => ({ ...c, fallbackReason: null })));
  });
});
