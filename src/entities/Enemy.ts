import type { Poolable } from '../core/Pool';
import type { Vec2 } from './Player';
import type { EnemyArchetype, EnemyDef } from '../data/enemies';

export class Enemy implements Poolable {
  active = false;
  readonly pos: Vec2 = { x: 0, y: 0 };
  defId: EnemyArchetype = 'crawler';
  hp = 0;
  speed = 0;
  contactDamage = 0;
  xpValue = 0;
  radius = 0;
  aiCooldownMs = 0;
  aiPhase = 0;

  spawn(def: EnemyDef, x: number, y: number): void {
    this.defId = def.id;
    this.pos.x = x;
    this.pos.y = y;
    this.hp = def.hp;
    this.speed = def.speed;
    this.contactDamage = def.contactDamage;
    this.xpValue = def.xpValue;
    this.radius = def.radius;
    this.aiCooldownMs = Math.max(250, (def.attackCooldownMs ?? 1000) * 0.5);
    this.aiPhase = (x * 0.017 + y * 0.013) % (Math.PI * 2);
  }

  reset(): void {
    this.defId = 'crawler';
    this.pos.x = 0;
    this.pos.y = 0;
    this.hp = 0;
    this.speed = 0;
    this.contactDamage = 0;
    this.xpValue = 0;
    this.radius = 0;
    this.aiCooldownMs = 0;
    this.aiPhase = 0;
  }
}
