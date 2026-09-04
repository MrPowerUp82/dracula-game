import type { SaveDataV1 } from '../save/SaveData';

export function essenceForRun(kills: number, victory: boolean): number {
  const raw = 20 + kills * 0.6;
  const cap = victory ? 220 : 140;
  return Math.floor(Math.min(raw, cap) * (victory ? 1 : 0.4));
}

export interface RunResult {
  memoryId: string;
  kills: number;
  victory: boolean;
  rewardPowerId?: string;
}

export function applyRunResult(save: SaveDataV1, r: RunResult): SaveDataV1 {
  const essence = save.essence + essenceForRun(r.kills, r.victory);

  const memoriesCleared =
    r.victory && !save.memoriesCleared.includes(r.memoryId)
      ? [...save.memoriesCleared, r.memoryId]
      : save.memoriesCleared;

  const permanentPowers =
    r.victory && r.rewardPowerId && !save.permanentPowers.includes(r.rewardPowerId)
      ? [...save.permanentPowers, r.rewardPowerId]
      : save.permanentPowers;

  return {
    ...save,
    essence,
    memoriesCleared,
    permanentPowers,
    stats: {
      ...save.stats,
      runs: save.stats.runs + 1,
      kills: save.stats.kills + r.kills,
    },
  };
}
