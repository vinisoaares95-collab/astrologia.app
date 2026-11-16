import { describe, expect, it } from "vitest";

import {
  clearHand,
  insufficientPhoto,
  linesMissing,
  partialHand,
} from "./__fixtures__/observations";
import { FEATURE_IDS } from "./contract";
import { validatePalmObservation } from "./validate-observation";

const ok = (raw: unknown, hand: "right" | "left" = "right") => {
  const r = validatePalmObservation(raw, hand);
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  return r;
};
const fail = (raw: unknown, hand: "right" | "left" = "right") => {
  const r = validatePalmObservation(raw, hand);
  if (r.ok) throw new Error("deveria falhar");
  return r.errors.map((e) => e.code);
};

describe("observação nítida", () => {
  it("é aceita inteira, com status completo", () => {
    const r = ok(clearHand());
    expect(r.observation.status).toBe("complete");
    expect(r.notes).toEqual([]);
    for (const id of FEATURE_IDS)
      expect(r.observation.features[id].visibility).toBe("clear");
  });

  it("sem linha do destino continua completa (o destino é opcional)", () => {
    const o = clearHand();
    o.features["fate.presence"] = {
      visibility: "not_visible",
      reason: "too_faint",
    };
    expect(ok(o).observation.status).toBe("complete");
  });
});

describe("resultados parciais, sem inventar", () => {
  it("características parciais e não visíveis ficam como vieram", () => {
    const r = ok(partialHand(), "left");
    const f = r.observation.features;
    expect(r.observation.status).toBe("partial");
    expect(f["heart.shape"].visibility).toBe("partial");
    expect(f["hand.fingerLength"]).toEqual({
      visibility: "not_visible",
      reason: "out_of_frame",
    });
    // Não visível nunca ganha valor.
    expect(f["head.slope"]).not.toHaveProperty("value");
  });

  it("linha do destino parcial é rebaixada (só entra quando nítida)", () => {
    const r = ok(partialHand(), "left");
    expect(r.observation.features["fate.presence"].visibility).toBe(
      "not_visible",
    );
    expect(r.notes).toContainEqual(
      expect.objectContaining({
        code: "FATE_NOT_CLEAR",
        feature: "fate.presence",
      }),
    );
  });

  it("linhas não identificáveis: só o formato da mão é usado", () => {
    const r = ok(linesMissing());
    expect(r.observation.status).toBe("partial");
    const used = FEATURE_IDS.filter(
      (id) => r.observation.features[id].visibility !== "not_visible",
    );
    expect(used).toEqual(["hand.palmShape", "hand.fingerLength"]);
  });

  it("foto insuficiente: nada é usado", () => {
    const r = ok(insufficientPhoto());
    expect(r.observation.status).toBe("insufficient");
    expect(r.notes).toEqual([]);
  });
});

describe("evidência visual obrigatória", () => {
  it.each([
    ["vazia", ""],
    ["curta", "Visível."],
    ["genérica", "A linha é visível e nítida na palma da mão."],
    ["longa demais", "Sob o dedo indicador, ".repeat(10)],
  ])("evidência %s: a característica vira não visível", (_, evidence) => {
    const o = clearHand();
    o.features["heart.length"].evidence = evidence;
    const r = ok(o);
    expect(r.observation.features["heart.length"].visibility).toBe(
      "not_visible",
    );
    expect(r.notes).toContainEqual(
      expect.objectContaining({
        code: "WEAK_EVIDENCE",
        feature: "heart.length",
      }),
    );
    expect(r.observation.status).toBe("partial");
  });

  it("evidência com interpretação não serve como descrição visual", () => {
    const o = clearHand();
    o.features["heart.shape"].evidence =
      "A curva sob o indicador indica que a pessoa é muito afetuosa.";
    const r = ok(o);
    expect(r.observation.features["heart.shape"].visibility).toBe(
      "not_visible",
    );
    expect(r.notes[0].code).toBe("INTERPRETIVE_EVIDENCE");
  });

  it("a mesma evidência para duas características: a segunda é rebaixada", () => {
    const o = clearHand();
    o.features["head.slope"].evidence = o.features["head.length"].evidence;
    const r = ok(o);
    expect(r.observation.features["head.length"].visibility).toBe("clear");
    expect(r.observation.features["head.slope"].visibility).toBe("not_visible");
    expect(r.notes[0].code).toBe("REPEATED_EVIDENCE");
  });
});

describe("dados contraditórios", () => {
  it("imagem insuficiente com características 'nítidas': nada é usado", () => {
    const o = clearHand();
    o.image = { quality: "insufficient", issues: ["blurry"] };
    const r = ok(o);
    expect(r.observation.status).toBe("insufficient");
    expect(r.notes.map((n) => n.code)).toContain("QUALITY_CONTRADICTION");
    expect(r.notes.filter((n) => n.code === "IMAGE_INSUFFICIENT")).toHaveLength(
      FEATURE_IDS.length,
    );
  });

  it.each(["back_of_hand", "not_a_hand", "multiple_hands", "hand_closed"])(
    "'%s' impede a leitura, mesmo com qualidade 'adequada'",
    (issue) => {
      const o = clearHand();
      o.image = { quality: "adequate", issues: [issue as never] };
      const r = ok(o);
      expect(r.observation.status).toBe("insufficient");
      expect(r.notes[0].code).toBe("QUALITY_CONTRADICTION");
    },
  );

  it("cabeça 'unida à vida' sem a linha da vida visível é rebaixada", () => {
    const o = clearHand();
    o.features["life.arc"] = { visibility: "not_visible", reason: "obscured" };
    const r = ok(o);
    expect(r.observation.features["head.start"].visibility).toBe("not_visible");
    expect(r.notes).toContainEqual(
      expect.objectContaining({ code: "INCONSISTENT", feature: "head.start" }),
    );
    // "separada" não depende da linha da vida.
    o.features["head.start"].value = "separate";
    expect(ok(o).observation.features["head.start"].visibility).toBe("clear");
  });

  it("mão da observação diferente da escolhida: recusada", () => {
    expect(fail(clearHand(), "left")).toEqual(["HAND_MISMATCH"]);
  });
});

describe("estruturas malformadas e tentativas não sustentadas", () => {
  it.each([
    ["nulo", null],
    ["lista", []],
    ["texto", "palma quadrada"],
  ])("entrada %s", (_, raw) => {
    expect(fail(raw)).toContain("INVALID_SHAPE");
  });

  it("versão errada", () => {
    expect(fail({ ...clearHand(), version: "02f.2" })).toEqual([
      "VERSION_MISMATCH",
    ]);
  });

  it("valor fora do contrato (ex.: comprimento da linha da vida)", () => {
    const o = clearHand() as unknown as Record<string, Record<string, unknown>>;
    o.features["life.length"] = {
      visibility: "clear",
      value: "short",
      evidence: "A linha da vida termina cedo, perto do centro da palma.",
    };
    expect(fail(o)).toEqual(["UNKNOWN_FIELD"]);
    const p = clearHand();
    p.features["heart.length"].value = "very_long";
    expect(fail(p)).toEqual(["INVALID_VALUE"]);
    const q = clearHand();
    q.features["fate.presence"].value = "broken";
    expect(fail(q)).toEqual(["INVALID_VALUE"]);
  });

  it("confiança numérica não é aceita (visibilidade é categórica)", () => {
    const o = clearHand();
    o.features["heart.length"].confidence = 0.93;
    expect(fail(o)).toEqual(["UNKNOWN_FIELD"]);
  });

  it("campos extras com atributos pessoais são recusados", () => {
    expect(fail({ ...clearHand(), estimatedAge: 34 })).toEqual([
      "UNKNOWN_FIELD",
    ]);
    const o = clearHand() as unknown as Record<string, Record<string, unknown>>;
    o.image.skinTone = "clara";
    expect(fail(o)).toEqual(["UNKNOWN_FIELD"]);
  });

  it("'não visível' não pode carregar valor nem evidência", () => {
    const o = clearHand();
    o.features["head.slope"] = {
      visibility: "not_visible",
      reason: "too_faint",
      value: "sloping",
    };
    expect(fail(o)).toEqual(["UNKNOWN_FIELD"]);
    const p = clearHand();
    p.features["head.slope"] = { visibility: "not_visible", reason: "palpite" };
    expect(fail(p)).toEqual(["INVALID_VALUE"]);
  });

  it("característica usada sem evidência alguma é estrutura inválida", () => {
    const o = clearHand();
    delete o.features["heart.length"].evidence;
    expect(fail(o)).toEqual(["INVALID_SHAPE"]);
    const p = clearHand();
    delete (p.features as Record<string, unknown>)["life.arc"];
    expect(fail(p)).toEqual(["INVALID_SHAPE"]);
  });

  it.each([
    "Linha sob o indicador, com cicatriz perto do pulso.",
    "Pele clara, linha nítida até a base do dedo médio.",
    "Mão de mulher jovem; a linha termina sob o anelar.",
    "Tatuagem perto do polegar cobre o início da linha.",
    "Impressão digital visível no dedo indicador.",
  ])("identidade, saúde ou atributo sensível recusa tudo: %s", (evidence) => {
    const o = clearHand();
    o.features["head.length"].evidence = evidence;
    expect(fail(o)).toEqual(["SENSITIVE_CONTENT"]);
  });

  it("visibilidade e problemas de imagem fora do contrato", () => {
    const o = clearHand();
    o.features["heart.shape"].visibility = "probable";
    expect(fail(o)).toEqual(["INVALID_VALUE"]);
    const p = clearHand();
    p.image = { quality: "good", issues: ["noise"] } as never;
    expect(fail(p)).toEqual(["INVALID_VALUE", "INVALID_VALUE"]);
  });
});

// ── 03F.1: correções após o piloto visual ─────────────────────────────────

describe("comprimento dos dedos (piloto 03F.1)", () => {
  const fingersOf = (r: ReturnType<typeof ok>) =>
    r.observation.features["hand.fingerLength"];
  const noteOf = (r: ReturnType<typeof ok>) =>
    r.notes.find((n) => n.feature === "hand.fingerLength")?.code;

  it("com a ponta do dedo médio e o pulso na evidência, a classificação vale", () => {
    const r = ok(clearHand());
    expect(fingersOf(r)).toMatchObject({ visibility: "clear", value: "short" });
    expect(noteOf(r)).toBeUndefined();
  });

  it.each([
    // Evidências reais do piloto que não puderam ser confirmadas.
    [
      "sem ponta nem pulso",
      "O dedo médio, estendido à direita, mede bem menos de três quartos do comprimento da palma.",
    ],
    [
      "sem ponta",
      "O dedo médio é visivelmente mais curto que o comprimento da palma, do pulso até a base dos dedos.",
    ],
    [
      "sem pulso",
      "A ponta do dedo médio fica bem abaixo das pontas dos dedos vizinhos.",
    ],
  ])("evidência %s: indeterminada, não interpretada", (_, evidence) => {
    const o = clearHand();
    o.features["hand.fingerLength"].evidence = evidence;
    const r = ok(o);
    expect(fingersOf(r)).toEqual({
      visibility: "not_visible",
      reason: "unclassifiable",
    });
    expect(noteOf(r)).toBe("FINGER_REFERENCES_MISSING");
  });

  it("pontas cortadas (problema de imagem): fora do quadro", () => {
    const o = clearHand();
    o.image = { quality: "limited", issues: ["hand_cropped"] };
    const r = ok(o);
    expect(fingersOf(r)).toEqual({
      visibility: "not_visible",
      reason: "out_of_frame",
    });
    expect(noteOf(r)).toBe("FINGERS_CROPPED");
  });

  it("pontas cortadas descritas na própria evidência, mesmo sem o problema marcado", () => {
    const o = clearHand();
    o.features["hand.fingerLength"] = {
      visibility: "partial",
      value: "medium",
      evidence:
        "O dedo médio sai da base da palma perto do pulso, mas a ponta fica cortada no topo da foto.",
    };
    const r = ok(o);
    expect(fingersOf(r)).toMatchObject({ reason: "out_of_frame" });
    expect(noteOf(r)).toBe("FINGERS_CROPPED");
  });

  it("mão inclinada: indeterminada (proporção distorcida)", () => {
    const o = clearHand();
    o.image = { quality: "limited", issues: ["angled"] };
    const r = ok(o);
    expect(fingersOf(r)).toMatchObject({ reason: "unclassifiable" });
    expect(noteOf(r)).toBe("PERSPECTIVE");
    // Só os dedos: as linhas seguem valendo.
    expect(r.observation.features["heart.length"].visibility).toBe("clear");
  });
});

describe("traço visível × categoria classificável (03c.2)", () => {
  it("'unclassifiable' é aceito como motivo de não visível", () => {
    const o = clearHand();
    o.features["head.length"] = {
      visibility: "not_visible",
      reason: "unclassifiable",
    };
    const r = ok(o);
    expect(r.observation.features["head.length"]).toEqual({
      visibility: "not_visible",
      reason: "unclassifiable",
    });
    expect(r.observation.status).toBe("partial");
  });

  it("'unclassifiable' não carrega valor nem evidência", () => {
    const o = clearHand() as unknown as {
      features: Record<string, Record<string, unknown>>;
    };
    o.features["head.length"] = {
      visibility: "not_visible",
      reason: "unclassifiable",
      value: "long",
    };
    expect(fail(o)).toContain("UNKNOWN_FIELD");
  });
});
