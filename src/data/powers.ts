import type { StatModifier } from '../stats/Stats';

export type PowerBehavior = 'orbit' | 'projectile' | 'aura' | 'passive' | 'dash';

export interface PowerLevel {
  /** Dano por acerto (antes de `might`). */
  damage?: number;
  /** Instâncias: nº de orbes / projéteis por rajada. */
  amount?: number;
  /** ms: cooldown de disparo (projétil) / tick (aura) / recarga (dash). */
  cooldownMs?: number;
  /** px: raio da hitbox, ou raio da órbita, ou raio da aura. */
  radius?: number;
  /** px/s: velocidade do projétil; ou px: distância do dash. */
  speed?: number;
  /** projétil: acertos extras antes de sumir. */
  pierce?: number;
  /** dash: i-frames em ms. */
  iframeMs?: number;
  /** passivo: modificadores de atributo aplicados neste nível. */
  mods?: StatModifier[];
}

export interface PowerDef {
  id: string;
  name: string;
  behavior: PowerBehavior;
  maxLevel: number;
  /** levels[0] = nível 1. */
  levels: PowerLevel[];
  evolvesTo?: string;
  evolveReq?: { powerId: string; minLevel: number }[];
}

/** Velocidade angular dos orbes (rad/s) e o intervalo entre acertos deles. */
export const BAT_ORBIT_SPEED = 3.2;
export const BAT_HIT_COOLDOWN_MS = 400;

/** Poderes que podem entrar no sorteio de cartas (antes de qualquer desbloqueio, só o 1º). */
export const BASE_DRAFT_POOL: string[] = ['bat-swarm', 'blood-spear', 'blood-rain', 'crimson-vigor', 'mist-form'];

export function powerLevel(def: PowerDef, level: number): PowerLevel {
  const clamped = Math.max(1, Math.min(level, def.levels.length));
  return def.levels[clamped - 1];
}

export const POWER_DEFS: Record<string, PowerDef> = {
  'bat-swarm': {
    id: 'bat-swarm',
    name: 'Enxame de Morcegos',
    behavior: 'orbit',
    maxLevel: 8,
    evolvesTo: 'nosferatu',
    evolveReq: [
      { powerId: 'bat-swarm', minLevel: 5 },
      { powerId: 'mist-form', minLevel: 1 },
    ],
    levels: [
      { damage: 4, amount: 2, radius: 26 },
      { damage: 5, amount: 3, radius: 28 },
      { damage: 6, amount: 3, radius: 30 },
      { damage: 7, amount: 4, radius: 32 },
      { damage: 8, amount: 4, radius: 34 },
      { damage: 10, amount: 5, radius: 36 },
      { damage: 12, amount: 5, radius: 38 },
      { damage: 14, amount: 6, radius: 40 },
    ],
  },
  nosferatu: {
    id: 'nosferatu',
    name: 'Nosferatu',
    behavior: 'orbit',
    maxLevel: 4,
    levels: [
      { damage: 22, amount: 7, radius: 44 },
      { damage: 27, amount: 8, radius: 46 },
      { damage: 33, amount: 9, radius: 48 },
      { damage: 40, amount: 10, radius: 50 },
    ],
  },
  'blood-spear': {
    id: 'blood-spear',
    name: 'Lança de Sangue',
    behavior: 'projectile',
    maxLevel: 8,
    levels: [
      { damage: 9, amount: 1, cooldownMs: 1100, speed: 190, radius: 5, pierce: 0 },
      { damage: 11, amount: 1, cooldownMs: 1050, speed: 200, radius: 5, pierce: 0 },
      { damage: 13, amount: 2, cooldownMs: 1000, speed: 205, radius: 5, pierce: 0 },
      { damage: 15, amount: 2, cooldownMs: 950, speed: 210, radius: 6, pierce: 1 },
      { damage: 18, amount: 2, cooldownMs: 900, speed: 215, radius: 6, pierce: 1 },
      { damage: 21, amount: 3, cooldownMs: 850, speed: 220, radius: 6, pierce: 1 },
      { damage: 25, amount: 3, cooldownMs: 800, speed: 230, radius: 7, pierce: 2 },
      { damage: 30, amount: 4, cooldownMs: 700, speed: 240, radius: 7, pierce: 2 },
    ],
  },
  'blood-rain': {
    id: 'blood-rain',
    name: 'Chuva de Sangue',
    behavior: 'aura',
    maxLevel: 6,
    levels: [
      { damage: 3, radius: 34, cooldownMs: 500 },
      { damage: 4, radius: 40, cooldownMs: 480 },
      { damage: 5, radius: 46, cooldownMs: 460 },
      { damage: 6, radius: 54, cooldownMs: 430 },
      { damage: 8, radius: 62, cooldownMs: 400 },
      { damage: 10, radius: 70, cooldownMs: 360 },
    ],
  },
  'crimson-vigor': {
    id: 'crimson-vigor',
    name: 'Vigor Carmesim',
    behavior: 'passive',
    maxLevel: 5,
    // `might` é um stat em pontos percentuais (damageMult = 1 + might/100),
    // então o modificador é `flat` (soma pontos), não `pct`.
    levels: [
      { mods: [{ key: 'might', flat: 8 }, { key: 'maxHp', flat: 10 }] },
      { mods: [{ key: 'might', flat: 16 }, { key: 'maxHp', flat: 20 }] },
      { mods: [{ key: 'might', flat: 24 }, { key: 'maxHp', flat: 35 }] },
      { mods: [{ key: 'might', flat: 34 }, { key: 'maxHp', flat: 50 }] },
      { mods: [{ key: 'might', flat: 45 }, { key: 'maxHp', flat: 70 }] },
    ],
  },
  'mist-form': {
    id: 'mist-form',
    name: 'Forma de Névoa',
    behavior: 'dash',
    maxLevel: 5,
    levels: [
      { cooldownMs: 4000, speed: 70, iframeMs: 220 },
      { cooldownMs: 3600, speed: 80, iframeMs: 250 },
      { cooldownMs: 3200, speed: 92, iframeMs: 290 },
      { cooldownMs: 2800, speed: 100, iframeMs: 330 },
      { cooldownMs: 2500, speed: 110, iframeMs: 360 },
    ],
  },
};
