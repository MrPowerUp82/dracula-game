import type { Poolable } from '../core/Pool';
import type { Vec2 } from './Player';
import type { EnemyArchetype, EnemyDef } from '../data/enemies';

/**
 * Estado puro de um inimigo. Reciclado por um Pool. Sem Phaser — a RunScene
 * mantém sprites separados sincronizados a partir de `pos`.
 */
export class Enemy implements Poolable {
  active = false;
  readonly pos: Vec2 = { x: 0, y: 0 };
  defId: EnemyArchetype = 'crawler';
  hp = 0;
  speed = 0;
  contactDamage = 0;
  xpValue = 0;
  radius = 0;

  /** Configura o inimigo a partir de uma definição e o coloca em (x, y). */
  spawn(def: EnemyDef, x: number, y: number): void {
    this.defId = def.id;
    this.pos.x = x;
    this.pos.y = y;
    this.hp = def.hp;
    this.speed = def.speed;
    this.contactDamage = def.contactDamage;
    this.xpValue = def.xpValue;
    this.radius = def.radius;
  }

  /** Chamado pelo Pool em cada acquire(). Zera tudo. */
  reset(): void {
    this.defId = 'crawler';
    this.pos.x = 0;
    this.pos.y = 0;
    this.hp = 0;
    this.speed = 0;
    this.contactDamage = 0;
    this.xpValue = 0;
    this.radius = 0;
  }
}
