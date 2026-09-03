import { describe, it, expect } from 'vitest';
import { createWorld } from '../../src/world/World';
import { MAX_ENEMIES, MAX_PICKUPS } from '../../src/config/gameConfig';

describe('World (pools + progressão)', () => {
  it('cria pools de inimigos e gemas com os tetos do gameConfig', () => {
    const world = createWorld(1);
    expect(world.enemies.cap).toBe(MAX_ENEMIES);
    expect(world.pickups.cap).toBe(MAX_PICKUPS);
    expect(world.enemies.activeCount).toBe(0);
    expect(world.pickups.activeCount).toBe(0);
  });

  it('começa a progressão no nível 1 sem XP', () => {
    const world = createWorld(1);
    expect(world.progression).toEqual({ level: 1, xp: 0 });
  });
});
