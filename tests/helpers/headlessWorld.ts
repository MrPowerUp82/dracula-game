import { createWorld, advanceTime, type World } from '../../src/world/World';
import type { System } from '../../src/systems/System';

/** Cria um World pronto para testes de integração sem render. */
export function makeWorld(seed = 1): World {
  return createWorld(seed);
}

/** Roda os sistemas por `frames` passos de `stepMs` cada. */
export function tick(world: World, systems: System[], frames: number, stepMs = 16): void {
  for (let i = 0; i < frames; i++) {
    advanceTime(world, stepMs);
    for (const system of systems) system.update(world, stepMs);
  }
}
