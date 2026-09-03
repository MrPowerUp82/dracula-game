import type { World } from '../world/World';
import type { System } from './System';

/** Integra a posição do player a partir do intent e do stat moveSpeed. */
export class MovementSystem implements System {
  update(world: World, deltaMs: number): void {
    const { player } = world;
    const dt = deltaMs / 1000;

    let ix = player.intent.x;
    let iy = player.intent.y;

    // Normaliza para a diagonal não ser mais rápida que os eixos cardeais.
    const mag = Math.hypot(ix, iy);
    if (mag > 1) {
      ix /= mag;
      iy /= mag;
    }

    player.vel.x = ix * player.stats.get('moveSpeed');
    player.vel.y = iy * player.stats.get('moveSpeed');

    player.pos.x += player.vel.x * dt;
    player.pos.y += player.vel.y * dt;
  }
}
