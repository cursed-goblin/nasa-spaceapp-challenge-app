import { MEASUREMENTS } from "../../data/measurements";
import type { SpacecraftComponent } from "../../data/types";
import { effectivePowerGen } from "../../engine/design";
import {
  fmtArcsec,
  fmtDataRate,
  fmtEnergy,
  fmtMass,
  fmtMonths,
  fmtMusd,
  fmtPower,
} from "../../engine/format";
import {
  isAdcs,
  isBattery,
  isComms,
  isComputer,
  isInstrument,
  isPower,
  isStructure,
} from "../../data/components";

export interface SpecRow {
  label: string;
  value: string;
}

export function componentSpecs(component: SpacecraftComponent, bodyId: string): SpecRow[] {
  if (isStructure(component)) {
    return [
      { label: "Bus envelope", value: `${component.diameterM.toFixed(1)} × ${component.heightM.toFixed(1)} m` },
      { label: "Instrument slots", value: `${component.instrumentSlots}` },
      { label: "Qualified life", value: fmtMonths(component.lifetimeMonths) },
    ];
  }
  if (isPower(component)) {
    return [
      {
        label: component.kind === "solar" ? "Generation at target" : "Constant generation",
        value: fmtPower(effectivePowerGen(component, bodyId)),
      },
      { label: "Type", value: component.kind === "solar" ? "Photovoltaic" : "Radioisotope" },
      { label: "Degradation", value: `${(component.degradationPerYear * 100).toFixed(1)}%/yr` },
    ];
  }
  if (isBattery(component)) {
    return [
      { label: "Rated capacity", value: fmtEnergy(component.capacityWh) },
      { label: "Usable energy", value: fmtEnergy(component.capacityWh * component.depthOfDischarge) },
      { label: "Depth of discharge", value: `${(component.depthOfDischarge * 100).toFixed(0)}%` },
    ];
  }
  if (isComms(component)) {
    return [
      { label: "Downlink", value: `${component.downlinkMbps.toFixed(2)} Mbps` },
      { label: "Band", value: component.band },
      { label: "Aperture", value: `${component.antennaDiameterM.toFixed(1)} m` },
    ];
  }
  if (isComputer(component)) {
    return [
      { label: "Data storage", value: `${component.storageGb} GB` },
      { label: "Autonomy", value: `${component.autonomy} / 5` },
      { label: "Science efficiency", value: `×${component.scienceEfficiency.toFixed(2)}` },
    ];
  }
  if (isAdcs(component)) {
    return [
      { label: "Pointing", value: fmtArcsec(component.pointingArcsec) },
      { label: "Delta-v reserve", value: `${component.deltaVms} m/s` },
      { label: "Qualified life", value: fmtMonths(component.lifetimeMonths) },
    ];
  }
  if (isInstrument(component)) {
    return [
      { label: "Science yield", value: `${component.sciencePerDay} pts/day` },
      { label: "Data rate", value: fmtDataRate(component.dataGbPerDay) },
      { label: "Pointing", value: fmtArcsec(component.pointingArcsec) },
      {
        label: "Measurements",
        value: component.measurements.map((tag) => MEASUREMENTS[tag].short).join(" · "),
      },
    ];
  }
  return [];
}

export function componentVitals(component: SpacecraftComponent): SpecRow[] {
  return [
    { label: "Mass", value: fmtMass(component.massKg) },
    { label: "Cost", value: fmtMusd(component.costMusd) },
    { label: "Power", value: component.powerW > 0 ? fmtPower(component.powerW) : "Passive" },
  ];
}
