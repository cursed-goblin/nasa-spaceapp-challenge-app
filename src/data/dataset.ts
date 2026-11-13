import type { DatasetMeta } from "./types";

/**
 * Every dataset in this build is provisional. The official NASA Space Apps
 * resource pack is integrated through resources/manifest.json and the mapping
 * documented in docs/RESOURCE-INTEGRATION.md.
 */
export const DATASET: DatasetMeta = {
  version: "0.3.0",
  status: "provisional",
  updated: "2026-11-13",
  summary:
    "Gameplay-balanced reference data compiled from public mission literature. Values are rounded for play and are not flight-qualified.",
  pendingSources: [
    "NASA Space Apps 2026 challenge resource pack",
    "Official component mass / power / cost reference tables",
    "Launch vehicle performance and fairing envelopes",
    "Target-body science priorities and measurement requirements",
    "NASA imagery and branding usage guidance",
  ],
};

export const DATA_STATUS_LABEL = "Provisional dataset · v0.3.0";
