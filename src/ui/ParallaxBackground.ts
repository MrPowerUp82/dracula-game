import Phaser from 'phaser';
import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config/gameConfig';

interface Layer { sprite: Phaser.GameObjects.TileSprite; factor: number; }

/**
 * M1/M2 usam suas artes dedicadas. M3–M5 usam composições/tints de assets
 * existentes como fallback até os sprites finais dessas memórias serem gerados.
 */
export class ParallaxBackground {
  private readonly layers: Layer[] = [];

  constructor(scene: Phaser.Scene, memoryId: string) {
    const palettes: Record<string, { keys: string[]; tint: number }> = {
      m1: { keys: ['env-m1-far', 'env-m1-mid', 'env-m1-near'], tint: 0xffffff },
      m2: { keys: ['env-m2-far', 'env-m2-mid', 'env-m2-near'], tint: 0xffffff },
      m3: { keys: ['env-m2-far', 'env-m1-mid', 'env-m2-near'], tint: 0xd6b18a },
      m4: { keys: ['env-hub', 'env-m1-mid', 'env-m1-near'], tint: 0x9a83b8 },
      m5: { keys: ['env-m2-far', 'env-m2-mid', 'env-m2-near'], tint: 0xb84a3b },
    };
    const cfg = palettes[memoryId] ?? palettes.m1;
    const factors = [0.08, 0.16, 0.28];
    const depths = [-30, -29, -28];

    cfg.keys.forEach((key, i) => {
      if (!scene.textures.exists(key)) return;
      const sprite = scene.add.tileSprite(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT, key)
        .setOrigin(0).setScrollFactor(0).setDepth(depths[i]).setTint(cfg.tint);
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
