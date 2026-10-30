import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { Switch } from "./switch";

function Harness() {
  const [on, setOn] = useState(false);
  return (
    <Switch label="Não sei o horário exato" checked={on} onChange={setOn} />
  );
}

describe("Switch", () => {
  it("expõe papel de switch e alterna o estado", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const toggle = screen.getByRole("switch", {
      name: "Não sei o horário exato",
    });
    expect(toggle).not.toBeChecked();
    await user.click(toggle);
    expect(toggle).toBeChecked();
  });
});
