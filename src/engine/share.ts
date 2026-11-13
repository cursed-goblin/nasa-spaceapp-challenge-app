import { COMPONENTS_BY_ID } from "../data/components";
import { DIFFICULTY_BY_ID } from "../data/difficulties";
import { LAUNCH_VEHICLES_BY_ID } from "../data/launchVehicles";
import { OBJECTIVES_BY_ID } from "../data/objectives";
import { ORBITS_BY_ID } from "../data/orbits";
import type { DesignState, DifficultyId, Selection } from "../data/types";

const SHARE_VERSION = 1;

interface SharedDesign {
  v: number;
  o: string;
  d: DifficultyId;
  c: {
    structure?: string;
    power?: string;
    battery?: string;
    comms?: string;
    computer?: string;
    adcs?: string;
    instruments: string[];
  };
  orb?: string;
  lv?: string;
}

export function encodeDesign(design: DesignState): string {
  const payload: SharedDesign = {
    v: SHARE_VERSION,
    o: design.objectiveId,
    d: design.difficulty,
    c: {
      structure: design.selection.structure,
      power: design.selection.power,
      battery: design.selection.battery,
      comms: design.selection.comms,
      computer: design.selection.computer,
      adcs: design.selection.adcs,
      instruments: [...design.selection.instruments],
    },
    orb: design.orbitId,
    lv: design.launchVehicleId,
  };
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/u, "");
}

export function decodeDesign(encoded: string): DesignState | null {
  try {
    const normalized = encoded.replaceAll("-", "+").replaceAll("_", "/");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const payload = JSON.parse(json) as Partial<SharedDesign>;
    if (
      payload.v !== SHARE_VERSION ||
      typeof payload.o !== "string" ||
      !OBJECTIVES_BY_ID[payload.o] ||
      typeof payload.d !== "string" ||
      !(payload.d in DIFFICULTY_BY_ID)
    ) {
      return null;
    }
    const rawSelection = payload.c;
    if (!rawSelection || !Array.isArray(rawSelection.instruments)) return null;

    const selection: Selection = {
      structure: validComponent(rawSelection.structure, "structure"),
      power: validComponent(rawSelection.power, "power"),
      battery: validComponent(rawSelection.battery, "battery"),
      comms: validComponent(rawSelection.comms, "comms"),
      computer: validComponent(rawSelection.computer, "computer"),
      adcs: validComponent(rawSelection.adcs, "adcs"),
      instruments: rawSelection.instruments.filter(
        (id): id is string =>
          typeof id === "string" &&
          COMPONENTS_BY_ID[id]?.category === "instruments",
      ),
    };

    return {
      objectiveId: payload.o,
      difficulty: payload.d as DifficultyId,
      selection,
      orbitId:
        typeof payload.orb === "string" && ORBITS_BY_ID[payload.orb]
          ? payload.orb
          : undefined,
      launchVehicleId:
        typeof payload.lv === "string" && LAUNCH_VEHICLES_BY_ID[payload.lv]
          ? payload.lv
          : undefined,
    };
  } catch {
    return null;
  }
}

function validComponent(
  id: unknown,
  category: string,
): string | undefined {
  return typeof id === "string" && COMPONENTS_BY_ID[id]?.category === category
    ? id
    : undefined;
}

export function buildShareUrl(design: DesignState): string {
  const encoded = encodeDesign(design);
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#/design/${encoded}`;
}

export function readShareHash(hash: string): DesignState | null {
  const prefix = "#/design/";
  if (!hash.startsWith(prefix)) return null;
  return decodeDesign(hash.slice(prefix.length));
}
