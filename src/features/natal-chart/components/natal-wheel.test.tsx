import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import type { Body } from "@/features/astrology/domain/types";
import { angularSeparation } from "@/features/astrology/domain/zodiac";
import { swissEphemeris } from "@/features/astrology/engine/swiss-ephemeris";
import { normalizeBirthData } from "@/features/birth-data/normalize";
import type { PlaceRecord } from "@/features/places/types";

import { buildChartView } from "../build-chart";
import type { ChartView } from "../contract";
import { WHEEL, longitudeAtPoint } from "../geometry";
import { NatalChartView } from "./natal-chart-view";
import { NatalWheel } from "./natal-wheel";

const sp: PlaceRecord = {
  id: "t:sp",
  name: "São Paulo",
  admin1: "São Paulo",
  admin1Code: "SP",
  country: "BR",
  lat: -23.5505,
  lon: -46.6333,
  tz: "America/Sao_Paulo",
};

function chart(
  date: string,
  time: Parameters<typeof normalizeBirthData>[0]["time"],
): ChartView {
  const r = normalizeBirthData(
    { date, time, placeId: sp.id },
    {
      getPlace: () => sp,
      today: { year: 2026, month: 10, day: 30 },
      tzdbVersion: "teste",
    },
  );
  if (r.status !== "ok") throw new Error("normalização");
  return buildChartView(r.birth, swissEphemeris);
}

const exact = chart("12/05/1990", { precision: "exact", value: "14:30" });
const unknown = chart("12/05/1990", { precision: "unknown" });

function Harness({ view }: { view: ChartView }) {
  const [selected, setSelected] = useState<Body | null>(null);
  return (
    <NatalWheel
      chart={view}
      selected={selected}
      onSelect={setSelected}
      showAspects
    />
  );
}

/** Longitude representada pelo ponto (x, y) de um elemento SVG. */
const lonAt = (x: string | null, y: string | null, orientation: number) =>
  longitudeAtPoint({ x: Number(x), y: Number(y) }, orientation);

describe("correspondência entre o cálculo e o desenho", () => {
  const { container } = render(<Harness view={exact} />);
  const o = exact.orientation.longitude;
  const svg = container.querySelector("svg")!;

  it("cada marca de planeta está na longitude calculada (≤ 0,01°)", () => {
    for (const body of exact.bodies) {
      const tick = svg.querySelector(`[data-tick-for="${body.body}"]`)!;
      expect(
        angularSeparation(
          lonAt(tick.getAttribute("x1"), tick.getAttribute("y1"), o),
          body.longitude,
        ),
      ).toBeLessThan(0.01);
      expect(
        angularSeparation(
          lonAt(tick.getAttribute("x2"), tick.getAttribute("y2"), o),
          body.longitude,
        ),
      ).toBeLessThan(0.01);
    }
  });

  it("os signos seguem a ordem zodiacal a partir de 0° Áries, no sentido anti-horário", () => {
    const sectors = [...svg.querySelectorAll("[data-sign]")];
    expect(sectors.map((s) => s.getAttribute("data-sign"))).toEqual([
      "aries",
      "taurus",
      "gemini",
      "cancer",
      "leo",
      "virgo",
      "libra",
      "scorpio",
      "sagittarius",
      "capricorn",
      "aquarius",
      "pisces",
    ]);
    sectors.forEach((sector, i) => {
      const [, x, y] = /^M([\d.]+) ([\d.]+)/.exec(
        sector.querySelector("path")!.getAttribute("d")!,
      )!;
      expect(angularSeparation(lonAt(x, y, o), i * 30)).toBeLessThan(0.01);
    });
  });

  it("as cúspides das casas estão nas longitudes calculadas", () => {
    const lines = [...svg.querySelectorAll("[data-house] line")];
    expect(lines).toHaveLength(12);
    lines.forEach((line, i) => {
      expect(
        angularSeparation(
          lonAt(line.getAttribute("x1"), line.getAttribute("y1"), o),
          exact.houses!.cusps[i].longitude,
        ),
      ).toBeLessThan(0.01);
    });
  });

  it("Ascendente à esquerda (9 h) e Meio do Céu na metade superior", () => {
    const asc = svg.querySelector('[data-angle="asc"] line')!;
    const ascOuter = {
      x: Number(asc.getAttribute("x2")),
      y: Number(asc.getAttribute("y2")),
    };
    expect(ascOuter.x).toBeLessThan(WHEEL.center - WHEEL.rOuter + 1);
    expect(Math.abs(ascOuter.y - WHEEL.center)).toBeLessThan(0.01);
    const mc = svg.querySelector('[data-angle="mc"] line')!;
    expect(Number(mc.getAttribute("y2"))).toBeLessThan(WHEEL.center);
    expect(
      angularSeparation(
        lonAt(mc.getAttribute("x2"), mc.getAttribute("y2"), o),
        exact.angles!.mc.longitude,
      ),
    ).toBeLessThan(0.01);
  });

  it("as linhas de aspecto ligam as longitudes reais dos dois corpos", () => {
    const drawn = [...svg.querySelectorAll("[data-aspect]")];
    expect(drawn.length).toBe(
      exact.aspects.filter(
        (a) =>
          a.type !== "conjunction" &&
          !["asc", "mc"].includes(a.a) &&
          !["asc", "mc"].includes(a.b),
      ).length,
    );
    for (const line of drawn) {
      const [a, b] = line.getAttribute("data-aspect")!.split("-");
      const la = exact.bodies.find((x) => x.body === a)!.longitude;
      const lb = exact.bodies.find((x) => x.body === b)!.longitude;
      expect(
        angularSeparation(
          lonAt(line.getAttribute("x1"), line.getAttribute("y1"), o),
          la,
        ),
      ).toBeLessThan(0.01);
      expect(
        angularSeparation(
          lonAt(line.getAttribute("x2"), line.getAttribute("y2"), o),
          lb,
        ),
      ).toBeLessThan(0.01);
    }
  });

  it("símbolos de planetas próximos não se sobrepõem", () => {
    const circles = exact.bodies.map((b) =>
      svg.querySelector(`[data-body="${b.body}"] circle`)!,
    );
    for (let i = 0; i < circles.length; i++) {
      for (let j = i + 1; j < circles.length; j++) {
        const dx =
          Number(circles[i].getAttribute("cx")) -
          Number(circles[j].getAttribute("cx"));
        const dy =
          Number(circles[i].getAttribute("cy")) -
          Number(circles[j].getAttribute("cy"));
        expect(Math.hypot(dx, dy)).toBeGreaterThan(2 * 25 - 7); // raio 25; tolerância de leve contato
      }
    }
  });
});

describe("horário desconhecido na mandala", () => {
  it("orienta por 0° Áries e não desenha ângulos nem casas", () => {
    const { container } = render(<Harness view={unknown} />);
    const svg = container.querySelector("svg")!;
    expect(svg.getAttribute("data-orientation")).toBe("aries");
    expect(svg.querySelector('[data-layer="angles"]')).toBeNull();
    expect(svg.querySelector('[data-layer="houses"]')).toBeNull();
    expect(svg.textContent).toContain("Sem horário");
    expect(svg.querySelector('[data-range-for="moon"]')).not.toBeNull();
  });
});

describe("navegação por teclado e detalhes", () => {
  it("Tab entra na mandala, setas percorrem os planetas em ordem zodiacal, Enter mostra os dados, Esc fecha", async () => {
    const user = userEvent.setup();
    render(<NatalChartView chart={exact} />);
    const wheel = screen.getByTestId("natal-wheel");
    const buttons = within(wheel).getAllByRole("button");
    expect(buttons).toHaveLength(10);
    expect(
      buttons.filter((b) => b.getAttribute("tabindex") === "0"),
    ).toHaveLength(1); // roving tabindex

    buttons[0].focus();
    const zodiacOrder = [...exact.bodies].sort(
      (a, b) => a.longitude - b.longitude,
    );
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement?.getAttribute("data-body")).toBe(
      buttons[1].getAttribute("data-body"),
    );
    await user.keyboard("{Enter}");
    const details = await screen.findByTestId("body-details");
    const focusedBody = exact.bodies.find(
      (b) => b.body === document.activeElement?.getAttribute("data-body"),
    )!;
    expect(
      within(details).getByText(new RegExp(`${focusedBody.degree}°`)),
    ).toBeInTheDocument();
    expect(zodiacOrder.map((b) => b.body)).toContain(focusedBody.body);
    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("body-details")).not.toBeInTheDocument();
  });

  it("cada planeta tem rótulo acessível com signo, grau e casa", () => {
    render(<NatalChartView chart={exact} />);
    const sun = exact.bodies.find((b) => b.body === "sun")!;
    expect(
      screen.getByRole("button", {
        name: new RegExp(`^Sol em ${sun.degree}°.*casa ${sun.house}`),
      }),
    ).toBeInTheDocument();
  });

  it("a tabela de posições traz todos os corpos e as cúspides", () => {
    render(<NatalChartView chart={exact} />);
    expect(
      screen.getByTestId("positions-table").querySelectorAll("[data-body-row]"),
    ).toHaveLength(10);
    expect(
      screen.getByTestId("cusps-list").querySelectorAll("li"),
    ).toHaveLength(12);
  });
});
