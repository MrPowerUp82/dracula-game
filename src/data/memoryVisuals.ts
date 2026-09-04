import type { EnemyArchetype } from './enemies';

export interface MemoryVisualDef {
  introArt: string;
  parallaxKeys: [string, string, string];
  tint: number;
  enemySprites: Record<EnemyArchetype, string>;
}

const m1: Record<EnemyArchetype, string> = {
  crawler: 'crawler-walk', runner: 'risen-servant', brute: 'crypt-skeleton',
  shooter: 'risen-servant', bomber: 'crawler-walk', flyer: 'grave-crow',
  summoner: 'risen-servant', elite: 'elite-profaned-sentinel', swarm: 'grave-crow',
};
const m2: Record<EnemyArchetype, string> = {
  crawler: 'torch-peasant', runner: 'witch-hound', brute: 'flagellant-bomber',
  shooter: 'inquisitor-gunner', bomber: 'flagellant-bomber', flyer: 'grave-crow',
  summoner: 'zealot-preacher', elite: 'elite-pyre-warden', swarm: 'grave-crow',
};

/**
 * Fonte única dos fallbacks visuais. TODO(assets): substituir as composições
 * de M3–M5 quando os sprites/cenários dedicados passarem pelo manifest.
 */
export const MEMORY_VISUALS: Record<string, MemoryVisualDef> = {
  m1: { introArt: 'art-memory1', parallaxKeys: ['env-m1-far', 'env-m1-mid', 'env-m1-near'], tint: 0xffffff, enemySprites: m1 },
  m2: { introArt: 'env-m2-far', parallaxKeys: ['env-m2-far', 'env-m2-mid', 'env-m2-near'], tint: 0xffffff, enemySprites: m2 },
  m3: {
    introArt: 'env-m2-far', parallaxKeys: ['env-m2-far', 'env-m1-mid', 'env-m2-near'], tint: 0xd6b18a,
    enemySprites: { ...m2, brute: 'crypt-skeleton', elite: 'elite-profaned-sentinel' },
  },
  m4: {
    introArt: 'env-hub', parallaxKeys: ['env-hub', 'env-m1-mid', 'env-m1-near'], tint: 0x9a83b8,
    enemySprites: { ...m1, runner: 'witch-hound', shooter: 'inquisitor-gunner', bomber: 'flagellant-bomber', summoner: 'zealot-preacher', swarm: 'fx-bat-swarm' },
  },
  m5: {
    introArt: 'env-m2-near', parallaxKeys: ['env-m2-far', 'env-m2-mid', 'env-m2-near'], tint: 0xb84a3b,
    enemySprites: { ...m2, crawler: 'crawler-walk', brute: 'elite-pyre-warden', swarm: 'crawler-walk' },
  },
};

export function memoryVisual(memoryId: string): MemoryVisualDef {
  return MEMORY_VISUALS[memoryId] ?? MEMORY_VISUALS.m1;
}

export function enemyVisual(memoryId: string, archetype: EnemyArchetype): string {
  return memoryVisual(memoryId).enemySprites[archetype];
}
