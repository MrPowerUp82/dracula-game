import { Rng } from '../core/Rng';
import { EventBus } from '../core/EventBus';
import { Pool } from '../core/Pool';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';
import { Pickup } from '../entities/Pickup';
import { Attack } from '../entities/Attack';
import { Boss } from '../entities/Boss';
import { PowerRoster } from '../powers/PowerRoster';
import { BASE_DRAFT_POOL } from '../data/powers';
import { MAX_ENEMIES, MAX_PICKUPS, MAX_PROJECTILES } from '../config/gameConfig';

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

export interface Progression {
  level: number;
  /** XP acumulado dentro do nível atual. */
  xp: number;
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
  enemies: Pool<Enemy>;
  pickups: Pool<Pickup>;
  attacks: Pool<Attack>;
  powers: PowerRoster;
  progression: Progression;
  /** ids de poder que podem ser sorteados nas cartas de upgrade desta run. */
  draftPool: string[];
  boss: Boss;
  bossDefeated: boolean;
}

export function createWorld(seed: number): World {
  const player = new Player();
  return {
    rng: new Rng(seed),
    events: new EventBus(),
    time: { elapsedMs: 0, deltaMs: 0 },
    camera: { x: player.pos.x, y: player.pos.y },
    player,
    enemies: new Pool<Enemy>(() => new Enemy(), MAX_ENEMIES),
    pickups: new Pool<Pickup>(() => new Pickup(), MAX_PICKUPS),
    attacks: new Pool<Attack>(() => new Attack(), MAX_PROJECTILES),
    powers: new PowerRoster(),
    progression: { level: 1, xp: 0 },
    draftPool: [...BASE_DRAFT_POOL],
    boss: new Boss(),
    bossDefeated: false,
  };
}

/** Avança o relógio da run. Chamado uma vez por frame, antes dos sistemas. */
export function advanceTime(world: World, deltaMs: number): void {
  world.time.deltaMs = deltaMs;
  world.time.elapsedMs += deltaMs;
}
