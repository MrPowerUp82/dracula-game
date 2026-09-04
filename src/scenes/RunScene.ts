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
import type { EnemyArchetype } from '../data/enemies';
import { enemyVisual } from '../data/memoryVisuals';
import { AURA_TEX_SIZE, LOGICAL_HEIGHT, LOGICAL_WIDTH } from '../config/gameConfig';
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
  private gemSprites: Phaser.GameObjects.Sprite[] = [];
  private attackSprites: Phaser.GameObjects.Sprite[] = [];
  private playerAnimOverride = '';
  private playerAnimOverrideUntil = 0;
  private bossSprite?: Phaser.GameObjects.Sprite;
  private debugText!: Phaser.GameObjects.Text;
  private pendingLevelUps = 0;
  private parallax!: ParallaxBackground;
  private telegraphs!: Phaser.GameObjects.Graphics;
  private nightOverlay?: Phaser.GameObjects.Sprite;
  private targetReticle?: Phaser.GameObjects.Sprite;
  private eventUnsubscribers: Array<() => void> = [];

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
    this.nightOverlay = undefined;
    this.targetReticle = undefined;
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

    // Base lógica atrás do parallax; antes ficava acima e ocultava toda a arte.
    this.add.grid(0, 0, 4000, 4000, 32, 32, 0x140d1c, 1, 0x241a30, 1).setDepth(-40);
    this.telegraphs = this.add.graphics().setDepth(5);

    this.registerManifestAnimations();
    this.parallax = new ParallaxBackground(this, this.memory.id);

    const hasDracula = this.textures.exists('dracula-idle');
    this.playerSprite = this.add.sprite(0, 0, hasDracula ? 'dracula-idle' : 'dev-player').setDepth(5);
    if (hasDracula) this.playerSprite.play('dracula-idle');

    if (this.textures.exists('fx-dominion-of-night')) {
      this.nightOverlay = this.add
        .sprite(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2, 'fx-dominion-of-night')
        .setDisplaySize(LOGICAL_WIDTH, LOGICAL_HEIGHT)
        .setScrollFactor(0)
        .setDepth(20)
        .setAlpha(0.42)
        .setVisible(false);
      this.nightOverlay.play('fx-dominion-of-night');
    }
    if (this.textures.exists('ui-target-reticle')) {
      this.targetReticle = this.add.sprite(0, 0, 'ui-target-reticle').setDepth(7).setAlpha(0.78).setVisible(false);
      this.targetReticle.play('ui-target-reticle');
    }

    this.debugText = this.add
      .text(6, 6, '', { fontFamily: 'monospace', fontSize: '10px', color: '#e8d0d0' })
      .setScrollFactor(0)
      .setDepth(100);

    this.scene.launch('HUD', { world: this.world });

    this.eventUnsubscribers.push(this.world.events.on('enemy:died', () => {
      this.kills++;
    }));
    this.eventUnsubscribers.push(this.world.events.on('player:damaged', () => {
      this.playPlayerState('dracula-hurt', 220);
      if (save?.settings.screenShake !== false) this.cameras.main.shake(90, 0.0025);
    }));
    this.eventUnsubscribers.push(this.world.events.on('player:levelup', () => {
      this.playPlayerState('dracula-levelup', 520);
    }));
    this.eventUnsubscribers.push(this.world.events.on('player:levelup', () => {
      this.pendingLevelUps++;
      this.maybeOpenUpgrade();
    }));
    this.eventUnsubscribers.push(this.world.events.on('player:dashed', ({ fromX, fromY, toX, toY }) => {
      if (!this.textures.exists('fx-mist-trail')) return;
      const dx = toX - fromX;
      const dy = toY - fromY;
      const trail = this.add
        .sprite((fromX + toX) / 2, (fromY + toY) / 2, 'fx-mist-trail')
        .setDepth(4)
        .setRotation(Math.atan2(dy, dx) - Math.PI / 2)
        .setScale(1, Math.max(1, Math.hypot(dx, dy) / 48))
        .setAlpha(0.85);
      trail.play('fx-mist-trail');
      this.tweens.add({ targets: trail, alpha: 0, duration: 520, onComplete: () => trail.destroy() });
    }));
    this.eventUnsubscribers.push(this.world.events.on('boss:phase', () => {
      if (save?.settings.screenShake !== false) this.cameras.main.shake(180, 0.004);
    }));
    this.eventUnsubscribers.push(this.world.events.on('boss:died', () => {
      if (save?.settings.screenShake !== false) this.cameras.main.shake(320, 0.007);
    }));
    this.events.on('upgrade:done', () => {
      this.pendingLevelUps = Math.max(0, this.pendingLevelUps - 1);
      this.scene.resume();
      this.maybeOpenUpgrade();
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
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
    this.syncPowerVisuals();
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
    const archetype = defId as EnemyArchetype;
    return enemyVisual(memoryId, archetype) ?? 'dev-enemy';
  }

  private syncGems(): void {
    let i = 0;
    this.world.pickups.forEachActive((g) => {
      let s = this.gemSprites[i];
      if (!s) {
        const key = this.textures.exists('pickup-blood-gem') ? 'pickup-blood-gem' : 'dev-gem';
        s = this.add.sprite(0, 0, key).setDepth(2);
        this.gemSprites[i] = s;
      }
      if (this.textures.exists('pickup-blood-gem')) {
        if (s.texture.key !== 'pickup-blood-gem') s.setTexture('pickup-blood-gem');
        const anim = g.value >= 6
          ? 'pickup-blood-gem-large'
          : g.value >= 3
            ? 'pickup-blood-gem-medium'
            : 'pickup-blood-gem-small';
        if (this.anims.exists(anim) && s.anims.getName() !== anim) s.play(anim, true);
      }
      s.setVisible(true).setPosition(g.pos.x, g.pos.y);
      i++;
    });
    for (let j = i; j < this.gemSprites.length; j++) this.gemSprites[j].setVisible(false);
  }

  private syncAttacks(): void {
    this.telegraphs.clear();
    let i = 0;
    this.world.attacks.forEachActive((a) => {
      const spriteKey = this.textures.exists(a.spriteKey)
        ? a.spriteKey
        : a.motion === 'static' || a.motion === 'fixed'
          ? 'dev-aura'
          : 'dev-spear';
      let s = this.attackSprites[i];
      if (!s) {
        s = this.add.sprite(0, 0, spriteKey).setDepth(4);
        this.attackSprites[i] = s;
      }
      if (s.texture.key !== spriteKey) s.setTexture(spriteKey);
      if (this.anims.exists(spriteKey) && s.anims.getName() !== spriteKey) s.play(spriteKey, true);
      s.setVisible(true).setPosition(a.pos.x, a.pos.y);
      const areaSprite = spriteKey === 'dev-aura' || spriteKey === 'fx-blood-rain';
      s.setScale(areaSprite ? (a.radius * 2) / AURA_TEX_SIZE : spriteKey === 'fx-wolf-pack' ? 0.8 : 1);
      s.setRotation(a.motion === 'linear' ? Math.atan2(a.vel.y, a.vel.x) : 0);
      const warning = a.ageMs < a.telegraphMs;
      s.setAlpha(warning ? 0.22 : 1);
      if (warning && a.telegraphShape === 'circle') {
        const pulse = 0.45 + 0.35 * Math.sin(a.ageMs * 0.025);
        this.telegraphs.lineStyle(2, 0xff6b3d, pulse);
        this.telegraphs.fillStyle(0xb31217, 0.08);
        const radius = a.telegraphRadius || a.radius;
        this.telegraphs.fillCircle(a.telegraphTargetX, a.telegraphTargetY, radius);
        this.telegraphs.strokeCircle(a.telegraphTargetX, a.telegraphTargetY, radius);
      } else if (warning && a.telegraphShape === 'line') {
        const pulse = 0.5 + 0.35 * Math.sin(a.ageMs * 0.03);
        this.telegraphs.lineStyle(Math.max(2, a.radius * 0.65), 0xff6b3d, pulse);
        this.telegraphs.lineBetween(a.pos.x, a.pos.y, a.telegraphTargetX, a.telegraphTargetY);
      }
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
    this.bossSprite.setAlpha(b.transitionMs > 0 ? 0.6 + Math.sin(b.transitionMs * 0.04) * 0.3 : 1);
  }

  private syncPowerVisuals(): void {
    this.nightOverlay?.setVisible(this.world.powers.has('night-domain'));
    if (!this.targetReticle) return;
    if (!this.world.powers.has('blood-spear')) {
      this.targetReticle.setVisible(false);
      return;
    }
    const px = this.world.player.pos.x;
    const py = this.world.player.pos.y;
    let target: { pos: { x: number; y: number } } | undefined = this.world.boss.active
      && this.world.boss.phase !== 'intro'
      ? this.world.boss
      : undefined;
    let best = target ? (target.pos.x - px) ** 2 + (target.pos.y - py) ** 2 : Infinity;
    this.world.enemies.forEachActive((enemy) => {
      const distance = (enemy.pos.x - px) ** 2 + (enemy.pos.y - py) ** 2;
      if (distance < best) {
        best = distance;
        target = enemy;
      }
    });
    if (!target) {
      this.targetReticle.setVisible(false);
      return;
    }
    this.targetReticle.setVisible(true).setPosition(target.pos.x, target.pos.y);
  }

  private registerManifestAnimations(): void {
    const manifest = this.cache.json.get('sprite-manifest') as Record<string, { frameCount: number }> | undefined;
    if (!manifest) return;
    const loopEnd: Record<string, number> = {
      'fx-blood-rain': 5,
      'fx-blood-spear': 3,
      'fx-nosferatu-swarm': 5,
      'fx-wolf-pack': 5,
    };
    for (const [key, meta] of Object.entries(manifest)) {
      if (key === 'pickup-blood-gem' || meta.frameCount <= 1 || !this.textures.exists(key) || this.anims.exists(key)) continue;
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers(key, { start: 0, end: loopEnd[key] ?? meta.frameCount - 1 }),
        frameRate: key.startsWith('fx-') ? 18 : key.startsWith('boss-') ? 8 : 10,
        repeat: -1,
      });
    }
    if (this.textures.exists('pickup-blood-gem')) {
      const ranges = [
        ['pickup-blood-gem-small', 0, 5],
        ['pickup-blood-gem-medium', 6, 11],
        ['pickup-blood-gem-large', 12, 17],
      ] as const;
      for (const [key, start, end] of ranges) {
        if (this.anims.exists(key)) continue;
        this.anims.create({
          key,
          frames: this.anims.generateFrameNumbers('pickup-blood-gem', { start, end }),
          frameRate: 10,
          repeat: -1,
        });
      }
    }
  }

  private playPlayerState(key: string, durationMs: number): void {
    if (!this.textures.exists(key) || !this.anims.exists(key)) return;
    this.playerAnimOverride = key;
    this.playerAnimOverrideUntil = this.world.time.elapsedMs + durationMs;
    this.playerSprite.play(key, true);
  }

  private cleanup(): void {
    for (const unsubscribe of this.eventUnsubscribers) unsubscribe();
    this.eventUnsubscribers.length = 0;
    this.world?.events.clear();
    this.world?.attacks.releaseAll();
    this.world?.enemies.releaseAll();
    this.world?.pickups.releaseAll();
    this.parallax?.destroy();
  }
}
