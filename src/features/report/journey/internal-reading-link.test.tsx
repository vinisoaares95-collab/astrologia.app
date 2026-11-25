import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => ({ connection: async () => {} }));

import { routes } from "@/config/routes";

import { InternalReadingLink } from "./internal-reading-link";

describe("InternalReadingLink (versão interna)", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("com a leitura interna: leva à leitura e aos dados de nascimento (sem foto)", async () => {
    vi.stubEnv("SIDERA_REPORT_READING", "1");
    render(await InternalReadingLink());
    expect(
      screen.getByRole("link", { name: "Abrir a leitura desta jornada" }),
    ).toHaveAttribute("href", routes.reportReading);
    expect(
      screen.getByRole("link", { name: "informar os dados de nascimento" }),
    ).toHaveAttribute("href", routes.birthData);
  });

  it("sem a variável: nada aparece", async () => {
    vi.stubEnv("SIDERA_REPORT_READING", "");
    vi.stubEnv("SIDERA_REPORT_DEMO", "");
    expect(await InternalReadingLink()).toBeNull();
  });
});
