import type { World } from '../world/World';

/** Aplica dano ao chefe. Ignora enquanto ele está na intro ou já morto. */
export function damageBoss(world: World, amount: number): void {
  const b = world.boss;
  if (!b.active || b.phase === 'intro' || b.phase === 'dead' || b.transitionMs > 0) return;
  b.hp -= amount;
  if (b.hp <= 0) {
    b.hp = 0;
    b.phase = 'dead';
    b.active = false;
    world.bossDefeated = true;
    world.events.emit('boss:died', {});
  }
}
