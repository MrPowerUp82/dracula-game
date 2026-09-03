import { PLAYER_BASE_SPEED } from '../config/gameConfig';

export interface Vec2 {
  x: number;
  y: number;
}

export interface PlayerStats {
  /** Pixels por segundo. */
  moveSpeed: number;
  maxHp: number;
}

export const DEFAULT_PLAYER_STATS: PlayerStats = {
  moveSpeed: PLAYER_BASE_SPEED,
  maxHp: 100,
};

/**
 * Estado puro do Drácula. Sem Phaser: a RunScene mantém um sprite separado
 * sincronizado a partir de `pos` a cada frame.
 */
export class Player {
  readonly pos: Vec2 = { x: 0, y: 0 };
  readonly vel: Vec2 = { x: 0, y: 0 };
  /** Intenção de movimento em [-1, 1] por eixo; escrita pelo InputSystem. */
  readonly intent: Vec2 = { x: 0, y: 0 };
  stats: PlayerStats = { ...DEFAULT_PLAYER_STATS };
  hp: number = DEFAULT_PLAYER_STATS.maxHp;
}
