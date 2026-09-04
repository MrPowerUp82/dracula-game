import { describe, it, expect } from 'vitest';
import { createWorld, advanceTime } from '../../src/world/World';
import { SpawnDirector } from '../../src/systems/SpawnDirector';
import { BOSS_DEFS } from '../../src/data/bosses';

describe('SpawnDirector pausa durante o chefe', () => {
  it('não surge inimigos comuns enquanto world.boss.active', () => {
    const world = createWorld(1);
    const dir = new SpawnDirector([{ tSec: 0, budget: 20, pool: ['crawler'] }]);
    world.boss.spawn(BOSS_DEFS['profaner-knight'], 500, 0);
    for (let t = 0; t < 5000; t += 16) {
      advanceTime(world, 16);
      dir.update(world);
    }
    expect(world.enemies.activeCount).toBe(0);
  });
});
