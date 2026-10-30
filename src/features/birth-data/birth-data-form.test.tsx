import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { BirthDataForm } from "./birth-data-form";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

describe("BirthDataForm", () => {
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
});
