import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PhotoGuide } from "./photo-guide";

describe("PhotoGuide (03G.3)", () => {
  it("orienta a fotografar só a palma, sem rosto, pessoas ou objetos pessoais", () => {
    render(<PhotoGuide />);
    expect(
      screen.getByText(
        /só a palma: deixe fora da foto o rosto, outras pessoas, documentos, cartões, telas e outros objetos pessoais/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Rosto ou outras pessoas")).toBeInTheDocument();
    expect(screen.getByText("Documentos e telas")).toBeInTheDocument();
    expect(screen.getByText(/fundo liso/i)).toBeInTheDocument();
    expect(screen.getByText(/luz natural, sem reflexos/i)).toBeInTheDocument();
    expect(
      screen.getByText(/do pulso às pontas dos dedos/i),
    ).toBeInTheDocument();
  });
});
