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
  /** Chefe da memória (chave em BOSS_DEFS). */
  bossId: string;
  /** Segundos até o chefe surgir. */
  bossTimeSec: number;
  /** Poder permanente concedido ao concluir a memória. */
  rewardPowerId?: string;
  timeline: SpawnPhase[];
}

export const MEMORIES: MemoryDef[] = [
  {
    id: 'm1',
    name: 'O Despertar',
    durationSec: 300,
    bossId: 'profaner-knight',
    bossTimeSec: 60,
    rewardPowerId: 'mist-form',
    timeline: [
      { tSec: 0, budget: 4, pool: ['crawler'] },
      { tSec: 60, budget: 10, pool: ['crawler', 'runner'] },
      { tSec: 150, budget: 18, pool: ['crawler', 'runner'] },
      { tSec: 240, budget: 28, pool: ['crawler', 'runner', 'brute'] },
    ],
  },
  {
    id: 'm2',
    name: 'A Fogueira',
    durationSec: 360,
    bossId: 'grand-inquisitor',
    bossTimeSec: 70,
    rewardPowerId: 'blood-rain',
    timeline: [
      { tSec: 0, budget: 6, pool: ['crawler', 'runner'] },
      { tSec: 60, budget: 14, pool: ['crawler', 'runner'] },
      { tSec: 160, budget: 24, pool: ['crawler', 'runner', 'brute'] },
      { tSec: 260, budget: 36, pool: ['crawler', 'runner', 'brute'] },
    ],
  },
  {
    id: 'm3',
    name: 'O Cerco',
    durationSec: 420,
    bossId: 'janissary-commander',
    bossTimeSec: 80,
    timeline: [
      { tSec: 0, budget: 8, pool: ['runner', 'crawler'] },
      { tSec: 60, budget: 18, pool: ['runner', 'crawler', 'brute'] },
      { tSec: 180, budget: 30, pool: ['runner', 'crawler', 'brute'] },
      { tSec: 300, budget: 44, pool: ['runner', 'crawler', 'brute'] },
    ],
  },
];

/** Compatibilidade: código legado usa `MEMORY_PLACEHOLDER`. */
export const MEMORY_PLACEHOLDER = MEMORIES[0];

export function memoryUnlocked(save: SaveDataV1, index: number): boolean {
  if (index <= 0) return true;
  return save.memoriesCleared.includes(MEMORIES[index - 1].id);
}
