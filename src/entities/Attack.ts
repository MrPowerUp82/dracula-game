import type { Poolable } from '../core/Pool';
import type { Vec2 } from './Player';
import type { Enemy } from './Enemy';

export type AttackMotion = 'linear' | 'orbit' | 'static' | 'fixed';
export type TelegraphShape = 'none' | 'circle' | 'line';

/**
 * "Coisa que causa dano" reciclável: projétil (linear, some ao acabar o
 * pierce), orbe (orbit, hitbox persistente), aura (static, presa ao jogador).
 */
export class Attack implements Poolable {
  active = false;
  readonly pos: Vec2 = { x: 0, y: 0 };
  readonly vel: Vec2 = { x: 0, y: 0 };
  radius = 0;
  damage = 0;
  /** Acertos extras antes de sumir (só quando hitCooldownMs === 0). */
  pierceLeft = 0;
  /** >0: hitbox persistente que reacerta o mesmo inimigo após esse intervalo. */
  hitCooldownMs = 0;
  lifespanMs = Infinity;
  ageMs = 0;
  /** Enquanto ageMs < telegraphMs, o ataque é visível mas não move nem causa dano. */
  telegraphMs = 0;
  telegraphShape: TelegraphShape = 'none';
  telegraphTargetX = 0;
  telegraphTargetY = 0;
  telegraphRadius = 0;
  motion: AttackMotion = 'linear';
  orbitAngle = 0;
  orbitRadius = 0;
  orbitSpeed = 0;
  ownerPowerId = '';
  spriteKey = 'dev-bat';
  /** Inimigo -> ms do último acerto (para hitbox persistente). */
  readonly hits = new Map<Enemy, number>();
  /** ms do último acerto no chefe (hitbox persistente). */
  bossHitAtMs = -Infinity;

  reset(): void {
    this.pos.x = 0;
    this.pos.y = 0;
    this.vel.x = 0;
    this.vel.y = 0;
    this.radius = 0;
    this.damage = 0;
    this.pierceLeft = 0;
    this.hitCooldownMs = 0;
    this.lifespanMs = Infinity;
    this.ageMs = 0;
    this.telegraphMs = 0;
    this.telegraphShape = 'none';
    this.telegraphTargetX = 0;
    this.telegraphTargetY = 0;
    this.telegraphRadius = 0;
    this.motion = 'linear';
    this.orbitAngle = 0;
    this.orbitRadius = 0;
    this.orbitSpeed = 0;
    this.ownerPowerId = '';
    this.spriteKey = 'dev-bat';
    this.hits.clear();
    this.bossHitAtMs = -Infinity;
  }
}
