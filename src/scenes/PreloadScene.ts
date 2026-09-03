import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    // TEMPORÁRIO: spritesheets reais (docs/PROMPTS_GEMINI.md) entram no Plano 5.
    // Texturas placeholder para o loop ser jogável.
    const player = this.add.graphics();
    player.fillStyle(0x1a1420, 1);
    player.fillRect(0, 0, 12, 20);
    player.fillStyle(0xb31217, 1);
    player.fillRect(3, 6, 6, 8);
    player.generateTexture('dev-player', 12, 20);
    player.destroy();

    const enemy = this.add.graphics();
    enemy.fillStyle(0x6a2233, 1);
    enemy.fillRect(0, 0, 10, 10);
    enemy.fillStyle(0x33141d, 1);
    enemy.fillRect(0, 0, 10, 3);
    enemy.generateTexture('dev-enemy', 10, 10);
    enemy.destroy();

    const gem = this.add.graphics();
    gem.fillStyle(0x39d0ff, 1);
    gem.fillRect(0, 0, 6, 6);
    gem.generateTexture('dev-gem', 6, 6);
    gem.destroy();
  }

  create(): void {
    this.scene.start('Run');
  }
}
