import { Rng } from '../core/Rng';
import { EventBus } from '../core/EventBus';
import { Player } from '../entities/Player';

export interface WorldTime {
  /** Tempo total decorrido na run, em ms. */
  elapsedMs: number;
  /** Delta do frame atual, em ms. */
  deltaMs: number;
}

export interface Camera {
  x: number;
  y: number;
}

/**
 * Agregado de todo o estado de uma run. É o único objeto que os sistemas
 * recebem. Sem Phaser — a RunScene lê daqui para desenhar.
 */
export interface World {
  rng: Rng;
  events: EventBus;
  time: WorldTime;
  camera: Camera;
  player: Player;
}

export function createWorld(seed: number): World {
  const player = new Player();
  return {
    rng: new Rng(seed),
    events: new EventBus(),
    time: { elapsedMs: 0, deltaMs: 0 },
    camera: { x: player.pos.x, y: player.pos.y },
    player,
  };
}

/** Avança o relógio da run. Chamado uma vez por frame, antes dos sistemas. */
export function advanceTime(world: World, deltaMs: number): void {
  world.time.deltaMs = deltaMs;
  world.time.elapsedMs += deltaMs;
}
