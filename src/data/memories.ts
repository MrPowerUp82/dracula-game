import type { EnemyArchetype } from './enemies';
import type { SaveDataV1 } from '../save/SaveData';

export interface SpawnPhase {
  tSec: number;
  budget: number;
  pool: EnemyArchetype[];
  /** Cadência desta etapa; reduz gradualmente sem depender só de HP. */
  spawnIntervalMs?: number;
  eliteChance?: number;
  scaling?: { hp: number; damage: number; speed: number };
}

export interface MemoryDef {
  id: string;
  name: string;
  durationSec: number;
  bossId: string;
  bossTimeSec: number;
  rewardPowerId?: string;
  timeline: SpawnPhase[];
}

export const MEMORIES: MemoryDef[] = [
  {
    id: 'm1', name: 'O Despertar', durationSec: 480,
    bossId: 'profaner-knight', bossTimeSec: 420, rewardPowerId: 'mist-form',
    timeline: [
      { tSec: 0, budget: 4, pool: ['crawler'], spawnIntervalMs: 420, scaling: { hp: 1, damage: 1, speed: 1 } },
      { tSec: 70, budget: 10, pool: ['crawler', 'runner', 'flyer'], spawnIntervalMs: 300, scaling: { hp: 1, damage: 1, speed: 1 } },
      { tSec: 180, budget: 18, pool: ['crawler', 'runner', 'flyer', 'brute'], spawnIntervalMs: 220, eliteChance: 0.03, scaling: { hp: 1.08, damage: 1.05, speed: 1.02 } },
      { tSec: 310, budget: 28, pool: ['crawler', 'runner', 'brute', 'flyer'], spawnIntervalMs: 160, eliteChance: 0.07, scaling: { hp: 1.15, damage: 1.1, speed: 1.04 } },
    ],
  },
  {
    id: 'm2', name: 'A Fogueira', durationSec: 510,
    bossId: 'grand-inquisitor', bossTimeSec: 450, rewardPowerId: 'blood-rain',
    timeline: [
      { tSec: 0, budget: 6, pool: ['crawler', 'runner'], spawnIntervalMs: 360, scaling: { hp: 1.05, damage: 1.05, speed: 1 } },
      { tSec: 90, budget: 15, pool: ['crawler', 'runner', 'shooter'], spawnIntervalMs: 260, scaling: { hp: 1.1, damage: 1.08, speed: 1.02 } },
      { tSec: 210, budget: 26, pool: ['runner', 'shooter', 'bomber', 'summoner'], spawnIntervalMs: 190, eliteChance: 0.05, scaling: { hp: 1.16, damage: 1.12, speed: 1.04 } },
      { tSec: 340, budget: 38, pool: ['shooter', 'bomber', 'summoner', 'flyer'], spawnIntervalMs: 145, eliteChance: 0.09, scaling: { hp: 1.22, damage: 1.16, speed: 1.06 } },
    ],
  },
  {
    id: 'm3', name: 'O Cerco', durationSec: 540,
    bossId: 'janissary-commander', bossTimeSec: 480, rewardPowerId: 'wolf-pack',
    timeline: [
      { tSec: 0, budget: 8, pool: ['crawler', 'runner'], spawnIntervalMs: 330, scaling: { hp: 1.1, damage: 1.08, speed: 1.02 } },
      { tSec: 100, budget: 19, pool: ['runner', 'brute', 'shooter'], spawnIntervalMs: 230, eliteChance: 0.03, scaling: { hp: 1.16, damage: 1.12, speed: 1.04 } },
      { tSec: 230, budget: 32, pool: ['runner', 'brute', 'shooter', 'bomber'], spawnIntervalMs: 170, eliteChance: 0.07, scaling: { hp: 1.24, damage: 1.17, speed: 1.06 } },
      { tSec: 370, budget: 46, pool: ['brute', 'shooter', 'bomber', 'summoner'], spawnIntervalMs: 130, eliteChance: 0.11, scaling: { hp: 1.32, damage: 1.22, speed: 1.08 } },
    ],
  },
  {
    id: 'm4', name: 'O Trono Partido', durationSec: 570,
    bossId: 'the-first-betrayed', bossTimeSec: 510, rewardPowerId: 'night-domain',
    timeline: [
      { tSec: 0, budget: 10, pool: ['brute', 'flyer'], spawnIntervalMs: 300, scaling: { hp: 1.15, damage: 1.12, speed: 1.03 } },
      { tSec: 110, budget: 23, pool: ['brute', 'flyer', 'runner', 'summoner'], spawnIntervalMs: 215, eliteChance: 0.05, scaling: { hp: 1.22, damage: 1.18, speed: 1.05 } },
      { tSec: 250, budget: 38, pool: ['flyer', 'summoner', 'swarm', 'shooter'], spawnIntervalMs: 155, eliteChance: 0.09, scaling: { hp: 1.3, damage: 1.24, speed: 1.08 } },
      { tSec: 400, budget: 54, pool: ['brute', 'flyer', 'summoner', 'swarm', 'bomber'], spawnIntervalMs: 120, eliteChance: 0.14, scaling: { hp: 1.38, damage: 1.3, speed: 1.1 } },
    ],
  },
  {
    id: 'm5', name: 'A Descida', durationSec: 600,
    bossId: 'satan', bossTimeSec: 540,
    timeline: [
      { tSec: 0, budget: 12, pool: ['crawler', 'runner', 'flyer'], spawnIntervalMs: 270, scaling: { hp: 1.2, damage: 1.15, speed: 1.04 } },
      { tSec: 120, budget: 28, pool: ['brute', 'shooter', 'bomber', 'flyer'], spawnIntervalMs: 195, eliteChance: 0.06, scaling: { hp: 1.28, damage: 1.22, speed: 1.07 } },
      { tSec: 270, budget: 44, pool: ['brute', 'bomber', 'summoner', 'swarm'], spawnIntervalMs: 145, eliteChance: 0.11, scaling: { hp: 1.38, damage: 1.3, speed: 1.1 } },
      { tSec: 430, budget: 62, pool: ['brute', 'shooter', 'bomber', 'summoner', 'swarm'], spawnIntervalMs: 110, eliteChance: 0.17, scaling: { hp: 1.5, damage: 1.38, speed: 1.12 } },
    ],
  },
];

export const MEMORY_PLACEHOLDER = MEMORIES[0];

export function memoryUnlocked(save: SaveDataV1, index: number): boolean {
  if (index <= 0) return true;
  return save.memoriesCleared.includes(MEMORIES[index - 1].id);
}
