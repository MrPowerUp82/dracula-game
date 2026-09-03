import Phaser from 'phaser';

interface SheetMeta {
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
}
type SpriteManifest = Record<string, SheetMeta>;

/**
 * Carrega os spritesheets processados (public/sprites/, gerados por
 * `node tools/process-sprites.mjs`). Duas fases: primeiro o manifest com as
 * dimensões de frame, depois os próprios sheets. Texturas `dev-*` ficam como
 * fallback caso algum sheet falte.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    this.load.json('sprite-manifest', 'sprites/manifest.json');
    this.makeDevTextures();
  }

  create(): void {
    const manifest = this.cache.json.get('sprite-manifest') as SpriteManifest | undefined;
    if (!manifest) {
      this.scene.start('Run');
      return;
    }

    for (const [key, meta] of Object.entries(manifest)) {
      this.load.spritesheet(key, `sprites/${key}.png`, {
        frameWidth: meta.frameWidth,
        frameHeight: meta.frameHeight,
      });
    }
    this.load.once(Phaser.Loader.Events.COMPLETE, () => this.scene.start('Run'));
    this.load.start();
  }

  /** Placeholders gerados em runtime — usados enquanto não há arte real. */
  private makeDevTextures(): void {
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

    const bat = this.add.graphics();
    bat.fillStyle(0x120a16, 1);
    bat.fillCircle(4, 4, 4);
    bat.fillStyle(0xb31217, 1);
    bat.fillRect(3, 3, 2, 2);
    bat.generateTexture('dev-bat', 8, 8);
    bat.destroy();

    const spear = this.add.graphics();
    spear.fillStyle(0xb31217, 1);
    spear.fillRect(0, 0, 10, 3);
    spear.fillStyle(0xf05030, 1);
    spear.fillRect(8, 0, 2, 3);
    spear.generateTexture('dev-spear', 10, 3);
    spear.destroy();

    const aura = this.add.graphics();
    aura.lineStyle(3, 0xb31217, 0.8);
    aura.strokeCircle(48, 48, 45);
    aura.fillStyle(0xb31217, 0.08);
    aura.fillCircle(48, 48, 45);
    aura.generateTexture('dev-aura', 96, 96);
    aura.destroy();
  }
}
