import type { World } from '../world/World';
import type { System } from './System';
import { CAMERA_SMOOTHING_PER_SECOND } from '../config/gameConfig';

/**
 * Suavização exponencial frame-independente de um eixo em direção ao alvo.
 * `smoothingPerSecond` = fração da distância coberta em 1 segundo (0..1).
 */
export function lerpCamera(
  current: number,
  target: number,
  smoothingPerSecond: number,
  deltaMs: number,
): number {
  if (deltaMs <= 0) return current;
  const t = 1 - Math.pow(1 - smoothingPerSecond, deltaMs / 1000);
  return current + (target - current) * t;
}

export class CameraSystem implements System {
  constructor(private readonly smoothingPerSecond: number = CAMERA_SMOOTHING_PER_SECOND) {}

  update(world: World, deltaMs: number): void {
    world.camera.x = lerpCamera(world.camera.x, world.player.pos.x, this.smoothingPerSecond, deltaMs);
    world.camera.y = lerpCamera(world.camera.y, world.player.pos.y, this.smoothingPerSecond, deltaMs);
  }
}
