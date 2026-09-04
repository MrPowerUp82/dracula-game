import type { Vec2 } from './Player';
import type { BossDef, BossPhase } from '../data/bosses';

export type { BossPhase } from '../data/bosses';

/** Chefe da memória. Instância única em `world.boss` — não é pooled. */
export class Boss {
  active = false;
  readonly pos: Vec2 = { x: 0, y: 0 };
  defId = '';
  hp = 0;
  maxHp = 0;
  radius = 0;
  contactDamage = 0;
  moveSpeed = 0;
  phase: BossPhase = 'intro';
  phaseTimeMs = 0;
  attackCdMs = 0;
  attackIndex = 0;
  /** Janela invulnerável/legível ao trocar de forma. */
  transitionMs = 0;
  orbitDirection = 1;

  spawn(def: BossDef, x: number, y: number): void {
    this.defId = def.id;
    this.pos.x = x;
    this.pos.y = y;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.radius = def.radius;
    this.contactDamage = def.contactDamage;
    this.moveSpeed = 0;
    this.phase = 'intro';
    this.phaseTimeMs = 0;
    this.attackCdMs = 0;
    this.attackIndex = 0;
    this.transitionMs = 0;
    this.orbitDirection = x >= 0 ? 1 : -1;
    this.active = true;
  }

  reset(): void {
    this.defId = '';
    this.pos.x = 0;
    this.pos.y = 0;
    this.hp = 0;
    this.maxHp = 0;
    this.radius = 0;
    this.contactDamage = 0;
    this.moveSpeed = 0;
    this.phase = 'intro';
    this.phaseTimeMs = 0;
    this.attackCdMs = 0;
    this.attackIndex = 0;
    this.transitionMs = 0;
    this.orbitDirection = 1;
    this.active = false;
  }
}
