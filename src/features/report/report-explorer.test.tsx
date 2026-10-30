import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { reportParts } from "@/content/report-chapters";

import { ReportExplorer } from "./report-explorer";

describe("ReportExplorer", () => {
  it("alterna os capítulos exibidos ao trocar de aba", async () => {
    const user = userEvent.setup();
    render(<ReportExplorer parts={reportParts} />);

    expect(screen.getByRole("tab", { name: /Seu Céu/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Sua identidade astrológica")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /Suas Mãos/ }));
    expect(screen.getByRole("tab", { name: /Suas Mãos/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(
      screen.getByText("As linhas principais e seus significados"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Sua identidade astrológica"),
    ).not.toBeInTheDocument();
  });
});

describe("ReportExplorer — teclado", () => {
  it("navega entre as abas com as setas e Home/End", async () => {
    const user = userEvent.setup();
    render(<ReportExplorer parts={reportParts} />);
    const [sky, hands, journey] = screen.getAllByRole("tab");

    expect(sky).toHaveAttribute("tabindex", "0");
    expect(hands).toHaveAttribute("tabindex", "-1");

    sky.focus();
    await user.keyboard("{ArrowRight}");
    expect(hands).toHaveFocus();
    expect(hands).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{End}");
    expect(journey).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(sky).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(journey).toHaveFocus();
    await user.keyboard("{Home}");
    expect(sky).toHaveAttribute("aria-selected", "true");
  });
});
