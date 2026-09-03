import { describe, it, expect } from 'vitest';
import { createWorld, advanceTime } from '../../src/world/World';
import { Rng } from '../../src/core/Rng';

describe('World', () => {
  it('semeia o RNG de forma determinística a partir da seed', () => {
    const world = createWorld(2024);
    expect(world.rng.next()).toBe(new Rng(2024).next());
  });

  it('inicia a câmera na posição do player', () => {
    const world = createWorld(1);
    expect(world.camera.x).toBe(world.player.pos.x);
    expect(world.camera.y).toBe(world.player.pos.y);
  });

  it('advanceTime acumula elapsed e guarda o último delta', () => {
    const world = createWorld(1);
    advanceTime(world, 16);
    advanceTime(world, 20);
    expect(world.time.elapsedMs).toBe(36);
    expect(world.time.deltaMs).toBe(20);
  });
});
