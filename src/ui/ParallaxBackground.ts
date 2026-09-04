import Phaser from 'phaser';
import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config/gameConfig';

interface Layer {
  sprite: Phaser.GameObjects.TileSprite;
  factor: number;
}

export class ParallaxBackground {
  private readonly layers: Layer[] = [];

  constructor(scene: Phaser.Scene, memoryId: string) {
    const prefix = memoryId === 'm2' ? 'env-m2' : 'env-m1';
    const defs = [
      { key: `${prefix}-far`, factor: 0.08, depth: -30 },
      { key: `${prefix}-mid`, factor: 0.16, depth: -29 },
      { key: `${prefix}-near`, factor: 0.28, depth: -28 },
    ];

    for (const def of defs) {
      if (!scene.textures.exists(def.key)) continue;
      const sprite = scene.add
        .tileSprite(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT, def.key)
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(def.depth);
      this.layers.push({ sprite, factor: def.factor });
    }
  }

  update(cameraX: number): void {
    for (const { sprite, factor } of this.layers) {
      sprite.tilePositionX = cameraX * factor;
    }
  }

  destroy(): void {
    for (const { sprite } of this.layers) sprite.destroy();
    this.layers.length = 0;
  }
}
