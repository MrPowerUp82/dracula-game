import { describe, it, expect, vi } from 'vitest';
import { createWorld } from '../../src/world/World';
import { damageBoss } from '../../src/combat/boss';
import { BOSS_DEFS } from '../../src/data/bosses';

describe('damageBoss', () => {
  it('não fere o chefe na intro', () => {
    const world = createWorld(1);
    world.boss.spawn(BOSS_DEFS['profaner-knight'], 0, 0); // phase 'intro'
    damageBoss(world, 100);
    expect(world.boss.hp).toBe(BOSS_DEFS['profaner-knight'].hp);
  });

  it('fere o chefe fora da intro', () => {
    const world = createWorld(1);
    world.boss.spawn(BOSS_DEFS['profaner-knight'], 0, 0);
    world.boss.phase = 'p1';
    damageBoss(world, 100);
    expect(world.boss.hp).toBe(BOSS_DEFS['profaner-knight'].hp - 100);
  });

  it('hp <= 0 => morto, inativo, bossDefeated, evento', () => {
    const world = createWorld(1);
    const died = vi.fn();
    world.events.on('boss:died', died);
    world.boss.spawn(BOSS_DEFS['profaner-knight'], 0, 0);
    world.boss.phase = 'p1';
    damageBoss(world, 99999);
    expect(world.boss.hp).toBe(0);
    expect(world.boss.active).toBe(false);
    expect(world.boss.phase).toBe('dead');
    expect(world.bossDefeated).toBe(true);
    expect(died).toHaveBeenCalledTimes(1);
  });
});
