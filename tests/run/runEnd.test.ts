import { describe, it, expect } from 'vitest';
import { createWorld, advanceTime } from '../../src/world/World';
import { runOutcome } from '../../src/run/runEnd';

describe('runOutcome', () => {
  it('running enquanto vivo e antes do tempo', () => {
    const world = createWorld(1);
    advanceTime(world, 1000);
    expect(runOutcome(world, 300)).toBe('running');
  });

  it('defeat quando hp <= 0', () => {
    const world = createWorld(1);
    world.player.hp = 0;
    expect(runOutcome(world, 300)).toBe('defeat');
  });

  it('victory quando o tempo da memória é alcançado', () => {
    const world = createWorld(1);
    advanceTime(world, 300_000);
    expect(runOutcome(world, 300)).toBe('victory');
  });

  it('defeat tem prioridade sobre victory', () => {
    const world = createWorld(1);
    advanceTime(world, 300_000);
    world.player.hp = 0;
    expect(runOutcome(world, 300)).toBe('defeat');
  });
});
