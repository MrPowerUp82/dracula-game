import type { EnemyArchetype } from './enemies';

export type BossPhase = 'intro' | 'p1' | 'p2' | 'enraged' | 'dead';
export type BossAttackKind = 'ring' | 'charge' | 'summon' | 'nova';

export interface BossAttack {
  kind: BossAttackKind;
  cooldownMs: number;
  damage: number;
  /** ring: nº de projéteis; summon: nº de inimigos. */
  count?: number;
  /** ring: velocidade do projétil; charge: velocidade da investida (px/s). */
  speed?: number;
  /** ring: raio do projétil; nova: raio da explosão. */
  radius?: number;
  /** summon: arquétipo invocado. */
  archetype?: EnemyArchetype;
}

export interface BossPhaseDef {
  moveSpeed: number;
  attacks: BossAttack[];
}

export interface BossDef {
  id: string;
  name: string;
  hp: number;
  radius: number;
  contactDamage: number;
  spriteKey: string;
  introMs: number;
  /** entra na fase 2 quando hp/maxHp <= p2At. */
  p2At: number;
  /** entra em 'enraged' quando hp/maxHp <= enrageAt. */
  enrageAt: number;
  phases: [BossPhaseDef, BossPhaseDef, BossPhaseDef];
}

const ring = (o: Partial<BossAttack> = {}): BossAttack => ({
  kind: 'ring',
  cooldownMs: 2600,
  damage: 12,
  count: 12,
  speed: 90,
  radius: 5,
  ...o,
});
const charge = (o: Partial<BossAttack> = {}): BossAttack => ({
  kind: 'charge',
  cooldownMs: 3200,
  damage: 20,
  speed: 260,
  radius: 8,
  ...o,
});
const summon = (o: Partial<BossAttack> = {}): BossAttack => ({
  kind: 'summon',
  cooldownMs: 4000,
  damage: 0,
  count: 4,
  archetype: 'runner',
  ...o,
});
const nova = (o: Partial<BossAttack> = {}): BossAttack => ({
  kind: 'nova',
  cooldownMs: 3400,
  damage: 18,
  radius: 46,
  ...o,
});

export const BOSS_DEFS: Record<string, BossDef> = {
  'profaner-knight': {
    id: 'profaner-knight',
    name: 'Cavaleiro Profanador',
    hp: 600,
    radius: 12,
    contactDamage: 14,
    spriteKey: 'boss-m1',
    introMs: 1400,
    p2At: 0.66,
    enrageAt: 0.33,
    phases: [
      { moveSpeed: 34, attacks: [charge()] },
      { moveSpeed: 40, attacks: [charge({ cooldownMs: 2800 }), ring({ count: 10 })] },
      { moveSpeed: 48, attacks: [charge({ cooldownMs: 2200 }), ring({ count: 14, cooldownMs: 2200 })] },
    ],
  },
  'grand-inquisitor': {
    id: 'grand-inquisitor',
    name: 'Inquisidor-Mor',
    hp: 800,
    radius: 13,
    contactDamage: 12,
    spriteKey: 'dev-boss',
    introMs: 1400,
    p2At: 0.66,
    enrageAt: 0.33,
    phases: [
      { moveSpeed: 22, attacks: [nova()] },
      { moveSpeed: 24, attacks: [nova({ cooldownMs: 3000 }), summon({ archetype: 'crawler' })] },
      { moveSpeed: 26, attacks: [nova({ cooldownMs: 2400, radius: 58 }), summon({ count: 6 })] },
    ],
  },
  'janissary-commander': {
    id: 'janissary-commander',
    name: 'Comandante Janízaro',
    hp: 1000,
    radius: 14,
    contactDamage: 16,
    spriteKey: 'dev-boss',
    introMs: 1600,
    p2At: 0.6,
    enrageAt: 0.3,
    phases: [
      { moveSpeed: 30, attacks: [charge({ speed: 300 })] },
      { moveSpeed: 34, attacks: [charge({ speed: 320, cooldownMs: 2800 }), summon()] },
      { moveSpeed: 40, attacks: [charge({ speed: 360, cooldownMs: 2200 }), summon({ count: 6 }), ring({ count: 12 })] },
    ],
  },
  'the-first-betrayed': {
    id: 'the-first-betrayed',
    name: 'O Primeiro Traído',
    hp: 900,
    radius: 12,
    contactDamage: 14,
    spriteKey: 'dev-boss',
    introMs: 1400,
    p2At: 0.66,
    enrageAt: 0.33,
    phases: [
      { moveSpeed: 40, attacks: [ring()] },
      { moveSpeed: 46, attacks: [ring({ count: 16 }), nova()] },
      { moveSpeed: 54, attacks: [ring({ count: 20, cooldownMs: 2000 }), nova({ cooldownMs: 2400 })] },
    ],
  },
  satan: {
    id: 'satan',
    name: 'Satã',
    hp: 3000,
    radius: 18,
    contactDamage: 22,
    spriteKey: 'dev-boss',
    introMs: 2000,
    p2At: 0.66,
    enrageAt: 0.33,
    phases: [
      { moveSpeed: 20, attacks: [ring({ count: 16, damage: 16 }), nova({ damage: 24 })] },
      { moveSpeed: 24, attacks: [ring({ count: 20, damage: 18 }), charge({ damage: 28 }), summon({ count: 5 })] },
      {
        moveSpeed: 30,
        attacks: [
          ring({ count: 26, cooldownMs: 1800, damage: 22 }),
          charge({ cooldownMs: 2200, damage: 34 }),
          nova({ radius: 70, cooldownMs: 2600, damage: 34 }),
          summon({ count: 8 }),
        ],
      },
    ],
  },
};
