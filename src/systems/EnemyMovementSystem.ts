import type { System } from './System';
import type { World } from '../world/World';

/** Cada inimigo ativo persegue o jogador em linha reta. */
export class EnemyMovementSystem implements System {
  update(world: World, deltaMs: number): void {
    const dt = deltaMs / 1000;
    const px = world.player.pos.x;
    const py = world.player.pos.y;

    world.enemies.forEachActive((e) => {
      const dx = px - e.pos.x;
      const dy = py - e.pos.y;
      const d = Math.hypot(dx, dy);
      if (d < 0.0001) return;
      e.pos.x += (dx / d) * e.speed * dt;
      e.pos.y += (dy / d) * e.speed * dt;
    });
  }
}
