import type { StatKey } from '../stats/Stats';
import type { SaveDataV1 } from '../save/SaveData';

export interface StatTrack {
  key: string;
  statKey: StatKey;
  name: string;
  /** quanto cada nível soma ao stat (em pontos flat ou % conforme `unit`). */
  perLevel: number;
  unit: 'flat' | 'pct';
  maxLevel: number;
  /** costs[i] = essência para ir do nível i ao i+1. */
  costs: number[];
}

export const STAT_TRACKS: StatTrack[] = [
  { key: 'vitality', statKey: 'maxHp', name: 'Vitalidade', perLevel: 20, unit: 'flat', maxLevel: 5, costs: [20, 35, 55, 80, 120] },
  { key: 'might', statKey: 'might', name: 'Poder', perLevel: 6, unit: 'flat', maxLevel: 5, costs: [25, 45, 70, 100, 140] },
  { key: 'haste', statKey: 'cooldown', name: 'Presteza', perLevel: 5, unit: 'flat', maxLevel: 5, costs: [25, 45, 70, 100, 140] },
  { key: 'swiftness', statKey: 'moveSpeed', name: 'Rapidez', perLevel: 6, unit: 'flat', maxLevel: 5, costs: [20, 35, 55, 80, 120] },
  { key: 'regen', statKey: 'hpRegen', name: 'Regeneração', perLevel: 0.5, unit: 'flat', maxLevel: 5, costs: [30, 50, 75, 110, 150] },
  { key: 'greed', statKey: 'pickupRadius', name: 'Cobiça', perLevel: 12, unit: 'flat', maxLevel: 5, costs: [15, 25, 40, 60, 90] },
  { key: 'fortune', statKey: 'luck', name: 'Fortuna', perLevel: 5, unit: 'flat', maxLevel: 5, costs: [25, 45, 70, 100, 140] },
  { key: 'wisdom', statKey: 'xpGain', name: 'Sabedoria', perLevel: 8, unit: 'flat', maxLevel: 5, costs: [25, 45, 70, 100, 140] },
  { key: 'ward', statKey: 'armor', name: 'Salvaguarda', perLevel: 2, unit: 'flat', maxLevel: 5, costs: [25, 45, 70, 100, 140] },
  { key: 'swarm', statKey: 'amount', name: 'Multidão', perLevel: 1, unit: 'flat', maxLevel: 5, costs: [60, 90, 130, 180, 250] },
];

export function trackCost(track: StatTrack, currentLevel: number): number | null {
  return currentLevel >= track.maxLevel ? null : track.costs[currentLevel];
}

export function buyTrack(save: SaveDataV1, trackKey: string): { ok: boolean; save: SaveDataV1 } {
  const track = STAT_TRACKS.find((t) => t.key === trackKey);
  if (!track) return { ok: false, save };
  const cur = save.baseStats[trackKey] ?? 0;
  const cost = trackCost(track, cur);
  if (cost == null || save.essence < cost) return { ok: false, save };
  return {
    ok: true,
    save: {
      ...save,
      essence: save.essence - cost,
      baseStats: { ...save.baseStats, [trackKey]: cur + 1 },
    },
  };
}
