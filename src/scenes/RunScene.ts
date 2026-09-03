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
  private playerSprite!: Phaser.GameObjects.Image;
  private enemySprites: Phaser.GameObjects.Image[] = [];
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
    this.playerSprite = this.add.image(0, 0, 'dev-player').setDepth(5);

    // TEMPORÁRIO: HUD real entra no Plano 5.
    this.debugText = this.add
      .text(6, 6, '', { fontFamily: 'monospace', fontSize: '10px', color: '#e8d0d0' })
      .setScrollFactor(0)
      .setDepth(100);
  }

  update(_time: number, delta: number): void {
    advanceTime(this.world, delta);
    for (const system of this.systems) system.update(this.world, delta);

    this.playerSprite.setPosition(this.world.player.pos.x, this.world.player.pos.y);
    this.cameras.main.centerOn(this.world.camera.x, this.world.camera.y);

    this.syncSprites(this.enemySprites, 'dev-enemy', (draw) => {
      this.world.enemies.forEachActive((e) => draw(e.pos.x, e.pos.y));
    });
    this.syncSprites(this.gemSprites, 'dev-gem', (draw) => {
      this.world.pickups.forEachActive((g) => draw(g.pos.x, g.pos.y));
    });

    const p = this.world.player;
    this.debugText.setText(
      `HP ${Math.ceil(p.hp)}  Lv ${this.world.progression.level}  ` +
        `XP ${this.world.progression.xp}  inimigos ${this.world.enemies.activeCount}`,
    );
  }

  /** Reaproveita um array de sprites: mostra um por item desenhado, esconde o resto. */
  private syncSprites(
    sprites: Phaser.GameObjects.Image[],
    texture: string,
    forEach: (draw: (x: number, y: number) => void) => void,
  ): void {
    let i = 0;
    forEach((x, y) => {
      let s = sprites[i];
      if (!s) {
        s = this.add.image(0, 0, texture).setDepth(3);
        sprites[i] = s;
      }
      s.setVisible(true).setPosition(x, y);
      i++;
    });
    for (let j = i; j < sprites.length; j++) sprites[j].setVisible(false);
  }
}
