import type { EnemyArchetype } from './enemies';
import type { SaveDataV1 } from '../save/SaveData';

export interface SpawnPhase {
  tSec: number;
  budget: number;
  pool: EnemyArchetype[];
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
    id: 'm1', name: 'O Despertar', durationSec: 300,
    bossId: 'profaner-knight', bossTimeSec: 60, rewardPowerId: 'mist-form',
    timeline: [
      { tSec: 0, budget: 4, pool: ['crawler'] },
      { tSec: 45, budget: 9, pool: ['crawler', 'runner', 'flyer'] },
      { tSec: 120, budget: 16, pool: ['crawler', 'runner', 'flyer', 'brute'] },
      { tSec: 210, budget: 24, pool: ['crawler', 'runner', 'brute', 'elite'] },
    ],
  },
  {
    id: 'm2', name: 'A Fogueira', durationSec: 360,
    bossId: 'grand-inquisitor', bossTimeSec: 70, rewardPowerId: 'blood-rain',
    timeline: [
      { tSec: 0, budget: 6, pool: ['crawler', 'runner'] },
      { tSec: 55, budget: 14, pool: ['crawler', 'runner', 'shooter'] },
      { tSec: 140, budget: 24, pool: ['runner', 'shooter', 'bomber', 'summoner'] },
      { tSec: 250, budget: 36, pool: ['shooter', 'bomber', 'summoner', 'elite'] },
    ],
  },
  {
    id: 'm3', name: 'O Cerco', durationSec: 420,
    bossId: 'janissary-commander', bossTimeSec: 80, rewardPowerId: 'wolf-pack',
    timeline: [
      { tSec: 0, budget: 8, pool: ['crawler', 'runner'] },
      { tSec: 60, budget: 18, pool: ['runner', 'brute', 'shooter'] },
      { tSec: 170, budget: 30, pool: ['runner', 'brute', 'shooter', 'bomber'] },
      { tSec: 300, budget: 44, pool: ['brute', 'shooter', 'bomber', 'elite'] },
    ],
  },
  {
    id: 'm4', name: 'O Trono Partido', durationSec: 480,
    bossId: 'the-first-betrayed', bossTimeSec: 90, rewardPowerId: 'night-domain',
    timeline: [
      { tSec: 0, budget: 10, pool: ['brute', 'flyer'] },
      { tSec: 70, budget: 22, pool: ['brute', 'flyer', 'runner', 'summoner'] },
      { tSec: 190, budget: 36, pool: ['flyer', 'summoner', 'swarm', 'elite'] },
      { tSec: 340, budget: 52, pool: ['brute', 'flyer', 'summoner', 'swarm', 'elite'] },
    ],
  },
  {
    id: 'm5', name: 'A Descida', durationSec: 540,
    bossId: 'satan', bossTimeSec: 100,
    timeline: [
      { tSec: 0, budget: 12, pool: ['crawler', 'runner', 'flyer'] },
      { tSec: 80, budget: 26, pool: ['brute', 'shooter', 'bomber', 'flyer'] },
      { tSec: 220, budget: 42, pool: ['brute', 'bomber', 'summoner', 'swarm'] },
      { tSec: 380, budget: 60, pool: ['brute', 'shooter', 'bomber', 'summoner', 'elite', 'swarm'] },
    ],
  },
];

export const MEMORY_PLACEHOLDER = MEMORIES[0];

export function memoryUnlocked(save: SaveDataV1, index: number): boolean {
  if (index <= 0) return true;
  return save.memoriesCleared.includes(MEMORIES[index - 1].id);
}
