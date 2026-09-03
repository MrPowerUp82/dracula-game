import { describe, it, expect } from 'vitest';
import { createWorld, advanceTime } from '../../src/world/World';
import { DashSystem } from '../../src/systems/DashSystem';
import type { InputSource } from '../../src/systems/InputSystem';

function dashInput(pressed: () => boolean): InputSource {
  return { getAxis: () => ({ x: 0, y: 0 }), consumeDash: pressed };
}

describe('DashSystem', () => {
  it('sem mist-form, apertar Espaço não faz nada', () => {
    const world = createWorld(1);
    new DashSystem(dashInput(() => true)).update(world, 16);
    expect(world.player.pos).toEqual({ x: 0, y: 0 });
  });

  it('com mist-form, teleporta na direção do intent e dá i-frames', () => {
    const world = createWorld(1);
    world.powers.equip('mist-form');
    world.player.intent.x = 1;
    world.player.intent.y = 0;
    advanceTime(world, 10);
    new DashSystem(dashInput(() => true)).update(world, 16);
    expect(world.player.pos.x).toBeGreaterThan(0);
    expect(world.player.invulnUntilMs).toBeGreaterThan(world.time.elapsedMs);
  });

  it('respeita o cooldown entre dashes', () => {
    const world = createWorld(1);
    world.powers.equip('mist-form');
    world.player.intent.x = 1;
    const press = true;
    const sys = new DashSystem(dashInput(() => press));
    sys.update(world, 16);
    const x1 = world.player.pos.x;
    advanceTime(world, 500);
    sys.update(world, 500);
    expect(world.player.pos.x).toBe(x1); // ainda em cooldown
    advanceTime(world, 5000);
    sys.update(world, 5000);
    expect(world.player.pos.x).toBeGreaterThan(x1);
  });

  it('não dispara se consumeDash devolve false', () => {
    const world = createWorld(1);
    world.powers.equip('mist-form');
    world.player.intent.x = 1;
    new DashSystem(dashInput(() => false)).update(world, 16);
    expect(world.player.pos.x).toBe(0);
  });
});
