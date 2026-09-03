import Phaser from 'phaser';
import { createWorld, advanceTime, type World } from '../world/World';
import type { System } from '../systems/System';
import { InputSystem } from '../systems/InputSystem';
import { MovementSystem } from '../systems/MovementSystem';
import { CameraSystem } from '../systems/CameraSystem';
import { SpawnDirector } from '../systems/SpawnDirector';
import { EnemyMovementSystem } from '../systems/EnemyMovementSystem';
import { PlayerAttackSystem } from '../systems/PlayerAttackSystem';
import { ContactDamageSystem } from '../systems/ContactDamageSystem';
import { PickupSystem } from '../systems/PickupSystem';
import { PhaserInputSource } from '../input/PhaserInputSource';
import { MEMORY_PLACEHOLDER } from '../data/memories';

export class RunScene extends Phaser.Scene {
  private world!: World;
  private systems: System[] = [];
  private playerSprite!: Phaser.GameObjects.Sprite;
  private enemySprites: Phaser.GameObjects.Sprite[] = [];
  private gemSprites: Phaser.GameObjects.Image[] = [];
  private debugText!: Phaser.GameObjects.Text;

  constructor() {
    super('Run');
  }

  create(): void {
    const seed = Math.floor(Math.random() * 0xffffffff) >>> 0;
    this.world = createWorld(seed);

    const input = new PhaserInputSource(this);
    // ordem fixa (design §5.1, subconjunto do Plano 2)
    this.systems = [
      new SpawnDirector(MEMORY_PLACEHOLDER.timeline),
      new InputSystem(input),
      new MovementSystem(),
      new EnemyMovementSystem(),
      new PlayerAttackSystem(),
      new ContactDamageSystem(),
      new PickupSystem(),
      new CameraSystem(),
    ];

    this.add.grid(0, 0, 4000, 4000, 32, 32, 0x140d1c, 1, 0x241a30, 1).setDepth(-10);

    this.registerAnim('dracula-idle', 5, -1);
    this.registerAnim('dracula-walk', 9, -1);
    this.registerAnim('crawler-walk', 7, -1);

    const hasDracula = this.textures.exists('dracula-idle');
    this.playerSprite = this.add.sprite(0, 0, hasDracula ? 'dracula-idle' : 'dev-player').setDepth(5);
    if (hasDracula) this.playerSprite.play('dracula-idle');

    // TEMPORÁRIO: HUD real entra no Plano 5.
    this.debugText = this.add
      .text(6, 6, '', { fontFamily: 'monospace', fontSize: '10px', color: '#e8d0d0' })
      .setScrollFactor(0)
      .setDepth(100);
  }

  update(_time: number, delta: number): void {
    advanceTime(this.world, delta);
    for (const system of this.systems) system.update(this.world, delta);

    this.syncPlayer();
    this.cameras.main.centerOn(this.world.camera.x, this.world.camera.y);
    this.syncEnemies();
    this.syncGems();

    const p = this.world.player;
    this.debugText.setText(
      `HP ${Math.ceil(p.hp)}  Lv ${this.world.progression.level}  ` +
        `XP ${this.world.progression.xp}  inimigos ${this.world.enemies.activeCount}`,
    );
  }

  private syncPlayer(): void {
    const p = this.world.player;
    this.playerSprite.setPosition(p.pos.x, p.pos.y);
    if (Math.abs(p.vel.x) > 1) this.playerSprite.setFlipX(p.vel.x < 0);

    if (!this.textures.exists('dracula-idle')) return;
    const moving = Math.hypot(p.vel.x, p.vel.y) > 1;
    const want = moving ? 'dracula-walk' : 'dracula-idle';
    if (this.playerSprite.anims.getName() !== want) this.playerSprite.play(want, true);
  }

  private syncEnemies(): void {
    const px = this.world.player.pos.x;
    const hasCrawler = this.textures.exists('crawler-walk');
    let i = 0;
    this.world.enemies.forEachActive((e) => {
      let s = this.enemySprites[i];
      if (!s) {
        s = this.add.sprite(0, 0, 'dev-enemy').setDepth(3);
        this.enemySprites[i] = s;
      }
      const useArt = e.defId === 'crawler' && hasCrawler;
      const tex = useArt ? 'crawler-walk' : 'dev-enemy';
      if (s.texture.key !== tex) {
        s.setTexture(tex);
        if (useArt) s.play('crawler-walk', true);
        else s.anims.stop();
      }
      s.setVisible(true).setPosition(e.pos.x, e.pos.y);
      s.setFlipX(px < e.pos.x);
      i++;
    });
    for (let j = i; j < this.enemySprites.length; j++) this.enemySprites[j].setVisible(false);
  }

  private syncGems(): void {
    let i = 0;
    this.world.pickups.forEachActive((g) => {
      let s = this.gemSprites[i];
      if (!s) {
        s = this.add.image(0, 0, 'dev-gem').setDepth(2);
        this.gemSprites[i] = s;
      }
      s.setVisible(true).setPosition(g.pos.x, g.pos.y);
      i++;
    });
    for (let j = i; j < this.gemSprites.length; j++) this.gemSprites[j].setVisible(false);
  }

  /** Cria uma animação a partir de um spritesheet, se ele existir e ainda não houver. */
  private registerAnim(key: string, frameRate: number, repeat: number): void {
    if (this.anims.exists(key) || !this.textures.exists(key)) return;
    this.anims.create({
      key,
      frames: this.anims.generateFrameNumbers(key, { start: 0, end: -1 }),
      frameRate,
      repeat,
    });
  }
}
