import type { System } from './System';
import type { World } from '../world/World';
import { killEnemy } from '../combat/kill';
import { damageBoss } from '../combat/boss';
import { CLAW_COOLDOWN_MS, CLAW_RANGE, CLAW_DAMAGE } from '../config/gameConfig';

/**
 * Garra automática do Drácula: a cada CLAW_COOLDOWN_MS, fere todos os inimigos
 * num raio de CLAW_RANGE ao redor dele. É o único "poder" do Plano 2 — o
 * sistema completo de poderes com sorteio entra no Plano 3.
 */
export class PlayerAttackSystem implements System {
  private nextAttackAtMs = 0;

  update(world: World): void {
    if (world.time.elapsedMs < this.nextAttackAtMs) return;
    this.nextAttackAtMs = world.time.elapsedMs + CLAW_COOLDOWN_MS;

    const px = world.player.pos.x;
    const py = world.player.pos.y;
    const range2 = CLAW_RANGE * CLAW_RANGE;

    world.enemies.forEachActive((e) => {
      const dx = e.pos.x - px;
      const dy = e.pos.y - py;
      if (dx * dx + dy * dy > range2) return;
      e.hp -= CLAW_DAMAGE;
      if (e.hp <= 0) killEnemy(world, e);
    });

    if (world.boss.active) {
      const bdx = world.boss.pos.x - px;
      const bdy = world.boss.pos.y - py;
      if (bdx * bdx + bdy * bdy <= range2) damageBoss(world, CLAW_DAMAGE);
    }
  }
}
