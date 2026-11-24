import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PlaceSummary } from "@/features/places/types";

import {
  JourneyProvider,
  useJourney,
} from "@/features/report/journey/journey-context";

import { BirthDataForm } from "./birth-data-form";
import type { NormalizationResult } from "./contract";
import { emptySkyBridge } from "@/features/report/journey-chapters/test-support";

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

const generateSkyChaptersAction = vi.hoisted(() => vi.fn());
vi.mock("@/features/report/journey/sky-actions", () => ({
  generateSkyChaptersAction: (input: unknown) =>
    generateSkyChaptersAction(input),
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

describe("aviso sobre os dados de nascimento (03G.3, 04C)", () => {
  it("diz para onde vão os dados, que não são gravados nem enviados a IA, e quanto tempo ficam", () => {
    const { unmount } = render(<BirthDataForm />);
    const notice = screen.getByText(/vão ao servidor do Sidera/i);
    expect(notice).toHaveTextContent(/localizar o lugar e verificar os dados/i);
    expect(notice).toHaveTextContent(
      /não grava esses dados nem os envia a outros serviços ou a provedores de inteligência artificial/i,
    );
    expect(notice).not.toHaveTextContent(/calcular o mapa/i);
    expect(notice).toHaveTextContent(
      /memória desta aba, até você sair da jornada, recarregar ou fechar a página/i,
    );
    // O Next.js preserva a rota escondida ao navegar: "somem quando você
    // sai" seria falso (verificado no navegador).
    expect(notice).not.toHaveTextContent(
      /ficam apenas nesta tela|quando você sai/i,
    );
    unmount();
    render(<BirthDataForm engineEnabled />);
    const internal = screen.getByText(/vão ao servidor do Sidera/i);
    expect(internal).toHaveTextContent(
      /verificar os dados e, ao confirmar, calcular o mapa/i,
    );
    expect(internal).toHaveTextContent(
      /só os capítulos do céu \(sem a data, a hora e o local\) seguem para o relatório/i,
    );
  });
});

describe("confirmação e capítulos do céu na jornada (04C)", () => {
  type SkyResult = Awaited<
    ReturnType<
      typeof import("@/features/report/journey/sky-actions").generateSkyChaptersAction
    >
  >;
  const report = {
    disclaimer: "Aviso do céu.",
    chapters: [
      {
        number: 1,
        title: "Sua identidade astrológica",
        introduction: "Introdução do céu.",
        sections: [{ text: "Seção do céu.", notes: [] }],
        synthesis: "Síntese do céu.",
        reflectionQuestions: [],
        limitations: [],
      },
    ],
  };
  let resolveAction: ((r: SkyResult) => void) | null = null;

  function SkyProbe() {
    const { sky } = useJourney();
    return <p data-testid="sky">{JSON.stringify(sky)}</p>;
  }
  const sky = () =>
    JSON.parse(screen.getByTestId("sky").textContent ?? "null") as {
      state: string;
      reason?: string;
      report?: unknown;
    } | null;

  async function confirmFlow(engineEnabled: boolean) {
    normalizeBirthAction.mockResolvedValue(okResult);
    const user = userEvent.setup();
    render(
      <JourneyProvider>
        <BirthDataForm engineEnabled={engineEnabled} />
        <SkyProbe />
      </JourneyProvider>,
    );
    await fillAndSelect(user);
    await user.click(screen.getByRole("button", { name: /verificar dados/i }));
    await screen.findByRole("button", { name: /confirmar e ver a proposta/i });
    return user;
  }

  beforeEach(() => {
    push.mockClear();
    normalizeBirthAction.mockReset();
    generateSkyChaptersAction.mockReset();
    generateSkyChaptersAction.mockImplementation(
      () => new Promise<SkyResult>((r) => (resolveAction = r)),
    );
    searchPlacesAction
      .mockReset()
      .mockResolvedValue({ results: [recife], total: 1 });
  });

  it("só depois da confirmação; uma geração por envio; segue para a proposta com 'carregando'", async () => {
    const user = await confirmFlow(true);
    expect(generateSkyChaptersAction).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole("button", { name: /confirmar e ver a proposta/i }),
    );
    expect(generateSkyChaptersAction).toHaveBeenCalledTimes(1);
    expect(generateSkyChaptersAction).toHaveBeenCalledWith(
      expect.objectContaining({ date: "15/01/1986", placeId: "ibge:2611606" }),
    );
    expect(push).toHaveBeenCalledWith("/relatorio");
    expect(sky()).toEqual({ state: "loading" });
    // Envio duplicado durante o cálculo: botão desabilitado, nada novo.
    expect(
      screen.getByRole("button", { name: /calculando o mapa/i }),
    ).toBeDisabled();
    await act(async () =>
      resolveAction!({ status: "ok", report, bridge: emptySkyBridge() }),
    );
    expect(sky()).toEqual({ state: "ready", report, bridge: emptySkyBridge() });
    // O mesmo envio confirmado de novo não gera de novo.
    await user.click(
      screen.getByRole("button", { name: /confirmar e ver a proposta/i }),
    );
    expect(generateSkyChaptersAction).toHaveBeenCalledTimes(1);
  });

  it("motor desligado: indisponível com o motivo, sem chamar o servidor", async () => {
    const user = await confirmFlow(false);
    await user.click(
      screen.getByRole("button", { name: /confirmar e ver a proposta/i }),
    );
    expect(generateSkyChaptersAction).not.toHaveBeenCalled();
    expect(sky()).toMatchObject({
      state: "unavailable",
      reason: expect.stringMatching(/não é calculado neste ambiente/),
    });
  });

  it("erro do motor ou da rede: indisponível com o motivo, nunca conteúdo fictício", async () => {
    const user = await confirmFlow(true);
    await user.click(
      screen.getByRole("button", { name: /confirmar e ver a proposta/i }),
    );
    await act(async () =>
      resolveAction!({ status: "engine-error", message: "Motivo amigável." }),
    );
    expect(sky()).toEqual({ state: "unavailable", reason: "Motivo amigável." });
  });

  it("dados alterados depois da confirmação: novo envio; a resposta antiga atrasada é ignorada", async () => {
    const user = await confirmFlow(true);
    await user.click(
      screen.getByRole("button", { name: /confirmar e ver a proposta/i }),
    );
    const first = resolveAction!;
    await act(async () => first({ status: "engine-error", message: "x" }));
    // Corrige o horário e confirma de novo.
    await user.click(screen.getByRole("button", { name: /corrigir dados/i }));
    const time = screen.getByLabelText("Horário (24 h)");
    await user.clear(time);
    await user.type(time, "0915");
    await user.click(screen.getByRole("button", { name: /verificar dados/i }));
    await screen.findByRole("button", { name: /confirmar e ver a proposta/i });
    await user.click(
      screen.getByRole("button", { name: /confirmar e ver a proposta/i }),
    );
    expect(generateSkyChaptersAction).toHaveBeenCalledTimes(2);
    const second = resolveAction!;
    await act(async () =>
      second({ status: "ok", report, bridge: emptySkyBridge() }),
    );
    // Uma resposta tardia do primeiro envio não sobrescreve o segundo.
    await act(async () => first({ status: "engine-error", message: "tarde" }));
    expect(sky()).toEqual({ state: "ready", report, bridge: emptySkyBridge() });
  });
});
