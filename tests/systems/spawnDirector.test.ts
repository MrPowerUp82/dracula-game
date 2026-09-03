import { describe, it, expect } from 'vitest';
import { createWorld, advanceTime } from '../../src/world/World';
import { SpawnDirector, MEMORY_PLACEHOLDER, type SpawnPhase } from '../../src/systems/SpawnDirector';
import { ENEMY_DEFS } from '../../src/data/enemies';
import { SPAWN_RING_RADIUS } from '../../src/config/gameConfig';

function liveBudget(world: ReturnType<typeof createWorld>): number {
  let c = 0;
  world.enemies.forEachActive((e) => {
    c += ENEMY_DEFS[e.defId].budgetCost;
  });
  return c;
}

/** Roda o director por `ms` de tempo simulado em passos de 16ms. */
function run(world: ReturnType<typeof createWorld>, dir: SpawnDirector, ms: number): void {
  for (let t = 0; t < ms; t += 16) {
    advanceTime(world, 16);
    dir.update(world);
  }
}

describe('SpawnDirector', () => {
  const soloPhase: SpawnPhase[] = [{ tSec: 0, budget: 5, pool: ['crawler'] }];

  it('enche o budget da fase e não passa dele', () => {
    const world = createWorld(1);
    const dir = new SpawnDirector(soloPhase);
    run(world, dir, 5000);
    expect(liveBudget(world)).toBe(5); // crawler custa 1, budget 5
    expect(world.enemies.activeCount).toBe(5);
  });

  it('sorteia só arquétipos da fase atual', () => {
    const world = createWorld(7);
    const dir = new SpawnDirector([{ tSec: 0, budget: 8, pool: ['runner'] }]);
    run(world, dir, 5000);
    world.enemies.forEachActive((e) => expect(e.defId).toBe('runner'));
  });

  it('surge inimigos no anel fora da tela, ao redor do jogador', () => {
    const world = createWorld(3);
    world.player.pos.x = 100;
    world.player.pos.y = -50;
    const dir = new SpawnDirector(soloPhase);
    run(world, dir, 2000);
    world.enemies.forEachActive((e) => {
      const d = Math.hypot(e.pos.x - 100, e.pos.y + 50);
      expect(d).toBeCloseTo(SPAWN_RING_RADIUS, 3);
    });
  });

  it('respeita SPAWN_INTERVAL_MS (não despeja tudo num frame)', () => {
    const world = createWorld(1);
    const dir = new SpawnDirector(soloPhase);
    advanceTime(world, 16);
    dir.update(world);
    advanceTime(world, 16);
    dir.update(world);
    expect(world.enemies.activeCount).toBe(1); // 32ms < 120ms de intervalo
  });

  it('avança de fase conforme o tempo passa', () => {
    const world = createWorld(1);
    const dir = new SpawnDirector([
      { tSec: 0, budget: 2, pool: ['crawler'] },
      { tSec: 1, budget: 12, pool: ['crawler', 'runner'] },
    ]);
    run(world, dir, 900);
    expect(liveBudget(world)).toBe(2);
    run(world, dir, 3000); // agora passou de tSec:1
    expect(liveBudget(world)).toBeGreaterThan(2);
  });

  it('nunca ultrapassa MAX_ENEMIES mesmo com budget gigante', () => {
    const world = createWorld(1);
    const dir = new SpawnDirector([{ tSec: 0, budget: 100000, pool: ['crawler'] }]);
    run(world, dir, 120000); // 2 min simulados
    expect(world.enemies.activeCount).toBeLessThanOrEqual(world.enemies.cap);
    expect(world.enemies.size).toBeLessThanOrEqual(world.enemies.cap);
  });

  it('a memória placeholder expõe uma timeline ordenada e não vazia', () => {
    expect(MEMORY_PLACEHOLDER.timeline.length).toBeGreaterThan(0);
    const ts = MEMORY_PLACEHOLDER.timeline.map((p) => p.tSec);
    expect([...ts].sort((a, b) => a - b)).toEqual(ts);
  });
});
