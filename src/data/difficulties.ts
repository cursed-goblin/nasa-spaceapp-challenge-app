import type { DifficultySpec } from "./types";

export const DIFFICULTIES: DifficultySpec[] = [
  {
    id: "easy",
    label: "Easy",
    tagline: "Room to breathe",
    description:
      "A generous budget, soft margins and full hints. Learn the trade-offs before the margins bite.",
    budgetMultiplier: 1.35,
    advancedCostMultiplier: 1,
    powerMargin: 0.15,
    dataMargin: 0.1,
    scienceTargetMultiplier: 0.85,
    scoreMultiplier: 0.8,
    ranked: true,
    hintLevel: "full",
  },
  {
    id: "medium",
    label: "Medium",
    tagline: "The real design loop",
    description:
      "Standard margins and a fixed budget. Every subsystem has to earn its mass and its dollars.",
    budgetMultiplier: 1,
    advancedCostMultiplier: 1,
    powerMargin: 0.2,
    dataMargin: 0.15,
    scienceTargetMultiplier: 1,
    scoreMultiplier: 1,
    ranked: true,
    hintLevel: "standard",
  },
  {
    id: "hard",
    label: "Hard",
    tagline: "Margins are a luxury",
    description:
      "A tight budget, advanced hardware at a premium, strict margins and almost no hints. Fly like a programme manager.",
    budgetMultiplier: 0.8,
    advancedCostMultiplier: 1.5,
    powerMargin: 0.3,
    dataMargin: 0.25,
    scienceTargetMultiplier: 1.1,
    scoreMultiplier: 1.35,
    ranked: true,
    hintLevel: "minimal",
  },
  {
    id: "sandbox",
    label: "Sandbox",
    tagline: "Break the laws, keep the physics",
    description:
      "Unlimited budget and no hard constraints. Fly anything and inspect the consequences, but you are off the leaderboard.",
    budgetMultiplier: Number.POSITIVE_INFINITY,
    advancedCostMultiplier: 1,
    powerMargin: 0,
    dataMargin: 0,
    scienceTargetMultiplier: 0.35,
    scoreMultiplier: 0,
    ranked: false,
    hintLevel: "full",
  },
];

export const DIFFICULTY_BY_ID = Object.fromEntries(
  DIFFICULTIES.map((difficulty) => [difficulty.id, difficulty]),
) as Record<DifficultySpec["id"], DifficultySpec>;
