import { describe, expect, it, vi } from "vitest";
import {
  getSafeClientRedirectPath,
  getSafeServerRedirectUrl,
} from "@/lib/redirects";

describe("redirect helpers", () => {
  it("allows relative client callback URLs", () => {
    expect(getSafeClientRedirectPath("/trips/abc")).toBe("/trips/abc");
  });

  it("falls back for external client callback URLs", () => {
    vi.stubGlobal("window", {
      location: {
        origin: "https://travelplanner.example",
      },
    });

    expect(getSafeClientRedirectPath("https://evil.example/phish")).toBe(
      "/dashboard"
    );

    vi.unstubAllGlobals();
  });

  it("allows same-origin absolute client callback URLs", () => {
    vi.stubGlobal("window", {
      location: {
        origin: "https://travelplanner.example",
      },
    });

    expect(
      getSafeClientRedirectPath(
        "https://travelplanner.example/trips/abc?tab=ideas#members"
      )
    ).toBe("/trips/abc?tab=ideas#members");

    vi.unstubAllGlobals();
  });

  it("allows relative server redirect URLs", () => {
    expect(
      getSafeServerRedirectUrl("/dashboard", "https://travelplanner.example")
    ).toBe("/dashboard");
  });

  it("falls back for external server redirect URLs", () => {
    expect(
      getSafeServerRedirectUrl(
        "https://evil.example/phish",
        "https://travelplanner.example"
      )
    ).toBe("https://travelplanner.example");
  });
});