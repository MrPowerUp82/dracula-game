import type { World } from '../world/World';

export type RunOutcome = 'running' | 'victory' | 'defeat';

/** Avalia o fim da run: derrota (morte) tem prioridade sobre vitória (tempo). */
export function runOutcome(world: World, memoryDurationSec: number): RunOutcome {
  if (world.player.hp <= 0) return 'defeat';
  if (world.bossDefeated) return 'victory';
  if (world.time.elapsedMs >= memoryDurationSec * 1000) return 'victory';
  return 'running';
}
