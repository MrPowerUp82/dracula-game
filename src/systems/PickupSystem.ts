import type { System } from './System';
import type { World } from '../world/World';
import { resolveLevelUps } from '../progression/xp';
import { PICKUP_MAGNET_SPEED } from '../config/gameConfig';

/**
 * Gemas dentro do `pickupRadius` do jogador são magnetizadas e perseguem-no;
 * ao alcançá-lo somam XP e disparam as subidas de nível.
 */
export class PickupSystem implements System {
  update(world: World, deltaMs: number): void {
    const dt = deltaMs / 1000;
    const p = world.player;
    const magnetRange = p.stats.get('pickupRadius');
    const collectDist = p.radius + 2;

    world.pickups.forEachActive((gem) => {
      const dx = p.pos.x - gem.pos.x;
      const dy = p.pos.y - gem.pos.y;
      const d = Math.hypot(dx, dy);

      if (!gem.magnetized && d <= magnetRange) gem.magnetized = true;

      if (gem.magnetized && d > 0.0001) {
        const step = PICKUP_MAGNET_SPEED * dt;
        if (step >= d) {
          gem.pos.x = p.pos.x;
          gem.pos.y = p.pos.y;
        } else {
          gem.pos.x += (dx / d) * step;
          gem.pos.y += (dy / d) * step;
        }
      }

      const cdx = p.pos.x - gem.pos.x;
      const cdy = p.pos.y - gem.pos.y;
      if (cdx * cdx + cdy * cdy <= collectDist * collectDist) {
        world.progression.xp += gem.value;
        world.pickups.release(gem);
        resolveLevelUps(world);
      }
    });
  }
}
