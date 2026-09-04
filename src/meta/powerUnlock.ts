import type { SaveDataV1 } from '../save/SaveData';
import { BASE_DRAFT_POOL } from '../data/powers';

export const POWER_UNLOCK_COST = 70;

export function lockedPowers(save: SaveDataV1): string[] {
  return BASE_DRAFT_POOL.filter((id) => !save.unlockedPowers.includes(id));
}

export function unlockPower(save: SaveDataV1, id: string): { ok: boolean; save: SaveDataV1 } {
  if (!BASE_DRAFT_POOL.includes(id) || save.unlockedPowers.includes(id) || save.essence < POWER_UNLOCK_COST) {
    return { ok: false, save };
  }
  return {
    ok: true,
    save: {
      ...save,
      essence: save.essence - POWER_UNLOCK_COST,
      unlockedPowers: [...save.unlockedPowers, id],
    },
  };
}
