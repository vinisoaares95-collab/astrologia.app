import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PlaceSummary } from "@/features/places/types";

import { BirthDataForm } from "./birth-data-form";
import type { NormalizationResult } from "./contract";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const recife: PlaceSummary = {
  id: "ibge:2611606",
  name: "Recife",
  region: "Pernambuco",
  regionCode: "PE",
  country: "BR",
  countryName: "Brasil",
  label: "Recife — PE, Brasil",
  coordinates: { latitude: -8.0539, longitude: -34.8811 },
  timeZone: "America/Recife",
};

const searchPlacesAction = vi.fn();
vi.mock("@/features/places/actions", () => ({
  searchPlacesAction: (q: string) => searchPlacesAction(q),
  getPlaceAction: vi.fn(),
}));

const normalizeBirthAction = vi.fn();
vi.mock("./actions", () => ({
  normalizeBirthAction: (input: unknown) => normalizeBirthAction(input),
}));

const instant = (
  utc: string,
  offsetLabel: string,
  daylightSaving: boolean,
) => ({
  utc,
  epochMs: Date.parse(utc),
  offsetSeconds: offsetLabel === "UTC−02:00" ? -7200 : -10800,
  offsetLabel,
  daylightSaving,
});

const okResult: NormalizationResult = {
  status: "ok",
  birth: {
    place: { ...recife, timeZone: "America/Recife" },
    localDate: { year: 1986, month: 1, day: 15 },
    time: {
      precision: "exact",
      local: { hour: 14, minute: 30 },
      instant: instant("1986-01-15T16:30:00Z", "UTC−02:00", true),
    },
    warnings: [
      {
        code: "DAYLIGHT_SAVING",
        message: "Horário de verão vigente nesta data e local (UTC−02:00).",
      },
    ],
    provenance: { tzdbVersion: "2025b", placeSource: "IBGE" },
  },
};

async function fillAndSelect(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Data de nascimento"), "15011986");
  await user.type(screen.getByLabelText("Horário (24 h)"), "1430");
  await user.type(
    screen.getByRole("combobox", { name: "Cidade de nascimento" }),
    "Recife",
  );
  await user.click(
    await screen.findByRole("option", { name: /Recife/ }, { timeout: 3000 }),
  );
}

describe("BirthDataForm", () => {
  beforeEach(() => {
    push.mockClear();
    normalizeBirthAction.mockReset();
    searchPlacesAction
      .mockReset()
      .mockResolvedValue({ results: [recife], total: 1 });
  });

  it("mostra erros ao enviar vazio e exige selecionar a cidade", async () => {
    const user = userEvent.setup();
    render(<BirthDataForm />);
    await user.click(screen.getByRole("button", { name: /verificar dados/i }));

    expect(
      screen.getByText("Informe sua data de nascimento."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Selecione a cidade na lista de resultados."),
    ).toBeInTheDocument();
    expect(normalizeBirthAction).not.toHaveBeenCalled();
  });

  it("nunca seleciona a cidade sozinho, mesmo com um único resultado", async () => {
    const user = userEvent.setup();
    render(<BirthDataForm />);
    await user.type(
      screen.getByRole("combobox", { name: "Cidade de nascimento" }),
      "Recife",
    );
    expect(
      await screen.findByRole("option", { name: /Recife/ }, { timeout: 3000 }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("selected-place")).not.toBeInTheDocument();
  });

  it("normaliza, mostra a conferência e só então segue para a proposta", async () => {
    normalizeBirthAction.mockResolvedValue(okResult);
    const user = userEvent.setup();
    render(<BirthDataForm />);
    await fillAndSelect(user);
    expect(screen.getByTestId("selected-place")).toHaveTextContent(
      "Recife — PE, Brasil",
    );

    await user.click(screen.getByRole("button", { name: /verificar dados/i }));
    expect(normalizeBirthAction).toHaveBeenCalledWith({
      date: "15/01/1986",
      time: { precision: "exact", value: "14:30" },
      placeId: "ibge:2611606",
      occurrence: undefined,
    });
    const review = await screen.findByTestId("normalized-review");
    expect(review).toHaveTextContent("America/Recife");
    expect(review).toHaveTextContent("15/01/1986 16:30 UTC");
    expect(review).toHaveTextContent("UTC−02:00 (horário de verão)");
    expect(push).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: /confirmar e ver a proposta/i }),
    );
    expect(push).toHaveBeenCalledWith("/relatorio");
  });

  it("pede a escolha da ocorrência quando o horário se repetiu", async () => {
    normalizeBirthAction.mockResolvedValueOnce({
      status: "needs-choice",
      localTime: "14/03/1986 23:30",
      options: [
        {
          occurrence: "earlier",
          instant: instant("1986-03-15T01:30:00Z", "UTC−02:00", true),
          description:
            "Primeira ocorrência (UTC−02:00) — ainda no horário de verão",
        },
        {
          occurrence: "later",
          instant: instant("1986-03-15T02:30:00Z", "UTC−03:00", false),
          description: "Segunda ocorrência (UTC−03:00) — já no horário padrão",
        },
      ],
    });
    normalizeBirthAction.mockResolvedValueOnce(okResult);
    const user = userEvent.setup();
    render(<BirthDataForm />);
    await fillAndSelect(user);
    await user.click(screen.getByRole("button", { name: /verificar dados/i }));

    expect(await screen.findByText(/aconteceu duas vezes/)).toBeInTheDocument();
    // Sem escolha automática: as únicas ações são as duas ocorrências.
    expect(
      screen.queryByRole("button", { name: /verificar dados/i }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: /segunda ocorrência/i }),
    );
    await waitFor(() =>
      expect(normalizeBirthAction).toHaveBeenLastCalledWith(
        expect.objectContaining({ occurrence: "later" }),
      ),
    );
  });

  it("explica horário inexistente sem ajustá-lo", async () => {
    normalizeBirthAction.mockResolvedValue({
      status: "invalid",
      issues: [
        {
          field: "time",
          code: "TIME_NONEXISTENT",
          message: "Este horário não existiu nesta data e local.",
          suggestion: "01:30",
        },
      ],
    });
    const user = userEvent.setup();
    render(<BirthDataForm />);
    await fillAndSelect(user);
    await user.click(screen.getByRole("button", { name: /verificar dados/i }));

    expect(
      await screen.findByText("Este horário não existiu nesta data e local."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Horário (24 h)")).toHaveValue("14:30");
  });

  it("horário desconhecido dispensa o campo de hora", async () => {
    normalizeBirthAction.mockResolvedValue(okResult);
    const user = userEvent.setup();
    render(<BirthDataForm />);
    await user.click(screen.getByRole("radio", { name: "Não sei" }));
    expect(screen.queryByLabelText("Horário (24 h)")).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("Data de nascimento"), "15011986");
    await user.type(
      screen.getByRole("combobox", { name: "Cidade de nascimento" }),
      "Recife",
    );
    await user.click(
      await screen.findByRole("option", { name: /Recife/ }, { timeout: 3000 }),
    );
    await user.click(screen.getByRole("button", { name: /verificar dados/i }));
    expect(normalizeBirthAction).toHaveBeenCalledWith(
      expect.objectContaining({ time: { precision: "unknown" } }),
    );
  });
});
