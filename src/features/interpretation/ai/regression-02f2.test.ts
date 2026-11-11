// @vitest-environment node
/**
 * Regressões da Fase 02F.2, a partir dos problemas da avaliação real (02F.1):
 * falsos positivos do validador, referência cruzada do capítulo emocional
 * (UNSUPPORTED_POINT "Lua", Relatório F), fallback visível ao cliente e
 * descrições incorretas de intervalos e incertezas. Sem rede, sem custo.
 */
import { describe, expect, it } from "vitest";

import type { ChapterId, InterpretationReport } from "../contract";
import { buildInterpretation } from "../engine";
import { TEST_TIMES, testChart } from "../test-support";
import { DEFAULT_MODEL, readAiConfig, SUPPORTED_MODELS } from "./config";
import type {
  AiProvider,
  AiRequest,
  ChapterDraft,
  GeneratedReport,
} from "./contract";
import { blindRuns, renderBlindReport } from "./evaluation";
import { correctionFeedback, generateReport } from "./generate";
import { libraryDraft } from "./library-chapter";
import { createMockProvider } from "./mock-provider";
import { REPEATED_CAVEAT } from "./precision";
import { auditTrail, renderClientReport, toClientReport } from "./presentation";
import { MODEL_PRICES } from "./pricing";
import { buildChapterRequest } from "./prompt";
import { validateChapterDraft } from "./validate";

const reports = {
  exact: buildInterpretation(testChart(TEST_TIMES.exact)),
  approximate: buildInterpretation(testChart(TEST_TIMES.approximate)),
  unknown: buildInterpretation(testChart(TEST_TIMES.unknown)),
};
const cases = Object.keys(reports) as (keyof typeof reports)[];

const chapterOf = (r: InterpretationReport, id: ChapterId) =>
  r.chapters.find((c) => c.id === id)!;

function errorsFor(
  report: InterpretationReport,
  id: ChapterId,
  patch: (d: ChapterDraft) => void,
) {
  const draft = libraryDraft(report, id);
  patch(draft);
  return validateChapterDraft(draft, chapterOf(report, id), report).errors;
}
const codesFor = (...args: Parameters<typeof errorsFor>) =>
  errorsFor(...args).map((e) => e.code);

/** Índice da seção (rascunho da biblioteca) que usa o item. */
const sectionOf = (r: InterpretationReport, id: ChapterId, itemId: string) =>
  libraryDraft(r, id).sections.findIndex((s) => s.itemIds.includes(itemId));

const chapterIdOf = (request: AiRequest) =>
  (
    JSON.parse(
      request.user.slice(
        request.user.indexOf("{"),
        request.user.lastIndexOf("}") + 1,
      ),
    ) as { chapter: { id: ChapterId } }
  ).chapter.id;

/** Provedor roteirizado: rascunho da biblioteca, alterado por capítulo/chamada. */
function scriptedProvider(
  report: InterpretationReport,
  patch: (id: ChapterId, call: number, d: ChapterDraft) => void,
): AiProvider & { calls: AiRequest[] } {
  const calls: AiRequest[] = [];
  const count = new Map<ChapterId, number>();
  return {
    id: "mock",
    model: "mock-local",
    calls,
    async generate(request) {
      calls.push(request);
      const id = chapterIdOf(request);
      const call = count.get(id) ?? 0;
      count.set(id, call + 1);
      const draft = libraryDraft(report, id);
      patch(id, call, draft);
      return {
        model: "mock-local",
        text: JSON.stringify(draft),
        stopReason: "end",
        usage: {
          inputTokens: 1,
          outputTokens: 1,
          cacheReadInputTokens: 0,
          cacheCreationInputTokens: 0,
        },
      };
    },
  };
}

// ── 1. Referências cruzadas e instruções de correção ──────────────────────

describe("referência cruzada entre itens do mesmo capítulo", () => {
  const r = reports.exact;
  const cusp = sectionOf(r, "emocional", "emocional:cusp-sign:4");
  const mentionMoon = (d: ChapterDraft) => {
    d.sections[cusp].text =
      "Com o Fundo do Céu em Sagitário, raízes e lar se ligam à busca de sentido, em sintonia com a Lua.";
  };

  it("caso do Relatório F: vira CROSS_REFERENCE com o itemId da Lua", () => {
    const errors = errorsFor(r, "emocional", mentionMoon);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      code: "CROSS_REFERENCE",
      part: `sections.${cusp}`,
      suggestedItemIds: expect.arrayContaining(["emocional:body-sign:moon"]),
    });
    // O mais específico (só a Lua) vem primeiro.
    expect(errors[0].suggestedItemIds![0]).toBe("emocional:body-sign:moon");
    expect(errors[0].fix).toBe(
      `Na seção ${cusp + 1}, inclua o item referente à Lua (emocional:body-sign:moon) nos itemIds utilizados ou remova essa referência.`,
    );
  });

  it("com o itemId explícito, a mesma seção é aprovada", () => {
    expect(
      codesFor(r, "emocional", (d) => {
        mentionMoon(d);
        d.sections[cusp].itemIds.push("emocional:body-sign:moon");
      }),
    ).toEqual([]);
  });

  it("não abre espaço para afirmações sem sustentação no mapa", () => {
    // Posição inexistente (a Lua está em Sagitário): nem com o item da Lua.
    expect(
      codesFor(r, "emocional", (d) => {
        d.sections[cusp].text += " A Lua em Leão reforça isso.";
        d.sections[cusp].itemIds.push("emocional:body-sign:moon");
      }),
    ).toEqual(["UNSUPPORTED_POSITION", "UNSUPPORTED_SIGN"]);
    // Ponto fora do capítulo.
    expect(
      codesFor(r, "emocional", (d) => {
        d.sections[cusp].text += " Plutão aprofunda esse tema.";
      }),
    ).toEqual(["UNSUPPORTED_POINT"]);
    // Casa fora do capítulo.
    expect(
      codesFor(r, "emocional", (d) => {
        d.sections[cusp].text += " A casa 10 também participa.";
      }),
    ).toEqual(["UNSUPPORTED_HOUSE"]);
  });

  it("a nova tentativa recebe a instrução objetiva", () => {
    const errors = errorsFor(r, "emocional", mentionMoon);
    expect(correctionFeedback(errors)).toContain(
      `- Na seção ${cusp + 1}, inclua o item referente à Lua (emocional:body-sign:moon) nos itemIds utilizados ou remova essa referência.`,
    );
  });

  it("geração: instrução na 2ª tentativa; se persistir, o itemId é acrescentado e revalidado", async () => {
    const provider = scriptedProvider(r, (id, _call, d) => {
      if (id === "emocional") mentionMoon(d);
    });
    const out = await generateReport(r, provider, { maxAttempts: 2 });
    const ch = out.chapters.find((c) => c.id === "emocional")!;
    expect(ch.source).toBe("ai");
    expect(ch.sections[cusp].itemIds).toContain("emocional:body-sign:moon");
    expect(ch.sections[cusp].factIds).toContain("body-sign:moon");

    const attempts = out.metrics.attempts.filter(
      (a) => a.chapter === "emocional",
    );
    expect(attempts.map((a) => a.outcome)).toEqual(["validation_failed", "ok"]);
    expect(attempts[0].errors[0]).toMatch(/^CROSS_REFERENCE/);
    expect(attempts[1].repairs).toEqual([
      `sections.${cusp}: +emocional:body-sign:moon`,
    ]);
    const second = provider.calls.filter(
      (c) => chapterIdOf(c) === "emocional",
    )[1];
    expect(second.user).toContain(
      `Na seção ${cusp + 1}, inclua o item referente à Lua`,
    );
  });

  it("a correção automática não é aplicada se houver outro problema", async () => {
    const provider = scriptedProvider(r, (id, _call, d) => {
      if (id !== "emocional") return;
      mentionMoon(d);
      d.synthesis = "Plutão completa essa leitura.";
    });
    const out = await generateReport(r, provider, { maxAttempts: 2 });
    const ch = out.chapters.find((c) => c.id === "emocional")!;
    expect(ch.source).toBe("library");
    expect(ch.fallbackReason).toMatch(/CROSS_REFERENCE/);
    expect(ch.fallbackReason).toMatch(/UNSUPPORTED_POINT/);
  });
});

// ── 1b. Falsos positivos de linguagem e de graus ─────────────────────────

describe("linguagem figurada ou negada", () => {
  const r = reports.exact;
  const synth = (text: string) =>
    codesFor(r, "relacionamentos", (d) => {
      d.synthesis = text;
    });

  it.each([
    "São possibilidades simbólicas, sem garantias.",
    "Não há garantias: são tendências que você pode observar.",
    "A astrologia não determina quem você é.",
    "Nada aqui é cientificamente comprovado.",
    "Em uma determinada fase, isso pode ficar mais visível.",
    "Conversas podem enriquecer a experiência de estar junto.",
    "Vínculos enriquecedores tendem a nascer da troca.",
  ])("aceita: %s", (text) => {
    expect(synth(text)).toEqual([]);
  });

  it.each([
    ["Esse aspecto garante estabilidade.", "FORBIDDEN_LANGUAGE"],
    ["O mapa não só determina como explica.", "FORBIDDEN_LANGUAGE"],
    ["Seu mapa determina como você ama.", "FORBIDDEN_LANGUAGE"],
    ["Você pode enriquecer com esse talento.", "HEALTH_FINANCE_RELATIONSHIP"],
    ["Isso ajuda a enriquecer o patrimônio.", "HEALTH_FINANCE_RELATIONSHIP"],
  ])("recusa: %s", (text, code) => {
    expect(synth(text)).toEqual([code]);
  });
});

describe("graus", () => {
  const r = reports.exact;
  const square = sectionOf(r, "emocional", "emocional:aspect:asc-moon:square");

  it("aceita o ângulo que define um aspecto nomeado (quadratura, 90°)", () => {
    expect(
      codesFor(r, "emocional", (d) => {
        d.sections[square].text +=
          " A quadratura, um ângulo de 90°, costuma ser lida como atrito que move.";
      }),
    ).toEqual([]);
  });

  it("recusa ângulo solto ou que não corresponde ao aspecto", () => {
    expect(
      codesFor(r, "emocional", (d) => {
        d.synthesis = "Um ângulo de 90° marca esse tema.";
      }),
    ).toEqual(["UNSUPPORTED_DEGREE"]);
    expect(
      codesFor(r, "emocional", (d) => {
        d.sections[square].text += " A quadratura, de 180°, pede integração.";
      }),
    ).toEqual(["UNSUPPORTED_DEGREE"]);
  });

  it("aceita orbes e graus da observação, sem confundir números (16° em 1,16°)", () => {
    expect(
      codesFor(r, "emocional", (d) => {
        d.sections[square].text += " O orbe é de 1,16°.";
      }),
    ).toEqual([]);
  });

  it("o grau precisa pertencer ao ponto nomeado na frase", () => {
    const all = (d: ChapterDraft) => {
      d.sections[0].itemIds = chapterOf(r, "identidade").items.map((i) => i.id);
    };
    expect(
      codesFor(r, "identidade", (d) => {
        all(d);
        d.sections[0].text = "O Sol está a 21°43′ de Touro.";
      }),
    ).toEqual([]);
    const errors = errorsFor(r, "identidade", (d) => {
      all(d);
      d.sections[0].text = "Mercúrio está a 21°43′.";
    });
    expect(errors.map((e) => e.code)).toEqual(["UNSUPPORTED_DEGREE"]);
    expect(errors[0].message).toMatch(/não pertence a Mercúrio/);
  });

  it("o grau da cúspide pertence ao Descendente / Fundo do Céu (validação Haiku)", () => {
    // Falso positivo da validação real: "Descendente a 16°18′" (grau da
    // cúspide da casa 7) era recusado como se o grau fosse de outro ponto.
    const cusp7 = sectionOf(
      r,
      "relacionamentos",
      "relacionamentos:cusp-sign:7",
    );
    expect(
      codesFor(r, "relacionamentos", (d) => {
        d.sections[cusp7].text =
          "Com o Descendente a 24°45′ de Peixes, a tradição associa as parcerias à sensibilidade.";
      }),
    ).toEqual([]);
    const cusp4 = sectionOf(r, "emocional", "emocional:cusp-sign:4");
    expect(
      codesFor(r, "emocional", (d) => {
        d.sections[cusp4].text =
          "O Fundo do Céu está a 26°24′ de Sagitário, ligado às raízes.";
      }),
    ).toEqual([]);
    // O rigor continua: grau de Vênus atribuído ao Descendente é recusado.
    expect(
      codesFor(r, "relacionamentos", (d) => {
        d.sections[cusp7].itemIds.push("relacionamentos:body-sign:venus");
        d.sections[cusp7].text = "O Descendente está a 9°39′.";
      }),
    ).toEqual(["UNSUPPORTED_DEGREE"]);
  });
});

// ── 2. Fallback invisível ao cliente ──────────────────────────────────────

describe("apresentação ao cliente", () => {
  const r = reports.exact;
  const failEmotional = () =>
    createMockProvider((req) =>
      chapterIdOf(req) === "emocional" ? "invented-position" : "valid",
    );

  it("nenhuma mensagem técnica: mesmo formato para IA e biblioteca", async () => {
    const out = await generateReport(r, failEmotional());
    expect(out.chapters.find((c) => c.id === "emocional")!.source).toBe(
      "library",
    );
    const client = toClientReport(out);
    const json = JSON.stringify(client);
    for (const term of [
      "source",
      "fallback",
      "biblioteca",
      "reprovad",
      "itemIds",
      "factIds",
      "mock",
      "UNSUPPORTED",
    ])
      expect(json).not.toContain(term);
    const keys = client.chapters.map((c) => Object.keys(c).join(","));
    expect(new Set(keys).size).toBe(1);
    const md = renderClientReport(client);
    expect(md).not.toMatch(/biblioteca|reprovad|gera[çc][ãa]o|valida[çc]/iu);
  });

  it("a origem, o motivo e as métricas ficam na trilha interna", async () => {
    const out = await generateReport(r, failEmotional());
    const audit = auditTrail(out).chapters.find((c) => c.id === "emocional")!;
    expect(audit.source).toBe("library");
    expect(audit.fallbackReason).toMatch(/UNSUPPORTED_POSITION/);
    expect(audit.attempts).toHaveLength(2);
    expect(audit.attempts[0].errors.length).toBeGreaterThan(0);
  });

  it("o relatório cego não marca capítulos da biblioteca no título", async () => {
    const out: GeneratedReport = await generateReport(r, failEmotional());
    const { reports: blind } = blindRuns(
      [{ caseId: "exato", modelName: "x", generated: out }],
      [{ id: "exato", label: "Caso 1", report: r }],
      () => 0.5,
    );
    const md = renderBlindReport(blind[0]);
    const titles = md.split("\n").filter((l) => l.startsWith("## "));
    expect(titles).toHaveLength(5);
    for (const t of titles) expect(t).not.toMatch(/biblioteca|reprovad/u);
  });
});

// ── 3. Intervalos e precisão: texto do sistema ───────────────────────────

describe("precisão e intervalos controlados pelo sistema", () => {
  it.each(cases)(
    "o modelo não recebe janelas, intervalos nem ressalvas (%s)",
    (c) => {
      for (const ch of reports[c].chapters) {
        const req = buildChapterRequest(reports[c], ch.id, {
          maxOutputTokens: 1,
          timeoutMs: 1,
        });
        const input = JSON.parse(req.user.slice(req.user.indexOf("{"))) as {
          items: unknown[];
        };
        expect(Object.keys(input)).not.toContain("limitations");
        const items = JSON.stringify(input.items);
        expect(items).not.toMatch(/janela|caveat|entre \d/u);
        for (const i of ch.items) expect(items).not.toContain(i.caveat ?? "§");
      }
    },
  );

  it("recusa explicações de precisão escritas pelo modelo (casos da 02F.1)", () => {
    const a = reports.approximate;
    const unique = (codes: string[]) => [...new Set(codes)];
    expect(
      unique(
        codesFor(a, "mente", (d) => {
          d.sections[0].text +=
            " Ele está calculado com precisão dentro de uma janela de incerteza pequena.";
        }),
      ),
    ).toEqual(["PRECISION_CLAIM"]);
    expect(
      unique(
        codesFor(a, "emocional", (d) => {
          d.sections[0].text +=
            " Como o horário de nascimento é aproximado, ela pode variar entre 22°35′ e 24°35′ do mesmo signo.";
        }),
      ),
    ).toEqual(["UNSUPPORTED_DEGREE", "PRECISION_CLAIM"]);
  });

  it("intervalo de posição só como nota, ligado ao ponto e ao fato corretos", async () => {
    for (const c of ["approximate", "unknown"] as const) {
      const r = reports[c];
      const out = await generateReport(r, createMockProvider());
      const facts = new Map(r.facts.map((f) => [f.id, f]));
      for (const ch of out.chapters) {
        const notes = ch.sections.flatMap((s) => s.notes);
        for (const item of chapterOf(r, ch.id).items)
          for (const f of item.factIds.map((id) => facts.get(id)!)) {
            const m = f.observation.match(/entre (.+?) e (.+?)\)/u);
            if (f.kind !== "body-sign" || !m) continue;
            const matching = notes.filter((n) =>
              n.includes(`entre ${m[1]} e ${m[2]}`),
            );
            expect(matching).toHaveLength(1);
            const of = { sun: "do Sol", moon: "da Lua" }[f.bodies[0] as string];
            if (of) expect(matching[0]).toContain(`posição ${of}`);
            // A nota fica na seção que cita o item.
            const sec = ch.sections.find((s) => s.notes.includes(matching[0]))!;
            expect(sec.factIds).toContain(f.id);
          }
      }
    }
  });

  it("textos de cada precisão: aproximado, desconhecido e exato", async () => {
    const note = async (c: keyof typeof reports) =>
      (await generateReport(reports[c], createMockProvider())).chapters
        .find((ch) => ch.id === "identidade")!
        .sections.flatMap((s) => s.notes);
    expect(await note("approximate")).toContain(
      "Com o horário de nascimento aproximado, a posição do Sol pode estar entre 21°38′ de Touro e 21°48′ de Touro; a leitura usa a posição calculada para o horário informado (21°43′ de Touro).",
    );
    expect(await note("unknown")).toContain(
      "Sem o horário de nascimento, a posição do Sol varia ao longo do dia, entre 21°08′ de Touro e 22°06′ de Touro; a leitura usa a posição calculada para o meio-dia (21°37′ de Touro).",
    );
    // Horário exato: nenhum intervalo.
    const exact = await generateReport(reports.exact, createMockProvider());
    expect(
      exact.chapters.flatMap((c) => c.sections.flatMap((s) => s.notes)),
    ).toEqual([]);
  });

  it("ressalva oficial na seção do item incerto, sem repetição literal", async () => {
    const u = reports.unknown;
    const out = await generateReport(u, createMockProvider());
    const ch = out.chapters.find((c) => c.id === "emocional")!;
    const uncertain = chapterOf(u, "emocional").items.filter((i) => i.caveat);
    expect(uncertain.length).toBeGreaterThanOrEqual(2);
    const notes = ch.sections.flatMap((s) => s.notes);
    expect(notes.filter((n) => n === uncertain[0].caveat)).toHaveLength(1);
    expect(notes).toContain(REPEATED_CAVEAT);
  });

  it("horário desconhecido: Ascendente, Meio do Céu e casas continuam proibidos", () => {
    const u = reports.unknown;
    const asc = errorsFor(u, "identidade", (d) => {
      d.sections[0].text += " O Ascendente reforça isso.";
    });
    expect(asc.map((e) => e.code)).toEqual(["UNSUPPORTED_POINT"]);
    expect(asc[0].message).toMatch(
      /não pode ser citado: com horário de nascimento desconhecido/u,
    );
    expect(
      codesFor(u, "talentos", (d) => {
        d.synthesis = "O Meio do Céu orienta a vocação.";
      }),
    ).toEqual(["UNSUPPORTED_POINT"]);
    expect(
      codesFor(u, "emocional", (d) => {
        d.sections[0].text += " A casa 4 acolhe esse movimento.";
      }),
    ).toEqual(["UNSUPPORTED_HOUSE"]);
    // Nem para explicar a ausência.
    expect(
      codesFor(u, "identidade", (d) => {
        d.synthesis = "O Ascendente não foi considerado nesta leitura.";
      }).sort(),
    ).toEqual(["PRECISION_CLAIM", "UNSUPPORTED_POINT"]);
  });

  it("horário aproximado: Ascendente fora dos itens segue recusado", () => {
    expect(
      codesFor(reports.approximate, "identidade", (d) => {
        d.synthesis = "O Ascendente completa o retrato.";
      }),
    ).toEqual(["UNSUPPORTED_POINT"]);
  });

  it.each(cases)("a versão da biblioteca continua válida (%s)", (c) => {
    for (const ch of reports[c].chapters)
      expect(
        validateChapterDraft(libraryDraft(reports[c], ch.id), ch, reports[c])
          .errors,
      ).toEqual([]);
  });
});

// ── Configuração ──────────────────────────────────────────────────────────

describe("modelo padrão", () => {
  const env = {
    SIDERA_AI_ENABLED: "1",
    SIDERA_AI_PROVIDER: "anthropic",
    ANTHROPIC_API_KEY: "chave-de-teste",
  };

  it("Haiku 5.5 é o padrão; Sonnet 5.5 segue disponível; sem fallback pago", () => {
    expect(DEFAULT_MODEL).toBe("claude-haiku-5-5");
    expect(readAiConfig(env)).toMatchObject({
      model: "claude-haiku-5-5",
      refusalFallback: false,
    });
    expect(
      readAiConfig({ ...env, SIDERA_AI_MODEL: "claude-sonnet-5-5" }).model,
    ).toBe("claude-sonnet-5-5");
    for (const m of SUPPORTED_MODELS) expect(MODEL_PRICES[m]).toBeDefined();
  });
});
