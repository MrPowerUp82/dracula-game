import Phaser from 'phaser';
import type { World } from '../world/World';
import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config/gameConfig';
import { xpToNext } from '../progression/xp';
import { BOSS_DEFS } from '../data/bosses';

export class HUDScene extends Phaser.Scene {
  private world!: World;
  private hpBar!: Phaser.GameObjects.Rectangle;
  private xpBar!: Phaser.GameObjects.Rectangle;
  private bossBar!: Phaser.GameObjects.Rectangle;
  private bossBack!: Phaser.GameObjects.Rectangle;
  private info!: Phaser.GameObjects.Text;
  private powers!: Phaser.GameObjects.Text;
  private bossLabel!: Phaser.GameObjects.Text;

  constructor() { super('HUD'); }

  create(data: { world: World }): void {
    this.world = data.world;
    this.add.rectangle(4, 4, LOGICAL_WIDTH - 8, 20, 0x08050d, 0.76).setOrigin(0).setScrollFactor(0);
    this.add.rectangle(8, 8, 100, 6, 0x32131c, 1).setOrigin(0).setScrollFactor(0);
    this.hpBar = this.add.rectangle(8, 8, 100, 6, 0xb31217, 1).setOrigin(0).setScrollFactor(0);
    this.add.rectangle(118, 8, 120, 6, 0x1b1a28, 1).setOrigin(0).setScrollFactor(0);
    this.xpBar = this.add.rectangle(118, 8, 1, 6, 0x8fd0ff, 1).setOrigin(0).setScrollFactor(0);
    this.info = this.add.text(246, 5, '', { fontFamily: 'monospace', fontSize: '8px', color: '#e8d0d0' }).setScrollFactor(0);
    this.bossLabel = this.add.text(LOGICAL_WIDTH / 2, 26, '', { fontFamily: 'monospace', fontSize: '8px', color: '#f0b0a0' }).setOrigin(0.5, 0).setScrollFactor(0);
    this.bossBack = this.add.rectangle(LOGICAL_WIDTH / 2, 39, 320, 7, 0x18080d, 0.9).setScrollFactor(0).setVisible(false);
    this.bossBar = this.add.rectangle(LOGICAL_WIDTH / 2 - 160, 39, 1, 7, 0xb31217, 1).setOrigin(0, 0.5).setScrollFactor(0).setVisible(false);
    this.powers = this.add.text(8, LOGICAL_HEIGHT - 18, '', { fontFamily: 'monospace', fontSize: '8px', color: '#c8b8c8' }).setScrollFactor(0);
  }

  update(): void {
    if (!this.world) return;
    const p = this.world.player;
    const maxHp = Math.max(1, p.stats.get('maxHp'));
    const hpRatio = Phaser.Math.Clamp(p.hp / maxHp, 0, 1);
    this.hpBar.width = 100 * hpRatio;
    const need = xpToNext(this.world.progression.level);
    this.xpBar.width = 120 * Phaser.Math.Clamp(this.world.progression.xp / need, 0, 1);
    const remaining = Math.max(0, Math.ceil((this.registry.get('selectedMemory')?.durationSec ?? 300) - this.world.time.elapsedMs / 1000));
    this.info.setText(`LV ${this.world.progression.level}  ${remaining}s`);

    const b = this.world.boss;
    if (b.active) {
      const def = BOSS_DEFS[b.defId];
      const phaseIndex = b.phase === 'p1' ? 1 : b.phase === 'p2' ? 2 : b.phase === 'enraged' ? 3 : 0;
      const phaseName = phaseIndex > 0 ? def.phases[phaseIndex - 1].name : 'Manifestação';
      const changing = b.transitionMs > 0 ? '  —  TRANSFORMAÇÃO' : '';
      this.bossLabel.setText(`${def.name}  •  FASE ${phaseIndex}: ${phaseName}${changing}`);
      this.bossBar.width = 320 * Phaser.Math.Clamp(b.hp / b.maxHp, 0, 1);
      this.bossLabel.setVisible(true); this.bossBar.setVisible(true); this.bossBack.setVisible(true);
    } else {
      this.bossLabel.setVisible(false); this.bossBar.setVisible(false); this.bossBack.setVisible(false);
    }
    this.powers.setText(this.world.powers.list().map((x) => `${x.def.name} ${x.level}`).join('  •  '));
  }
}
