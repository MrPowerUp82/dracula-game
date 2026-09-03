import { describe, it, expect, vi } from 'vitest';
import { createWorld } from '../../src/world/World';
import { PickupSystem } from '../../src/systems/PickupSystem';
import { xpToNext } from '../../src/progression/xp';

describe('PickupSystem', () => {
  it('magnetiza a gema dentro do pickupRadius e a puxa para o jogador', () => {
    const world = createWorld(1);
    world.player.stats.pickupRadius = 40;
    const g = world.pickups.acquire()!;
    g.spawn('xpGem', 30, 0, 1); // dist 30 <= 40
    const sys = new PickupSystem();
    sys.update(world, 16);
    expect(g.magnetized).toBe(true);
    expect(g.pos.x).toBeLessThan(30); // aproximou
  });

  it('não magnetiza gema fora do pickupRadius', () => {
    const world = createWorld(1);
    world.player.stats.pickupRadius = 40;
    const g = world.pickups.acquire()!;
    g.spawn('xpGem', 200, 0, 1);
    new PickupSystem().update(world, 16);
    expect(g.magnetized).toBe(false);
    expect(g.pos.x).toBe(200);
  });

  it('coleta a gema ao alcançar o jogador: soma XP e devolve ao pool', () => {
    const world = createWorld(1);
    const g = world.pickups.acquire()!;
    g.spawn('xpGem', 3, 0, 4);
    g.magnetized = true;
    const sys = new PickupSystem();
    for (let i = 0; i < 30; i++) sys.update(world, 16); // tempo pra chegar
    expect(world.pickups.activeCount).toBe(0);
    expect(world.progression.xp).toBe(4);
  });

  it('coletar XP suficiente sobe de nível', () => {
    const world = createWorld(1);
    const g = world.pickups.acquire()!;
    g.spawn('xpGem', 2, 0, xpToNext(1)); // exatamente o custo do nível 1
    g.magnetized = true;
    const up = vi.fn();
    world.events.on('player:levelup', up);
    const sys = new PickupSystem();
    for (let i = 0; i < 20; i++) sys.update(world, 16);
    expect(world.progression.level).toBe(2);
    expect(up).toHaveBeenCalledWith({ level: 2 });
  });
});
