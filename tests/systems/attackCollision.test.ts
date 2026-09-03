import { describe, it, expect, vi } from 'vitest';
import { createWorld, advanceTime } from '../../src/world/World';
import { AttackCollisionSystem } from '../../src/systems/AttackCollisionSystem';
import { ENEMY_DEFS } from '../../src/data/enemies';

function enemyAt(world: ReturnType<typeof createWorld>, x: number, y: number, arch: keyof typeof ENEMY_DEFS) {
  const e = world.enemies.acquire()!;
  e.spawn(ENEMY_DEFS[arch], x, y);
  return e;
}

describe('AttackCollisionSystem', () => {
  it('projétil (hitCooldownMs 0, pierce 0) some após um acerto', () => {
    const world = createWorld(1);
    const a = world.attacks.acquire()!;
    a.motion = 'linear';
    a.radius = 6;
    a.damage = 3;
    a.pierceLeft = 0;
    a.hitCooldownMs = 0;
    const e = enemyAt(world, 0, 0, 'brute');
    new AttackCollisionSystem().update(world);
    expect(e.hp).toBe(ENEMY_DEFS.brute.hp - 3);
    expect(world.attacks.activeCount).toBe(0);
  });

  it('projétil com pierce 1 acerta dois inimigos antes de sumir', () => {
    const world = createWorld(1);
    const a = world.attacks.acquire()!;
    a.radius = 6;
    a.damage = 3;
    a.pierceLeft = 1;
    a.hitCooldownMs = 0;
    enemyAt(world, 0, 0, 'brute');
    enemyAt(world, 1, 0, 'brute');
    new AttackCollisionSystem().update(world);
    expect(world.attacks.activeCount).toBe(0);
  });

  it('hitbox persistente reacerta o mesmo inimigo só após o hitCooldown', () => {
    const world = createWorld(1);
    const a = world.attacks.acquire()!;
    a.motion = 'orbit';
    a.radius = 10;
    a.damage = 5;
    a.hitCooldownMs = 400;
    const e = enemyAt(world, 0, 0, 'brute');
    const sys = new AttackCollisionSystem();
    sys.update(world);
    expect(e.hp).toBe(ENEMY_DEFS.brute.hp - 5);
    advanceTime(world, 200);
    sys.update(world);
    expect(e.hp).toBe(ENEMY_DEFS.brute.hp - 5); // ainda em cooldown
    advanceTime(world, 300);
    sys.update(world);
    expect(e.hp).toBe(ENEMY_DEFS.brute.hp - 10);
  });

  it('mata inimigo com hp <= 0 (killEnemy: emite evento, solta gema)', () => {
    const world = createWorld(1);
    const died = vi.fn();
    world.events.on('enemy:died', died);
    const a = world.attacks.acquire()!;
    a.radius = 6;
    a.damage = 999;
    a.hitCooldownMs = 400;
    enemyAt(world, 0, 0, 'runner');
    new AttackCollisionSystem().update(world);
    expect(died).toHaveBeenCalledTimes(1);
    expect(world.enemies.activeCount).toBe(0);
    expect(world.pickups.activeCount).toBe(1);
  });

  it('não acerta inimigo fora do alcance', () => {
    const world = createWorld(1);
    const a = world.attacks.acquire()!;
    a.radius = 4;
    a.damage = 5;
    const e = enemyAt(world, 100, 0, 'brute');
    new AttackCollisionSystem().update(world);
    expect(e.hp).toBe(ENEMY_DEFS.brute.hp);
  });
});
