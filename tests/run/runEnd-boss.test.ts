import { describe, it, expect } from 'vitest';
import { createWorld, advanceTime } from '../../src/world/World';
import { runOutcome } from '../../src/run/runEnd';

describe('runOutcome com chefe', () => {
  it('victory quando bossDefeated, mesmo antes do tempo', () => {
    const world = createWorld(1);
    advanceTime(world, 5000);
    world.bossDefeated = true;
    expect(runOutcome(world, 300)).toBe('victory');
  });

  it('defeat continua tendo prioridade', () => {
    const world = createWorld(1);
    world.bossDefeated = true;
    world.player.hp = 0;
    expect(runOutcome(world, 300)).toBe('defeat');
  });

  it('running quando o chefe ainda não caiu e o tempo não acabou', () => {
    const world = createWorld(1);
    advanceTime(world, 1000);
    expect(runOutcome(world, 300)).toBe('running');
  });
});
