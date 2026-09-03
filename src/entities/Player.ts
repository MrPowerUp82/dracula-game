import { PLAYER_RADIUS } from '../config/gameConfig';
import { Stats, BASE_STATS } from '../stats/Stats';

export interface Vec2 {
  x: number;
  y: number;
}

/**
 * Estado puro do Drácula. Sem Phaser: a RunScene mantém um sprite separado
 * sincronizado a partir de `pos` a cada frame.
 */
export class Player {
  readonly pos: Vec2 = { x: 0, y: 0 };
  readonly vel: Vec2 = { x: 0, y: 0 };
  /** Intenção de movimento em [-1, 1] por eixo; escrita pelo InputSystem. */
  readonly intent: Vec2 = { x: 0, y: 0 };
  readonly stats = new Stats();
  hp: number = BASE_STATS.maxHp;
  /** Raio de colisão, px. */
  radius: number = PLAYER_RADIUS;
  /** Enquanto `world.time.elapsedMs < invulnUntilMs`, não toma dano de contato. */
  invulnUntilMs = 0;
}
