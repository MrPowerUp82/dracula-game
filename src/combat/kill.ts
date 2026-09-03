import type { World } from '../world/World';
import type { Enemy } from '../entities/Enemy';

/**
 * Mata um inimigo: notifica (`enemy:died`), solta uma gema de XP no lugar
 * (se o pool de gemas não estiver cheio) e devolve o inimigo ao pool.
 */
export function killEnemy(world: World, enemy: Enemy): void {
  world.events.emit('enemy:died', {
    x: enemy.pos.x,
    y: enemy.pos.y,
    xpValue: enemy.xpValue,
  });

  const gem = world.pickups.acquire();
  if (gem) {
    gem.spawn('xpGem', enemy.pos.x, enemy.pos.y, enemy.xpValue);
  }

  world.enemies.release(enemy);
}
