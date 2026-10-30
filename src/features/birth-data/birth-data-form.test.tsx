import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BirthDataForm } from "./birth-data-form";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

describe("BirthDataForm", () => {
  beforeEach(() => push.mockClear());

  it("mostra erros ao enviar vazio e limpa o erro ao editar o campo", async () => {
    const user = userEvent.setup();
    render(<BirthDataForm />);
    await user.click(screen.getByRole("button", { name: /ver a proposta/i }));

    expect(
      screen.getByText("Informe a cidade onde você nasceu."),
    ).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("Cidade de nascimento"), "Recife");
    expect(
      screen.queryByText("Informe a cidade onde você nasceu."),
    ).not.toBeInTheDocument();
  });

  it("formata data e hora no padrão brasileiro e segue para o relatório", async () => {
    const user = userEvent.setup();
    render(<BirthDataForm />);
    const date = screen.getByLabelText("Data de nascimento");
    const time = screen.getByLabelText("Horário (24 h)");

    await user.type(date, "14031992");
    await user.type(time, "2145");
    expect(date).toHaveValue("14/03/1992");
    expect(time).toHaveValue("21:45");

    await user.type(
      screen.getByLabelText("Cidade de nascimento"),
      "Recife, PE",
    );
    await user.click(screen.getByRole("button", { name: /ver a proposta/i }));
    expect(push).toHaveBeenCalledWith("/relatorio");
  });
});
