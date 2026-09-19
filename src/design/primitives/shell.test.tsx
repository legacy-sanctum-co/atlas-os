import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Dock, Pane, Rail, Shell } from "./shell";

describe("Shell", () => {
  it("renders all slots with landmarks and the has-side flag", () => {
    render(
      <Shell rail={<Rail>rail</Rail>} side={<div>side</div>} dock={<Dock>dock</Dock>}>
        <Pane>main</Pane>
      </Shell>,
    );
    expect(screen.getByRole("main")).toHaveTextContent("main");
    expect(screen.getByLabelText("Environment rail")).toHaveTextContent("rail");
    expect(screen.getByLabelText("Context")).toHaveTextContent("side");
    expect(screen.getByLabelText("Command dock")).toHaveTextContent("dock");
    expect(screen.getByRole("main").parentElement).toHaveAttribute("data-has-side", "true");
  });

  it("omits optional slots and flags no side pane", () => {
    render(
      <Shell>
        <Pane reading>only</Pane>
      </Shell>,
    );
    expect(screen.queryByLabelText("Context")).toBeNull();
    expect(screen.queryByLabelText("Command dock")).toBeNull();
    expect(screen.getByRole("main").parentElement).toHaveAttribute("data-has-side", "false");
  });
});
