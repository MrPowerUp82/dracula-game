import type { EnemyArchetype } from './enemies';

export type BossPhase = 'intro' | 'p1' | 'p2' | 'enraged' | 'dead';
export type BossAttackKind = 'ring' | 'volley' | 'charge' | 'summon' | 'nova' | 'meteor';
export type BossMovement = 'chase' | 'orbit' | 'stationary';
export type BossAttackTarget = 'boss' | 'player';

export interface BossAttack {
  kind: BossAttackKind;
  cooldownMs: number;
  damage: number;
  telegraphMs?: number;
  count?: number;
  speed?: number;
  radius?: number;
  spreadDeg?: number;
  target?: BossAttackTarget;
  archetype?: EnemyArchetype;
}

export interface BossPhaseDef {
  name: string;
  moveSpeed: number;
  movement: BossMovement;
  preferredRange?: number;
  transitionMs: number;
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
  p2At: number;
  enrageAt: number;
  phases: [BossPhaseDef, BossPhaseDef, BossPhaseDef];
}

const ring = (o: Partial<BossAttack> = {}): BossAttack => ({
  kind: 'ring', cooldownMs: 2800, damage: 12, telegraphMs: 650,
  count: 12, speed: 90, radius: 5, ...o,
});
const volley = (o: Partial<BossAttack> = {}): BossAttack => ({
  kind: 'volley', cooldownMs: 2200, damage: 12, telegraphMs: 500,
  count: 5, speed: 125, radius: 5, spreadDeg: 42, ...o,
});
const charge = (o: Partial<BossAttack> = {}): BossAttack => ({
  kind: 'charge', cooldownMs: 3200, damage: 20, telegraphMs: 800,
  speed: 280, radius: 10, ...o,
});
const summon = (o: Partial<BossAttack> = {}): BossAttack => ({
  kind: 'summon', cooldownMs: 4200, damage: 0, telegraphMs: 700,
  count: 4, archetype: 'runner', ...o,
});
const nova = (o: Partial<BossAttack> = {}): BossAttack => ({
  kind: 'nova', cooldownMs: 3400, damage: 18, telegraphMs: 900,
  radius: 46, target: 'boss', ...o,
});
const meteor = (o: Partial<BossAttack> = {}): BossAttack => ({
  kind: 'meteor', cooldownMs: 3000, damage: 24, telegraphMs: 1100,
  count: 3, radius: 24, target: 'player', ...o,
});
const phase = (
  name: string,
  movement: BossMovement,
  moveSpeed: number,
  attacks: BossAttack[],
  preferredRange = 0,
  transitionMs = 900,
): BossPhaseDef => ({ name, movement, moveSpeed, preferredRange, transitionMs, attacks });

export const BOSS_DEFS: Record<string, BossDef> = {
  'profaner-knight': {
    id: 'profaner-knight', name: 'Cavaleiro Profanador', hp: 600, radius: 12,
    contactDamage: 14, spriteKey: 'boss-m1', introMs: 1400, p2At: 0.66, enrageAt: 0.33,
    phases: [
      phase('Investida Profana', 'chase', 34, [charge()]),
      phase('Cerco de Lâminas', 'chase', 40, [charge({ cooldownMs: 2700 }), volley({ count: 4 })]),
      phase('Fúria do Saqueador', 'chase', 48, [charge({ cooldownMs: 2100 }), ring({ count: 14 })]),
    ],
  },
  'grand-inquisitor': {
    id: 'grand-inquisitor', name: 'Inquisidor-Mor', hp: 800, radius: 13,
    contactDamage: 12, spriteKey: 'boss-m2', introMs: 1400, p2At: 0.66, enrageAt: 0.33,
    phases: [
      phase('Liturgia de Fogo', 'orbit', 24, [nova({ target: 'player', radius: 34 })], 130),
      phase('Julgamento', 'orbit', 26, [meteor({ count: 2 }), summon({ archetype: 'crawler' })], 140),
      phase('Auto de Fé', 'stationary', 0, [meteor({ count: 4, radius: 28 }), nova({ radius: 58 })]),
    ],
  },
  'janissary-commander': {
    id: 'janissary-commander', name: 'Comandante Janízaro', hp: 1000, radius: 14,
    contactDamage: 16, spriteKey: 'elite-pyre-warden', introMs: 1600, p2At: 0.6, enrageAt: 0.3,
    phases: [
      phase('Carga Montada', 'chase', 32, [charge({ speed: 330 })]),
      phase('Ondas de Infantaria', 'orbit', 34, [charge({ speed: 350 }), summon({ count: 5 })], 115),
      phase('Última Linha', 'chase', 42, [charge({ speed: 390, cooldownMs: 2100 }), summon({ count: 7 }), volley({ count: 7 })]),
    ],
  },
  'the-first-betrayed': {
    id: 'the-first-betrayed', name: 'O Primeiro Traído', hp: 900, radius: 12,
    contactDamage: 14, spriteKey: 'boss-m2', introMs: 1400, p2At: 0.66, enrageAt: 0.33,
    phases: [
      phase('Espelho Rubro', 'orbit', 38, [volley({ count: 7 })], 120),
      phase('Reflexo Partido', 'orbit', 44, [ring({ count: 16 }), nova({ target: 'player', radius: 38 })], 105),
      phase('Traição Eterna', 'chase', 54, [ring({ count: 20, cooldownMs: 2000 }), meteor({ count: 3 })]),
    ],
  },
  satan: {
    id: 'satan', name: 'Satã', hp: 3000, radius: 18,
    contactDamage: 22, spriteKey: 'boss-m1', introMs: 2200, p2At: 0.66, enrageAt: 0.33,
    phases: [
      // F1: anjo caído — controla distância com asas/projéteis direcionados.
      phase('Anjo Caído', 'orbit', 30, [volley({ count: 7, damage: 15, speed: 145 }), ring({ count: 14, damage: 14 })], 145, 1200),
      // F2: titã de fogo — invade o espaço do jogador com cargas e crateras.
      phase('Titã de Fogo', 'chase', 38, [charge({ damage: 28, speed: 370 }), meteor({ count: 3, damage: 25, radius: 28 }), summon({ count: 5, archetype: 'brute' })], 75, 1400),
      // F3: forma verdadeira gigante — ancora a arena e combina padrões.
      phase('Forma Verdadeira', 'stationary', 0, [ring({ count: 28, damage: 22, speed: 120, cooldownMs: 2100 }), meteor({ count: 5, damage: 30, radius: 32 }), nova({ damage: 32, radius: 82 }), summon({ count: 8, archetype: 'swarm' })], 0, 1600),
    ],
  },
};
