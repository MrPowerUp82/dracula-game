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
import { PowerSystem } from '../systems/PowerSystem';
import { AttackMotionSystem } from '../systems/AttackMotionSystem';
import { AttackCollisionSystem } from '../systems/AttackCollisionSystem';
import { DashSystem } from '../systems/DashSystem';
import { RegenSystem } from '../systems/RegenSystem';
import { PhaserInputSource } from '../input/PhaserInputSource';
import { MEMORIES, type MemoryDef } from '../data/memories';
import { AURA_TEX_SIZE } from '../config/gameConfig';
import { applyMetaToWorld } from '../save/applyToRun';
import { runOutcome } from '../run/runEnd';
import type { SaveDataV1 } from '../save/SaveData';

export class RunScene extends Phaser.Scene {
  private world!: World;
  private systems: System[] = [];
  private memory!: MemoryDef;
  private kills = 0;
  private ended = false;
  private playerSprite!: Phaser.GameObjects.Sprite;
  private enemySprites: Phaser.GameObjects.Sprite[] = [];
  private gemSprites: Phaser.GameObjects.Image[] = [];
  private attackSprites: Phaser.GameObjects.Image[] = [];
  private debugText!: Phaser.GameObjects.Text;
  private pendingLevelUps = 0;

  constructor() {
    super('Run');
  }

  create(): void {
    this.kills = 0;
    this.ended = false;
    this.pendingLevelUps = 0;
    this.memory = (this.registry.get('selectedMemory') as MemoryDef | undefined) ?? MEMORIES[0];

    const seed = Math.floor(Math.random() * 0xffffffff) >>> 0;
    this.world = createWorld(seed);

    const save = this.registry.get('save') as SaveDataV1 | undefined;
    if (save) applyMetaToWorld(this.world, save);

    const input = new PhaserInputSource(this);
    this.systems = [
      new SpawnDirector(this.memory.timeline),
      new InputSystem(input),
      new MovementSystem(),
      new DashSystem(input),
      new PowerSystem(),
      new AttackMotionSystem(),
      new AttackCollisionSystem(),
      new EnemyMovementSystem(),
      new PlayerAttackSystem(),
      new ContactDamageSystem(),
      new RegenSystem(),
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

    this.debugText = this.add
      .text(6, 6, '', { fontFamily: 'monospace', fontSize: '10px', color: '#e8d0d0' })
      .setScrollFactor(0)
      .setDepth(100);

    this.world.events.on('enemy:died', () => {
      this.kills++;
    });
    this.world.events.on('player:levelup', () => {
      this.pendingLevelUps++;
      this.maybeOpenUpgrade();
    });
    this.events.on('upgrade:done', () => {
      this.pendingLevelUps = Math.max(0, this.pendingLevelUps - 1);
      this.scene.resume();
      this.maybeOpenUpgrade();
    });
  }

  private maybeOpenUpgrade(): void {
    if (this.ended || this.pendingLevelUps <= 0 || this.scene.isActive('Upgrade')) return;
    this.scene.launch('Upgrade', { world: this.world });
    this.scene.pause();
  }

  update(_time: number, delta: number): void {
    if (this.ended) return;

    advanceTime(this.world, delta);
    for (const system of this.systems) system.update(this.world, delta);

    this.syncPlayer();
    this.cameras.main.centerOn(this.world.camera.x, this.world.camera.y);
    this.syncEnemies();
    this.syncGems();
    this.syncAttacks();

    const p = this.world.player;
    const remaining = Math.max(
      0,
      this.memory.durationSec - Math.floor(this.world.time.elapsedMs / 1000),
    );
    this.debugText.setText(
      `HP ${Math.ceil(p.hp)}  Lv ${this.world.progression.level}  ` +
        `abates ${this.kills}  ${remaining}s  poderes ${this.world.powers.count()}`,
    );

    const outcome = runOutcome(this.world, this.memory.durationSec);
    if (outcome !== 'running') {
      this.ended = true;
      this.scene.stop('Upgrade');
      this.scene.start('RunEnd', {
        memoryId: this.memory.id,
        kills: this.kills,
        victory: outcome === 'victory',
        rewardPowerId: this.memory.rewardPowerId,
      });
    }
  }

  private syncPlayer(): void {
    const p = this.world.player;
    this.playerSprite.setPosition(p.pos.x, p.pos.y);
    if (Math.abs(p.vel.x) > 1) this.playerSprite.setFlipX(p.vel.x < 0);
    if (!this.textures.exists('dracula-idle')) return;
    const want = Math.hypot(p.vel.x, p.vel.y) > 1 ? 'dracula-walk' : 'dracula-idle';
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

  private syncAttacks(): void {
    let i = 0;
    this.world.attacks.forEachActive((a) => {
      let s = this.attackSprites[i];
      if (!s) {
        s = this.add.image(0, 0, a.spriteKey).setDepth(4);
        this.attackSprites[i] = s;
      }
      if (s.texture.key !== a.spriteKey) s.setTexture(a.spriteKey);
      s.setVisible(true).setPosition(a.pos.x, a.pos.y);
      s.setScale(a.spriteKey === 'dev-aura' ? (a.radius * 2) / AURA_TEX_SIZE : 1);
      i++;
    });
    for (let j = i; j < this.attackSprites.length; j++) this.attackSprites[j].setVisible(false);
  }

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
