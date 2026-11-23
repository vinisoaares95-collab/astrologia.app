import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HowItWorksPage from "./page";

describe("FAQ de /como-funciona (03G.3)", () => {
  it("descreve o envio real da foto, sem prometer retenção zero", () => {
    render(<HowItWorksPage />);
    const answer = screen.getByText(
      /só sai do seu aparelho depois que você autoriza/i,
    );
    expect(answer).toHaveTextContent(/servidor do Sidera e à Anthropic/i);
    expect(answer).toHaveTextContent(/não grava a foto/i);
    expect(answer).toHaveTextContent(/até 10 minutos/i);
    expect(answer).toHaveTextContent(/até 30 dias, com exceções/i);
    expect(answer).toHaveTextContent(
      /certas chamadas não retêm conteúdo por padrão/i,
    );
    expect(answer).toHaveTextContent(
      /conta do Sidera ainda está sendo confirmad/i,
    );
    expect(answer).not.toHaveTextContent(
      /apenas no seu navegador|retenção zero|exclusão imediata|2 anos/i,
    );
  });
});
