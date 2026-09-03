import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    // TEMPORÁRIO: os spritesheets reais (ver docs/PROMPTS_GEMINI.md) entram no
    // Plano 5. Por ora, geramos uma textura placeholder para o loop ser jogável.
    const g = this.add.graphics();
    g.fillStyle(0x1a1420, 1);
    g.fillRect(0, 0, 12, 20); // corpo/capa
    g.fillStyle(0xb31217, 1);
    g.fillRect(3, 6, 6, 8); // destaque vermelho-sangue
    g.generateTexture('dev-player', 12, 20);
    g.destroy();
  }

  create(): void {
    this.scene.start('Run');
  }
}
