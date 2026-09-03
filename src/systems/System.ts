import type { World } from '../world/World';

/** Um sistema roda uma vez por frame, na ordem fixa definida pela RunScene. */
export interface System {
  update(world: World, deltaMs: number): void;
}
