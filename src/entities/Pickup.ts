import type { Poolable } from '../core/Pool';
import type { Vec2 } from './Player';

export type PickupKind = 'xpGem';

/**
 * Estado puro de um coletável. Reciclado por um Pool. No Plano 2 só existe
 * `xpGem`; essência de sangue, coração e relíquia entram no Plano 4.
 */
export class Pickup implements Poolable {
  active = false;
  readonly pos: Vec2 = { x: 0, y: 0 };
  kind: PickupKind = 'xpGem';
  value = 0;
  /** Uma vez atraído para o jogador, persegue-o até ser coletado. */
  magnetized = false;

  spawn(kind: PickupKind, x: number, y: number, value: number): void {
    this.kind = kind;
    this.pos.x = x;
    this.pos.y = y;
    this.value = value;
    this.magnetized = false;
  }

  reset(): void {
    this.kind = 'xpGem';
    this.pos.x = 0;
    this.pos.y = 0;
    this.value = 0;
    this.magnetized = false;
  }
}
