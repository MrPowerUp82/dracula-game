import { describe, it, expect, vi } from 'vitest';
import { createWorld } from '../../src/world/World';

describe('World.boss', () => {
  it('começa com um chefe inativo e bossDefeated false', () => {
    const world = createWorld(1);
    expect(world.boss.active).toBe(false);
    expect(world.bossDefeated).toBe(false);
  });

  it('o EventBus aceita os eventos de chefe', () => {
    const world = createWorld(1);
    const spawned = vi.fn();
    const died = vi.fn();
    world.events.on('boss:spawned', spawned);
    world.events.on('boss:died', died);
    world.events.emit('boss:spawned', { defId: 'satan' });
    world.events.emit('boss:died', {});
    expect(spawned).toHaveBeenCalledWith({ defId: 'satan' });
    expect(died).toHaveBeenCalled();
  });
});
