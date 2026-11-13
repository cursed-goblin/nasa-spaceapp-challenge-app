import type { DesignState } from "../data/types";

/**
 * A known-good medium-difficulty Earth observation design used by the engine
 * tests. Keeping the fixture in one place makes it obvious when a balance tweak
 * changes the reference mission.
 */
export const VALID_DESIGN: DesignState = {
  objectiveId: "obj-earth-climate",
  difficulty: "medium",
  selection: {
    structure: "structure-explorer",
    power: "power-solar-hep",
    battery: "battery-modular",
    comms: "comms-xband",
    computer: "computer-advanced",
    adcs: "adcs-reaction",
    instruments: ["inst-camera", "inst-mass-spec"],
  },
  orbitId: "earth-sso",
  launchVehicleId: "lv-falcon9",
};

export function cloneValidDesign(): DesignState {
  return {
    ...VALID_DESIGN,
    selection: {
      ...VALID_DESIGN.selection,
      instruments: [...VALID_DESIGN.selection.instruments],
    },
  };
}
