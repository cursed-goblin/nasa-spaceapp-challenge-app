import { describe, expect, it } from "vitest";
import { cloneValidDesign, VALID_DESIGN } from "../test/fixtures";
import { decodeDesign, encodeDesign } from "./share";

describe("design share codec", () => {
  it("round-trips a complete design", () => {
    const encoded = encodeDesign(VALID_DESIGN);
    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(encoded).not.toContain("=");
    expect(decodeDesign(encoded)).toEqual(VALID_DESIGN);
  });

  it("preserves a partially assembled design", () => {
    const partial = cloneValidDesign();
    partial.selection.power = undefined;
    partial.selection.instruments = ["inst-camera"];
    partial.orbitId = undefined;
    partial.launchVehicleId = undefined;

    expect(decodeDesign(encodeDesign(partial))).toEqual(partial);
  });

  it("rejects malformed or incompatible payloads", () => {
    expect(decodeDesign("not-a-design")).toBeNull();
    expect(decodeDesign("")).toBeNull();

    const encoded = encodeDesign(VALID_DESIGN);
    const corrupted = encoded.slice(0, -2);
    expect(decodeDesign(corrupted)).toBeNull();
  });

  it("drops unknown component IDs instead of trusting the link", () => {
    const encoded = encodeDesign(VALID_DESIGN);
    const payload = JSON.parse(
      Buffer.from(encoded.replaceAll("-", "+").replaceAll("_", "/"), "base64").toString(
        "utf8",
      ),
    ) as { c: Record<string, unknown> };
    payload.c.structure = "structure-not-real";
    payload.c.instruments = ["inst-camera", "inst-not-real"];
    const tampered = Buffer.from(JSON.stringify(payload))
      .toString("base64")
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replace(/=+$/u, "");

    const decoded = decodeDesign(tampered);
    expect(decoded).not.toBeNull();
    expect(decoded?.selection.structure).toBeUndefined();
    expect(decoded?.selection.instruments).toEqual(["inst-camera"]);
  });
});
