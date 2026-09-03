import { describe, it, expect } from 'vitest';
import { createWorld } from '../../src/world/World';
import { MAX_PROJECTILES } from '../../src/config/gameConfig';

describe('World.attacks', () => {
  it('cria o pool de attacks com o teto do gameConfig', () => {
    const world = createWorld(1);
    expect(world.attacks.cap).toBe(MAX_PROJECTILES);
    expect(world.attacks.activeCount).toBe(0);
  });
});
