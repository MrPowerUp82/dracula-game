import { describe, it, expect } from 'vitest';
import { createWorld } from '../../src/world/World';
import { MovementSystem } from '../../src/systems/MovementSystem';
import { InputSystem, type InputSource } from '../../src/systems/InputSystem';

function fixedInput(x: number, y: number): InputSource {
  return { getAxis: () => ({ x, y }) };
}

describe('InputSystem + MovementSystem', () => {
  it('move o player para a direita a moveSpeed px/s', () => {
    const world = createWorld(1);
    world.player.stats.setBase('moveSpeed', 100);
    const systems = [new InputSystem(fixedInput(1, 0)), new MovementSystem()];
    for (const s of systems) s.update(world, 1000);
    expect(world.player.pos.x).toBeCloseTo(100);
    expect(world.player.pos.y).toBeCloseTo(0);
  });

  it('normaliza a diagonal (não anda mais rápido em 45°)', () => {
    const world = createWorld(1);
    world.player.stats.setBase('moveSpeed', 100);
    const systems = [new InputSystem(fixedInput(1, 1)), new MovementSystem()];
    for (const s of systems) s.update(world, 1000);
    const dist = Math.hypot(world.player.pos.x, world.player.pos.y);
    expect(dist).toBeCloseTo(100);
  });

  it('para quando não há intent', () => {
    const world = createWorld(1);
    world.player.stats.setBase('moveSpeed', 100);
    const systems = [new InputSystem(fixedInput(0, 0)), new MovementSystem()];
    for (const s of systems) s.update(world, 1000);
    expect(world.player.pos.x).toBe(0);
    expect(world.player.vel.x).toBe(0);
  });

  it('clampa eixos fora de [-1, 1] vindos da fonte de input', () => {
    const world = createWorld(1);
    world.player.stats.setBase('moveSpeed', 100);
    new InputSystem(fixedInput(5, -9)).update(world);
    expect(world.player.intent.x).toBe(1);
    expect(world.player.intent.y).toBe(-1);
  });
});
