import type { SaveDataV1 } from '../save/SaveData';

export function coffinCost(save: SaveDataV1): number {
  return 120 * (save.coffinRevives + 1);
}

export function buyRevive(save: SaveDataV1): { ok: boolean; save: SaveDataV1 } {
  const cost = coffinCost(save);
  if (save.essence < cost) return { ok: false, save };
  return { ok: true, save: { ...save, essence: save.essence - cost, coffinRevives: save.coffinRevives + 1 } };
}
