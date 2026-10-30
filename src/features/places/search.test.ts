// @vitest-environment node
import { describe, expect, it } from "vitest";

import brazil from "./data/places-br.json";
import world from "./data/places-world.json";
import { buildIndex, foldText, searchPlaces } from "./search";
import type { PlaceRecord } from "./types";

const records = [...(brazil as PlaceRecord[]), ...(world as PlaceRecord[])];
const index = buildIndex(records);
const search = (q: string) => searchPlaces(index, q, 50);

describe("base de localidades", () => {
  it("cobre todos os municípios do IBGE, cada um com fuso IANA válido", () => {
    expect(brazil.length).toBeGreaterThanOrEqual(5570);
    for (const p of brazil as PlaceRecord[]) {
      expect(p.tz, p.name).toMatch(/^America\//);
      expect(
        () => new Intl.DateTimeFormat("en", { timeZone: p.tz! }),
      ).not.toThrow();
      expect(p.admin1Code).toMatch(/^[A-Z]{2}$/);
    }
  });

  it("tem coordenadas válidas e ids únicos", () => {
    const ids = new Set(records.map((r) => r.id));
    expect(ids.size).toBe(records.length);
    for (const r of records) {
      expect(Math.abs(r.lat)).toBeLessThanOrEqual(90);
      expect(Math.abs(r.lon)).toBeLessThanOrEqual(180);
    }
  });

  it("usa os fusos da tzdb por região, inclusive as divisões internas", () => {
    // Referência: tzdb zone1970.tab e comentários do arquivo `southamerica`.
    const tz = (name: string, uf: string) =>
      (brazil as PlaceRecord[]).find(
        (p) => p.name === name && p.admin1Code === uf,
      )?.tz;
    expect(tz("Recife", "PE")).toBe("America/Recife");
    expect(tz("Fernando de Noronha", "PE")).toBe("America/Noronha");
    expect(tz("Salvador", "BA")).toBe("America/Bahia");
    expect(tz("Cuiabá", "MT")).toBe("America/Cuiaba");
    expect(tz("Rio Branco", "AC")).toBe("America/Rio_Branco");
    // Pará: o rio Xingu divide Belém (leste) e Santarém (oeste).
    expect(tz("Belém", "PA")).toBe("America/Belem");
    expect(tz("Altamira", "PA")).toBe("America/Santarem");
    expect(tz("Óbidos", "PA")).toBe("America/Santarem");
    // Amazonas: Eirunepé, Envira e Ipixuna a oeste; Manaus a leste.
    expect(tz("Eirunepé", "AM")).toBe("America/Eirunepe");
    expect(tz("Envira", "AM")).toBe("America/Eirunepe");
    expect(tz("Manaus", "AM")).toBe("America/Manaus");
  });
});

describe("searchPlaces", () => {
  it("encontra uma cidade brasileira comum, com estado e país", () => {
    const [first] = search("Recife").results;
    expect(first).toMatchObject({
      name: "Recife",
      regionCode: "PE",
      label: "Recife — PE, Brasil",
      timeZone: "America/Recife",
    });
    expect(first.coordinates.latitude).toBeCloseTo(-8.05, 1);
  });

  it("lista todas as cidades homônimas, sem escolher nenhuma", () => {
    const { results, total } = search("Bom Jesus");
    const exact = results.filter((r) => r.name === "Bom Jesus");
    expect(exact.map((r) => r.regionCode).sort()).toEqual([
      "PB",
      "PI",
      "RN",
      "RS",
      "SC",
    ]);
    expect(new Set(exact.map((r) => r.label)).size).toBe(exact.length);
    expect(total).toBeGreaterThan(exact.length); // também "Bom Jesus da Lapa" etc.
  });

  it("ignora acentos, caixa e pontuação", () => {
    expect(foldText("São João d'Aliança")).toBe("sao joao d alianca");
    expect(search("sao paulo").results[0]).toMatchObject({
      name: "São Paulo",
      regionCode: "SP",
    });
    expect(search("BRASILIA").results[0]).toMatchObject({
      name: "Brasília",
      regionCode: "DF",
    });
  });

  it("aceita nomes alternativos em português", () => {
    expect(search("Lisboa").results[0]).toMatchObject({
      name: "Lisbon",
      country: "PT",
      timeZone: "Europe/Lisbon",
    });
    expect(search("nova york").results[0]).toMatchObject({
      name: "New York City",
      country: "US",
    });
    expect(search("Tóquio").results[0]).toMatchObject({
      country: "JP",
      timeZone: "Asia/Tokyo",
    });
  });

  it("exibe região e país em português para o exterior", () => {
    const [lisboa] = search("Lisboa").results;
    expect(lisboa.label).toBe("Lisbon — Lisbon, Portugal");
  });

  it("prioriza correspondência exata sobre parcial", () => {
    const { results } = search("Santos");
    expect(results[0].name).toBe("Santos");
  });

  it("não busca com menos de 2 caracteres", () => {
    expect(search("a")).toEqual({ results: [], total: 0 });
    expect(search("  ")).toEqual({ results: [], total: 0 });
  });

  it("devolve localidades sem fuso definido como incompletas (sem adivinhar)", () => {
    const kashgar = search("Kashgar").results[0];
    expect(kashgar.timeZone).toBeNull();
  });
});
