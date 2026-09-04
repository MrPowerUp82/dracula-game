import type { System } from './System';
import type { World } from '../world/World';
import { ENEMY_DEFS } from '../data/enemies';
import { SPAWN_RING_RADIUS, SPAWN_INTERVAL_MS } from '../config/gameConfig';
import type { SpawnPhase } from '../data/memories';

export { MEMORY_PLACEHOLDER } from '../data/memories';
export type { SpawnPhase, MemoryDef } from '../data/memories';

/**
 * Mantém o "budget" de inimigos vivos da fase atual, surgindo um inimigo por
 * vez (respeitando SPAWN_INTERVAL_MS) num anel fora da tela ao redor do jogador.
 * Nunca ultrapassa o teto do pool.
 */
export class SpawnDirector implements System {
  private lastSpawnAtMs = -Infinity;

  constructor(private readonly timeline: SpawnPhase[]) {}

  update(world: World): void {
    if (world.boss.active) return; // sem inimigos comuns durante o confronto
    const elapsed = world.time.elapsedMs;
    if (elapsed - this.lastSpawnAtMs < SPAWN_INTERVAL_MS) return;

    const phase = this.currentPhase(elapsed);
    if (this.liveBudget(world) >= phase.budget) return;

    const def = ENEMY_DEFS[world.rng.pick(phase.pool)];
    const enemy = world.enemies.acquire();
    if (!enemy) return; // pool cheio — teto rígido

    const angle = world.rng.next() * Math.PI * 2;
    const x = world.player.pos.x + Math.cos(angle) * SPAWN_RING_RADIUS;
    const y = world.player.pos.y + Math.sin(angle) * SPAWN_RING_RADIUS;
    enemy.spawn(def, x, y);
    this.lastSpawnAtMs = elapsed;
  }

  private currentPhase(elapsedMs: number): SpawnPhase {
    const tSec = elapsedMs / 1000;
    let phase = this.timeline[0];
    for (const ph of this.timeline) {
      if (tSec >= ph.tSec) phase = ph;
    }
    return phase;
  }

  private liveBudget(world: World): number {
    let cost = 0;
    world.enemies.forEachActive((e) => {
      cost += ENEMY_DEFS[e.defId].budgetCost;
    });
    return cost;
  }
}
