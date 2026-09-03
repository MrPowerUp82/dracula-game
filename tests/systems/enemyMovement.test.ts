import { describe, it, expect } from 'vitest';
import { createWorld } from '../../src/world/World';
import { EnemyMovementSystem } from '../../src/systems/EnemyMovementSystem';
import { ENEMY_DEFS } from '../../src/data/enemies';

describe('EnemyMovementSystem', () => {
  it('move o inimigo em direção ao jogador a speed px/s', () => {
    const world = createWorld(1);
    world.player.pos.x = 0;
    world.player.pos.y = 0;
    const e = world.enemies.acquire()!;
    e.spawn(ENEMY_DEFS.crawler, 100, 0); // speed 30
    new EnemyMovementSystem().update(world, 1000);
    expect(e.pos.x).toBeCloseTo(70); // andou 30 para a esquerda
    expect(e.pos.y).toBeCloseTo(0);
  });

  it('normaliza a diagonal', () => {
    const world = createWorld(1);
    const e = world.enemies.acquire()!;
    e.spawn(ENEMY_DEFS.crawler, 100, 100);
    new EnemyMovementSystem().update(world, 1000);
    const traveled = Math.hypot(100 - e.pos.x, 100 - e.pos.y);
    expect(traveled).toBeCloseTo(30);
  });

  it('move todos os inimigos ativos e ignora os inativos', () => {
    const world = createWorld(1);
    const a = world.enemies.acquire()!;
    const b = world.enemies.acquire()!;
    a.spawn(ENEMY_DEFS.runner, 50, 0);
    b.spawn(ENEMY_DEFS.runner, -50, 0);
    world.enemies.release(b);
    new EnemyMovementSystem().update(world, 100);
    expect(a.pos.x).toBeLessThan(50); // aproximou
    expect(b.pos.x).toBe(-50); // inativo, não mexeu
  });
});
