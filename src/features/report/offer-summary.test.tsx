import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { mainProduct, orderBumps } from "@/content/catalog";

import { OfferSummary } from "./offer-summary";

describe("OfferSummary", () => {
  it("soma os complementos selecionados ao total", async () => {
    const user = userEvent.setup();
    render(<OfferSummary main={mainProduct} bumps={orderBumps} />);
    const total = screen.getByTestId("offer-total");

    expect(total).toHaveTextContent("R$ 39,90");
    await user.click(screen.getByLabelText(/Mapa do Amor/));
    expect(total).toHaveTextContent("R$ 54,80");
    await user.click(screen.getByLabelText(/Calendário Pessoal/));
    expect(total).toHaveTextContent("R$ 74,70");
    await user.click(screen.getByLabelText(/Mapa do Amor/));
    expect(total).toHaveTextContent("R$ 59,80");
  });

  it("mantém o pagamento desabilitado no protótipo", () => {
    render(<OfferSummary main={mainProduct} bumps={orderBumps} />);
    expect(
      screen.getByRole("button", { name: /pagamento em breve/i }),
    ).toBeDisabled();
  });
});
