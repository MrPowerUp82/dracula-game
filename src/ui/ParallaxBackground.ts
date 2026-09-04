import Phaser from 'phaser';
import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config/gameConfig';
import { memoryVisual } from '../data/memoryVisuals';

interface Layer { sprite: Phaser.GameObjects.TileSprite; factor: number; }

/**
 * M1/M2 usam suas artes dedicadas. M3–M5 usam composições/tints de assets
 * existentes como fallback até os sprites finais dessas memórias serem gerados.
 */
export class ParallaxBackground {
  private readonly layers: Layer[] = [];

  constructor(scene: Phaser.Scene, memoryId: string) {
    const cfg = memoryVisual(memoryId);
    const factors = [0.08, 0.16, 0.28];
    const depths = [-30, -29, -28];

    cfg.parallaxKeys.forEach((key, i) => {
      if (!scene.textures.exists(key)) return;
      const sprite = scene.add.tileSprite(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT, key)
        .setOrigin(0).setScrollFactor(0).setDepth(depths[i]).setTint(cfg.tint);
      const source = scene.textures.get(key).getSourceImage() as { width: number; height: number };
      const tileScale = source.height > 0 ? LOGICAL_HEIGHT / source.height : 1;
      sprite.setTileScale(tileScale, tileScale);
      this.layers.push({ sprite, factor: factors[i] });
    });
  }

  update(cameraX: number): void {
    for (const { sprite, factor } of this.layers) sprite.tilePositionX = cameraX * factor;
  }

  destroy(): void {
    for (const { sprite } of this.layers) sprite.destroy();
    this.layers.length = 0;
  }
}
