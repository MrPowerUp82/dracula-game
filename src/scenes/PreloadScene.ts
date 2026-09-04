import Phaser from 'phaser';

interface SheetMeta {
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
}
type SpriteManifest = Record<string, SheetMeta>;

// Artes estáticas ainda vivem na pasta-fonte `sprites/`. URLs importadas fazem
// o Vite incluí-las no build; os spritesheets processados continuam no manifest.
const RAW_ART = {
  title: new URL('../../sprites/art_title_key_art.jpg', import.meta.url).href,
  memory1: new URL('../../sprites/art_memory1_the_awakening.jpg', import.meta.url).href,
  hub: new URL('../../sprites/env_hub_ruined_castle.jpg', import.meta.url).href,
  m1Far: new URL('../../sprites/env_m1_courtyard_far.jpg', import.meta.url).href,
};

/**
 * Carrega todos os spritesheets processados em public/sprites/.
 * O manifest é a fonte única das dimensões dos frames, evitando hard-code de
 * largura/altura dentro das cenas. As texturas dev-* continuam como fallback.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    this.load.json('sprite-manifest', 'sprites/manifest.json');
    this.load.image('art-title', RAW_ART.title);
    this.load.image('art-memory1', RAW_ART.memory1);
    this.load.image('env-hub', RAW_ART.hub);
    this.load.image('env-m1-far', RAW_ART.m1Far);
    this.load.image('env-m1-mid', 'sprites/env_m1_courtyard_mid.png');
    this.load.image('env-m1-near', 'sprites/env_m1_courtyard_near.png');
    this.load.image('env-m2-far', 'sprites/env_m2_village_far.png');
    this.load.image('env-m2-mid', 'sprites/env_m2_village_mid.png');
    this.load.image('env-m2-near', 'sprites/env_m2_village_near.png');
    this.makeDevTextures();
  }

  create(): void {
    const manifest = this.cache.json.get('sprite-manifest') as SpriteManifest | undefined;
    if (!manifest) {
      this.scene.start('Title');
      return;
    }

    for (const [key, meta] of Object.entries(manifest)) {
      this.load.spritesheet(key, `sprites/${key}.png`, {
        frameWidth: meta.frameWidth,
        frameHeight: meta.frameHeight,
      });
    }

    this.load.once(Phaser.Loader.Events.COMPLETE, () => this.scene.start('Title'));
    this.load.start();
  }

  /** Placeholders gerados em runtime — usados somente quando uma arte falta. */
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

    const boss = this.add.graphics();
    boss.fillStyle(0x2a0f14, 1);
    boss.fillRect(0, 0, 40, 52);
    boss.fillStyle(0xb31217, 1);
    boss.fillRect(6, 10, 28, 10);
    boss.lineStyle(2, 0xf05030, 1);
    boss.strokeRect(1, 1, 38, 50);
    boss.generateTexture('dev-boss', 40, 52);
    boss.destroy();
  }
}
