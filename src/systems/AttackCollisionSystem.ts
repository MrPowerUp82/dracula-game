import type { System } from './System';
import type { World } from '../world/World';
import { killEnemy } from '../combat/kill';

/** Resolve overlaps Attack↔Enemy: dano, pierce, hit-cooldown, morte. */
export class AttackCollisionSystem implements System {
  update(world: World): void {
    const now = world.time.elapsedMs;

    world.attacks.forEachActive((a) => {
      world.enemies.forEachActive((e) => {
        if (!a.active) return; // attack liberado no meio do loop
        const rr = a.radius + e.radius;
        const dx = e.pos.x - a.pos.x;
        const dy = e.pos.y - a.pos.y;
        if (dx * dx + dy * dy > rr * rr) return;

        if (a.hitCooldownMs > 0) {
          const last = a.hits.get(e) ?? -Infinity;
          if (now - last < a.hitCooldownMs) return;
          a.hits.set(e, now);
        }

        e.hp -= a.damage;
        if (e.hp <= 0) killEnemy(world, e);

        if (a.hitCooldownMs === 0) {
          a.pierceLeft -= 1;
          if (a.pierceLeft < 0) world.attacks.release(a);
        }
      });
    });
  }
}
