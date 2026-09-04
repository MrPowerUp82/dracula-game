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
import { BossSystem } from '../systems/BossSystem';
import { BOSS_DEFS } from '../data/bosses';
import { PhaserInputSource } from '../input/PhaserInputSource';
import { MEMORIES, type MemoryDef } from '../data/memories';
import { ENEMY_DEFS } from '../data/enemies';
import { AURA_TEX_SIZE } from '../config/gameConfig';
import { applyMetaToWorld } from '../save/applyToRun';
import { runOutcome } from '../run/runEnd';
import type { SaveDataV1 } from '../save/SaveData';
import { ParallaxBackground } from '../ui/ParallaxBackground';

export class RunScene extends Phaser.Scene {
  private world!: World;
  private systems: System[] = [];
  private memory!: MemoryDef;
  private kills = 0;
  private ended = false;
  private playerSprite!: Phaser.GameObjects.Sprite;
  private enemySprites: Phaser.GameObjects.Sprite[] = [];
  private gemSprites: Phaser.GameObjects.Image[] = [];
  private attackSprites: Phaser.GameObjects.Sprite[] = [];
  private playerAnimOverride = '';
  private playerAnimOverrideUntil = 0;
  private bossSprite?: Phaser.GameObjects.Sprite;
  private debugText!: Phaser.GameObjects.Text;
  private pendingLevelUps = 0;
  private parallax!: ParallaxBackground;

  constructor() {
    super('Run');
  }

  create(): void {
    this.kills = 0;
    this.ended = false;
    this.pendingLevelUps = 0;
    // sprites de uma run anterior foram destruídos no restart da cena; solta as refs.
    this.enemySprites = [];
    this.gemSprites = [];
    this.attackSprites = [];
    this.bossSprite = undefined;
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
      new BossSystem(this.memory.bossId, this.memory.bossTimeSec),
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

    this.registerManifestAnimations();
    this.parallax = new ParallaxBackground(this, this.memory.id);

    const hasDracula = this.textures.exists('dracula-idle');
    this.playerSprite = this.add.sprite(0, 0, hasDracula ? 'dracula-idle' : 'dev-player').setDepth(5);
    if (hasDracula) this.playerSprite.play('dracula-idle');

    this.debugText = this.add
      .text(6, 6, '', { fontFamily: 'monospace', fontSize: '10px', color: '#e8d0d0' })
      .setScrollFactor(0)
      .setDepth(100);

    this.scene.launch('HUD', { world: this.world });

    this.world.events.on('enemy:died', () => {
      this.kills++;
    });
    this.world.events.on('player:damaged', () => {
      this.playPlayerState('dracula-hurt', 220);
    });
    this.world.events.on('player:levelup', () => {
      this.playPlayerState('dracula-levelup', 520);
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
    this.syncBoss();
    this.parallax.update(this.world.camera.x);

    const p = this.world.player;
    const remaining = Math.max(
      0,
      this.memory.durationSec - Math.floor(this.world.time.elapsedMs / 1000),
    );
    const bossInfo = this.world.boss.active
      ? `  CHEFE ${this.world.boss.phase} ${Math.ceil(this.world.boss.hp)}/${this.world.boss.maxHp}`
      : this.world.bossDefeated
        ? '  CHEFE DERROTADO'
        : '';
    this.debugText.setText(
      `HP ${Math.ceil(p.hp)}  Lv ${this.world.progression.level}  ` +
        `abates ${this.kills}  ${remaining}s  poderes ${this.world.powers.count()}${bossInfo}`,
    );

    const outcome = runOutcome(this.world, this.memory.durationSec);
    if (outcome !== 'running') {
      this.ended = true;
      this.scene.stop('Upgrade');
      this.scene.stop('HUD');
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
    if (this.playerAnimOverride && this.world.time.elapsedMs < this.playerAnimOverrideUntil) {
      if (this.playerSprite.anims.getName() !== this.playerAnimOverride) {
        this.playerSprite.play(this.playerAnimOverride, true);
      }
      return;
    }
    this.playerAnimOverride = '';
    const want = Math.hypot(p.vel.x, p.vel.y) > 1 ? 'dracula-walk' : 'dracula-idle';
    if (this.playerSprite.anims.getName() !== want) this.playerSprite.play(want, true);
  }

  private syncEnemies(): void {
    const px = this.world.player.pos.x;
    let i = 0;
    this.world.enemies.forEachActive((e) => {
      let s = this.enemySprites[i];
      if (!s) {
        s = this.add.sprite(0, 0, 'dev-enemy').setDepth(3);
        this.enemySprites[i] = s;
      }
      const tex = this.enemySpriteKey(e.defId, this.memory.id);
      const useArt = this.textures.exists(tex);
      if (s.texture.key !== tex) s.setTexture(tex);
      if (useArt && this.anims.exists(tex) && s.anims.getName() !== tex) s.play(tex, true);
      if (!useArt) s.anims.stop();
      s.setVisible(true).setPosition(e.pos.x, e.pos.y);
      s.setFlipX(px < e.pos.x);
      i++;
    });
    for (let j = i; j < this.enemySprites.length; j++) this.enemySprites[j].setVisible(false);
  }


  private enemySpriteKey(defId: string, memoryId: string): string {
    const map: Record<string, Record<string, string>> = {
      m1: {
        crawler: 'crawler-walk', runner: 'risen-servant', brute: 'crypt-skeleton',
        shooter: 'risen-servant', bomber: 'crawler-walk', flyer: 'grave-crow',
        summoner: 'risen-servant', elite: 'elite-profaned-sentinel', swarm: 'grave-crow',
      },
      m2: {
        crawler: 'torch-peasant', runner: 'witch-hound', brute: 'flagellant-bomber',
        shooter: 'inquisitor-gunner', bomber: 'flagellant-bomber', flyer: 'grave-crow',
        summoner: 'zealot-preacher', elite: 'elite-pyre-warden', swarm: 'grave-crow',
      },
      // Assets dedicados de M3–M5 ainda serão substituídos; por enquanto o
      // gameplay já usa os arquétipos corretos com os melhores reskins atuais.
      m3: {
        crawler: 'torch-peasant', runner: 'witch-hound', brute: 'crypt-skeleton',
        shooter: 'inquisitor-gunner', bomber: 'flagellant-bomber', flyer: 'grave-crow',
        summoner: 'zealot-preacher', elite: 'elite-profaned-sentinel', swarm: 'grave-crow',
      },
      m4: {
        crawler: 'risen-servant', runner: 'witch-hound', brute: 'elite-profaned-sentinel',
        shooter: 'inquisitor-gunner', bomber: 'flagellant-bomber', flyer: 'grave-crow',
        summoner: 'zealot-preacher', elite: 'elite-profaned-sentinel', swarm: 'fx-bat-swarm',
      },
      m5: {
        crawler: 'crawler-walk', runner: 'witch-hound', brute: 'elite-pyre-warden',
        shooter: 'inquisitor-gunner', bomber: 'flagellant-bomber', flyer: 'grave-crow',
        summoner: 'zealot-preacher', elite: 'elite-pyre-warden', swarm: 'crawler-walk',
      },
    };
    return map[memoryId]?.[defId] ?? this.getEnemyDef(defId)?.spriteKey ?? 'dev-enemy';
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
        s = this.add.sprite(0, 0, a.spriteKey).setDepth(4);
        this.attackSprites[i] = s;
      }
      if (s.texture.key !== a.spriteKey) s.setTexture(a.spriteKey);
      if (this.anims.exists(a.spriteKey) && s.anims.getName() !== a.spriteKey) s.play(a.spriteKey, true);
      s.setVisible(true).setPosition(a.pos.x, a.pos.y);
      s.setScale(a.spriteKey === 'dev-aura' ? (a.radius * 2) / AURA_TEX_SIZE : 1);
      i++;
    });
    for (let j = i; j < this.attackSprites.length; j++) this.attackSprites[j].setVisible(false);
  }

  private syncBoss(): void {
    const b = this.world.boss;
    if (!b.active) {
      this.bossSprite?.setVisible(false);
      return;
    }
    const def = BOSS_DEFS[b.defId];
    const key = this.textures.exists(def.spriteKey) ? def.spriteKey : 'dev-boss';
    if (!this.bossSprite) this.bossSprite = this.add.sprite(0, 0, key).setDepth(6);
    if (this.bossSprite.texture.key !== key) this.bossSprite.setTexture(key);
    if (this.anims.exists(key) && this.bossSprite.anims.getName() !== key) this.bossSprite.play(key, true);
    const bossScale = b.defId === 'satan' ? 1.65 : b.defId === 'janissary-commander' ? 1.2 : 1;
    this.bossSprite.setVisible(true).setPosition(b.pos.x, b.pos.y).setScale(bossScale);
    this.bossSprite.setFlipX(this.world.player.pos.x < b.pos.x);
  }

  private registerManifestAnimations(): void {
    const manifest = this.cache.json.get('sprite-manifest') as Record<string, { frameCount: number }> | undefined;
    if (!manifest) return;
    for (const [key, meta] of Object.entries(manifest)) {
      if (meta.frameCount <= 1 || !this.textures.exists(key) || this.anims.exists(key)) continue;
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers(key, { start: 0, end: meta.frameCount - 1 }),
        frameRate: key.startsWith('fx-') ? 18 : key.startsWith('boss-') ? 8 : 10,
        repeat: -1,
      });
    }
  }

  private playPlayerState(key: string, durationMs: number): void {
    if (!this.textures.exists(key) || !this.anims.exists(key)) return;
    this.playerAnimOverride = key;
    this.playerAnimOverrideUntil = this.world.time.elapsedMs + durationMs;
    this.playerSprite.play(key, true);
  }

  private getEnemyDef(id: string): { spriteKey: string } | undefined {
    // Evita acoplar o renderizador a Phaser: a tabela de gameplay é a fonte do
    // sprite de cada arquétipo.
    return ENEMY_DEFS[id as keyof typeof ENEMY_DEFS];
  }
}
