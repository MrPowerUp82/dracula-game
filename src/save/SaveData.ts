export const CURRENT_SAVE_VERSION = 1;

export interface SaveDataV1 {
  version: 1;
  essence: number;
  /** chave da trilha -> nível comprado (0..maxLevel). */
  baseStats: Record<string, number>;
  /** ids de poder que podem ser sorteados numa run. */
  unlockedPowers: string[];
  memoriesCleared: string[];
  /** ids de poder que começam equipados em toda run. */
  permanentPowers: string[];
  coffinRevives: number;
  settings: {
    screenShake: boolean;
    damageNumbers: boolean;
    lang: string;
    volumeMusic: number;
    volumeSfx: number;
  };
  stats: {
    runs: number;
    kills: number;
    bestTimeByMemory: Record<string, number>;
  };
}

export function defaultSave(): SaveDataV1 {
  return {
    version: 1,
    essence: 0,
    baseStats: {},
    unlockedPowers: ['bat-swarm'],
    memoriesCleared: [],
    permanentPowers: [],
    coffinRevives: 0,
    settings: {
      screenShake: true,
      damageNumbers: true,
      lang: 'pt',
      volumeMusic: 0.7,
      volumeSfx: 0.8,
    },
    stats: { runs: 0, kills: 0, bestTimeByMemory: {} },
  };
}
