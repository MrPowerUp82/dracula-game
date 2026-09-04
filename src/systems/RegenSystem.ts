import type { System } from './System';
import type { World } from '../world/World';

/** Regen de vida por segundo a partir do stat `hpRegen` (trilha Regeneração). */
export class RegenSystem implements System {
  update(world: World, deltaMs: number): void {
    const p = world.player;
    const regen = p.stats.get('hpRegen');
    if (regen <= 0) return;
    const max = p.stats.get('maxHp');
    if (p.hp >= max) return;
    p.hp = Math.min(max, p.hp + regen * (deltaMs / 1000));
  }
}
