import type { World } from '../world/World';
import type { System } from './System';

/**
 * Abstrai o dispositivo de entrada para a lógica continuar headless-testável.
 * Implementação real com Phaser: `src/input/PhaserInputSource.ts`.
 */
export interface InputSource {
  /** Eixo por componente; a magnitude pode passar de 1 na diagonal. */
  getAxis(): { x: number; y: number };
  /** `true` uma vez por pressionamento da tecla de dash (Espaço). */
  consumeDash(): boolean;
}

export class InputSystem implements System {
  constructor(private readonly source: InputSource) {}

  update(world: World): void {
    const axis = this.source.getAxis();
    world.player.intent.x = clamp(axis.x, -1, 1);
    world.player.intent.y = clamp(axis.y, -1, 1);
  }
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}
