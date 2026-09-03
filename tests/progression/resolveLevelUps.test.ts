import { describe, it, expect, vi } from 'vitest';
import { createWorld } from '../../src/world/World';
import { resolveLevelUps, xpToNext } from '../../src/progression/xp';

describe('resolveLevelUps', () => {
  it('sobe um nível quando o XP alcança o custo e guarda o excedente', () => {
    const world = createWorld(1);
    world.progression.xp = xpToNext(1) + 2; // 9 + 2
    const up = vi.fn();
    world.events.on('player:levelup', up);
    resolveLevelUps(world);
    expect(world.progression.level).toBe(2);
    expect(world.progression.xp).toBe(2);
    expect(up).toHaveBeenCalledWith({ level: 2 });
  });

  it('encadeia múltiplos níveis numa coleta só', () => {
    const world = createWorld(1);
    world.progression.xp = xpToNext(1) + xpToNext(2) + xpToNext(3) + 1;
    const up = vi.fn();
    world.events.on('player:levelup', up);
    resolveLevelUps(world);
    expect(world.progression.level).toBe(4);
    expect(world.progression.xp).toBe(1);
    expect(up).toHaveBeenCalledTimes(3);
  });

  it('não faz nada se o XP não alcança o próximo nível', () => {
    const world = createWorld(1);
    world.progression.xp = xpToNext(1) - 1;
    const up = vi.fn();
    world.events.on('player:levelup', up);
    resolveLevelUps(world);
    expect(world.progression.level).toBe(1);
    expect(up).not.toHaveBeenCalled();
  });
});
