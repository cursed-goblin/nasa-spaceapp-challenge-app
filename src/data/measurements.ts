import type { MeasurementTag } from "./types";

export const MEASUREMENTS: Record<
  MeasurementTag,
  { label: string; short: string; description: string }
> = {
  imaging: {
    label: "Surface imaging",
    short: "IMG",
    description: "Visible and near-infrared imaging of landforms, clouds and change over time.",
  },
  subsurface: {
    label: "Subsurface structure",
    short: "SUB",
    description: "Radar or neutron sensing of what lies beneath the visible surface.",
  },
  composition: {
    label: "Bulk composition",
    short: "CMP",
    description: "Elemental and molecular makeup of gases, aerosols or regolith.",
  },
  mineralogy: {
    label: "Mineralogy",
    short: "MIN",
    description: "Spectral identification of minerals and hydrated phases.",
  },
  fields: {
    label: "Magnetic fields",
    short: "MAG",
    description: "Vector magnetic field structure and space-weather context.",
  },
  geophysics: {
    label: "Interior geophysics",
    short: "GEO",
    description: "Seismic and tidal signals that reveal a body's interior.",
  },
  water: {
    label: "Water / hydrogen",
    short: "H₂O",
    description: "Direct or indirect detection of water ice and hydrogen-bearing material.",
  },
  biosignature: {
    label: "Biosignatures",
    short: "BIO",
    description: "Chemical or morphological evidence of past or present life.",
  },
  atmosphere: {
    label: "Atmosphere & climate",
    short: "ATM",
    description: "Vertical structure, composition, clouds and energy balance of an atmosphere.",
  },
};
