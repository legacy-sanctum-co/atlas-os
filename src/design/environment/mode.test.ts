import { describe, expect, it } from "vitest";

import { BREAKPOINT_COMMAND_PX, BREAKPOINT_PORTABLE_PX, modeForWidth } from "./mode";

describe("modeForWidth", () => {
  it("maps the verification widths to the intended modes", () => {
    expect(modeForWidth(360)).toBe("compact"); // narrow mobile
    expect(modeForWidth(376)).toBe("compact"); // Fold cover
    expect(modeForWidth(840)).toBe("portable"); // Fold unfolded / tablet
    expect(modeForWidth(1366)).toBe("command"); // laptop
    expect(modeForWidth(1920)).toBe("command"); // wide desktop
  });

  it("is exact at the boundaries", () => {
    expect(modeForWidth(BREAKPOINT_PORTABLE_PX - 1)).toBe("compact");
    expect(modeForWidth(BREAKPOINT_PORTABLE_PX)).toBe("portable");
    expect(modeForWidth(BREAKPOINT_COMMAND_PX - 1)).toBe("portable");
    expect(modeForWidth(BREAKPOINT_COMMAND_PX)).toBe("command");
  });
});
