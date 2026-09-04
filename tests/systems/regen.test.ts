import { describe, it, expect } from 'vitest';
import { createWorld } from '../../src/world/World';
import { RegenSystem } from '../../src/systems/RegenSystem';

describe('RegenSystem', () => {
  it('regenera vida por segundo até o maxHp', () => {
    const world = createWorld(1);
    world.player.stats.addModifiers('t', [{ key: 'hpRegen', flat: 10 }]);
    world.player.hp = 50;
    new RegenSystem().update(world, 1000);
    expect(world.player.hp).toBeCloseTo(60);
    world.player.hp = world.player.stats.get('maxHp') - 1;
    new RegenSystem().update(world, 1000);
    expect(world.player.hp).toBe(world.player.stats.get('maxHp'));
  });

  it('sem hpRegen não faz nada', () => {
    const world = createWorld(1);
    world.player.hp = 50;
    new RegenSystem().update(world, 1000);
    expect(world.player.hp).toBe(50);
  });
});
