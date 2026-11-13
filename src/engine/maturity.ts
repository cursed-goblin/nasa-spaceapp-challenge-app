import type { CompatibilityReport, DesignState, SimulationResult } from "../data/types";
import { getObjective, missingCategories, resolveSelection } from "./design";

export interface ConceptMaturity {
  level: 1 | 2 | 3 | 4;
  label: string;
  short: string;
  description: string;
  framework: string;
}

const LEVELS: Record<number, Omit<ConceptMaturity, "level">> = {
  1: {
    label: "Cocktail napkin",
    short: "CML 1",
    description:
      "Science questions articulated, observations proposed, and a rudimentary mission concept sketched.",
    framework: "JPL Concept Maturity Level 1",
  },
  2: {
    label: "Initial feasibility",
    short: "CML 2",
    description:
      "The concept has been expanded and questioned for science, technical and programmatic feasibility. First-order mass, power and data calculations exist.",
    framework: "JPL Concept Maturity Level 2",
  },
  3: {
    label: "Trade space",
    short: "CML 3",
    description:
      "Architectural trades between spacecraft, orbit, launch and ground segment have been explored and the design closes on paper.",
    framework: "JPL Concept Maturity Level 3",
  },
  4: {
    label: "Point design",
    short: "CML 4",
    description:
      "A specific design has been selected, simulated end-to-end and shown to meet the science objective with acceptable margins.",
    framework: "JPL Concept Maturity Level 4",
  },
};

/**
 * A game adaptation of JPL's CML 1–4 framework. This is illustrative, not an
 * official NASA assessment. Source: Wessen et al., "Space Mission Concept
 * Development Using Concept Maturity Levels", IEEE Aerospace 2013.
 */
export function conceptMaturity(
  design: DesignState,
  compatibility: CompatibilityReport,
  simulation?: SimulationResult | null,
): ConceptMaturity {
  const objective = getObjective(design.objectiveId);
  if (!objective) {
    return { level: 1, ...LEVELS[1] };
  }

  const systems = resolveSelection(design.selection);
  const complete =
    missingCategories(systems).length === 0 &&
    systems.instruments.length > 0 &&
    Boolean(design.orbitId) &&
    Boolean(design.launchVehicleId);

  if (!complete) {
    return { level: 1, ...LEVELS[1] };
  }

  if (simulation?.success && compatibility.passed) {
    return { level: 4, ...LEVELS[4] };
  }

  if (compatibility.passed) {
    return { level: 3, ...LEVELS[3] };
  }

  return { level: 2, ...LEVELS[2] };
}
