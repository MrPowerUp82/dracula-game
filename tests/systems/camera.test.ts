import { describe, it, expect } from 'vitest';
import { lerpCamera, CameraSystem } from '../../src/systems/CameraSystem';
import { createWorld } from '../../src/world/World';

describe('lerpCamera', () => {
  it('não se move quando o delta é zero', () => {
    expect(lerpCamera(0, 100, 0.9, 0)).toBe(0);
  });

  it('converge para o alvo ao longo do tempo', () => {
    let x = 0;
    for (let i = 0; i < 240; i++) x = lerpCamera(x, 100, 0.9, 16);
    expect(x).toBeCloseTo(100, 1);
  });

  it('nunca ultrapassa o alvo', () => {
    let x = 0;
    for (let i = 0; i < 20; i++) {
      x = lerpCamera(x, 100, 0.9, 16);
      expect(x).toBeLessThanOrEqual(100);
    }
  });
});

describe('CameraSystem', () => {
  it('puxa a câmera até a posição do player', () => {
    const world = createWorld(1);
    world.player.pos.x = 200;
    world.player.pos.y = -50;
    const cam = new CameraSystem(0.9);
    for (let i = 0; i < 240; i++) cam.update(world, 16);
    expect(world.camera.x).toBeCloseTo(200, 0);
    expect(world.camera.y).toBeCloseTo(-50, 0);
  });
});
