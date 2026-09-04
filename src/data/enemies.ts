export type EnemyArchetype =
  | 'crawler'
  | 'runner'
  | 'brute'
  | 'shooter'
  | 'bomber'
  | 'flyer'
  | 'summoner'
  | 'elite'
  | 'swarm';

export type EnemyBehavior =
  | 'chase'
  | 'runner'
  | 'brute'
  | 'kite'
  | 'bomber'
  | 'sine'
  | 'summon'
  | 'elite'
  | 'swarm';

export interface EnemyDef {
  id: EnemyArchetype;
  hp: number;
  speed: number;
  contactDamage: number;
  xpValue: number;
  radius: number;
  budgetCost: number;
  spriteKey: string;
  behavior: EnemyBehavior;
  preferredRange?: number;
  attackCooldownMs?: number;
  projectileDamage?: number;
  projectileSpeed?: number;
  summonArchetype?: EnemyArchetype;
  summonCount?: number;
}

/**
 * Arquétipos completos definidos no DESIGN.md. A camada visual pode remapear
 * cada arquétipo por memória sem alterar o gameplay.
 */
export const ENEMY_DEFS: Record<EnemyArchetype, EnemyDef> = {
  crawler: {
    id: 'crawler', hp: 10, speed: 30, contactDamage: 6, xpValue: 1,
    radius: 6, budgetCost: 1, spriteKey: 'crawler-walk', behavior: 'chase',
  },
  runner: {
    id: 'runner', hp: 6, speed: 68, contactDamage: 5, xpValue: 1,
    radius: 5, budgetCost: 1, spriteKey: 'witch-hound', behavior: 'runner',
  },
  brute: {
    id: 'brute', hp: 48, speed: 20, contactDamage: 14, xpValue: 3,
    radius: 10, budgetCost: 3, spriteKey: 'crypt-skeleton', behavior: 'brute',
  },
  shooter: {
    id: 'shooter', hp: 18, speed: 26, contactDamage: 5, xpValue: 2,
    radius: 7, budgetCost: 2, spriteKey: 'inquisitor-gunner', behavior: 'kite',
    preferredRange: 120, attackCooldownMs: 1900, projectileDamage: 8, projectileSpeed: 92,
  },
  bomber: {
    id: 'bomber', hp: 20, speed: 46, contactDamage: 4, xpValue: 2,
    radius: 7, budgetCost: 2, spriteKey: 'flagellant-bomber', behavior: 'bomber',
    preferredRange: 25, attackCooldownMs: 1200, projectileDamage: 14,
  },
  flyer: {
    id: 'flyer', hp: 14, speed: 52, contactDamage: 7, xpValue: 2,
    radius: 6, budgetCost: 2, spriteKey: 'grave-crow', behavior: 'sine',
  },
  summoner: {
    id: 'summoner', hp: 30, speed: 20, contactDamage: 5, xpValue: 4,
    radius: 8, budgetCost: 4, spriteKey: 'zealot-preacher', behavior: 'summon',
    preferredRange: 150, attackCooldownMs: 3600, summonArchetype: 'crawler', summonCount: 2,
  },
  elite: {
    id: 'elite', hp: 180, speed: 24, contactDamage: 18, xpValue: 10,
    radius: 13, budgetCost: 8, spriteKey: 'elite-profaned-sentinel', behavior: 'elite',
  },
  swarm: {
    id: 'swarm', hp: 1, speed: 58, contactDamage: 2, xpValue: 1,
    radius: 3, budgetCost: 1, spriteKey: 'grave-crow', behavior: 'swarm',
  },
};
