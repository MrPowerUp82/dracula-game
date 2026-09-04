import Phaser from 'phaser';
import type { SaveDataV1 } from '../save/SaveData';
import { persistSave } from '../save/session';
import { STAT_TRACKS, trackCost, buyTrack } from '../meta/statTracks';
import { lockedPowers, unlockPower, POWER_UNLOCK_COST } from '../meta/powerUnlock';
import { coffinCost, buyRevive } from '../meta/coffin';
import { MEMORIES, memoryUnlocked } from '../data/memories';
import { POWER_DEFS } from '../data/powers';
import { LOGICAL_WIDTH } from '../config/gameConfig';

const MONO = 'monospace';

export class HubScene extends Phaser.Scene {
  private save!: SaveDataV1;
  private rows: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super('Hub');
  }

  create(): void {
    this.save = this.registry.get('save') as SaveDataV1;
    if (this.textures.exists('env-hub')) {
      this.add.image(LOGICAL_WIDTH / 2, 125, 'env-hub').setDisplaySize(LOGICAL_WIDTH, 270).setAlpha(0.42);
    }
    this.add.rectangle(0, 0, LOGICAL_WIDTH, 270, 0x05030a, 0.48).setOrigin(0);
    this.add.rectangle(0, 0, LOGICAL_WIDTH, 32, 0x120a16, 0.9).setOrigin(0);
    this.add
      .text(LOGICAL_WIDTH / 2, 10, 'CASTELO EM RUÍNAS', { fontFamily: MONO, fontSize: '11px', color: '#e8d0d0' })
      .setOrigin(0.5, 0);
    this.render();
  }

  private commit(next: SaveDataV1): void {
    this.save = next;
    this.registry.set('save', next);
    persistSave(next);
    this.render();
  }

  private render(): void {
    for (const r of this.rows) r.destroy();
    this.rows = [];

    this.addText(8, 38, `Essência de Sangue: ${Math.floor(this.save.essence)} ◈`, '#d09090');

    let y = 58;
    y = this.section('MEMÓRIAS', y);
    MEMORIES.forEach((m, i) => {
      const unlocked = memoryUnlocked(this.save, i);
      const done = this.save.memoriesCleared.includes(m.id);
      this.row(y, `${unlocked ? '▶' : '🔒'} ${m.name}${done ? '  (concluída)' : ''}`, unlocked, () => {
        this.registry.set('selectedMemory', m);
        this.scene.start('MemoryIntro', { memory: m });
      });
      y += 14;
    });

    y += 8;
    y = this.section('ÁRVORE DE PODER', y);
    for (const t of STAT_TRACKS) {
      const lvl = this.save.baseStats[t.key] ?? 0;
      const cost = trackCost(t, lvl);
      const label =
        cost == null
          ? `${t.name}  ${lvl}/${t.maxLevel}  (máx)`
          : `${t.name}  ${lvl}/${t.maxLevel}  —  ${cost} ◈`;
      const can = cost != null && this.save.essence >= cost;
      this.row(y, label, can, () => this.commit(buyTrack(this.save, t.key).save));
      y += 12;
    }

    y += 8;
    y = this.section('PODERES BLOQUEADOS', y);
    const locked = lockedPowers(this.save);
    if (locked.length === 0) {
      this.addText(12, y, 'Todos desbloqueados.', '#6a6a6a');
      y += 12;
    }
    for (const id of locked) {
      const can = this.save.essence >= POWER_UNLOCK_COST;
      this.row(y, `${POWER_DEFS[id].name}  —  ${POWER_UNLOCK_COST} ◈`, can, () =>
        this.commit(unlockPower(this.save, id).save),
      );
      y += 12;
    }

    y += 8;
    y = this.section('CAIXÃO', y);
    const cc = coffinCost(this.save);
    this.row(
      y,
      `Revive extra (tem ${this.save.coffinRevives})  —  ${cc} ◈`,
      this.save.essence >= cc,
      () => this.commit(buyRevive(this.save).save),
    );
  }

  private section(name: string, y: number): number {
    this.addText(8, y, `— ${name} —`, '#8a7a8a');
    return y + 14;
  }

  private addText(x: number, y: number, text: string, color: string): void {
    this.rows.push(
      this.add.text(x, y, text, { fontFamily: MONO, fontSize: '9px', color }).setScrollFactor(0),
    );
  }

  private row(y: number, label: string, enabled: boolean, onClick: () => void): void {
    const t = this.add
      .text(12, y, label, {
        fontFamily: MONO,
        fontSize: '9px',
        color: enabled ? '#cfe8ff' : '#5a5a5a',
      })
      .setScrollFactor(0);
    if (enabled) t.setInteractive({ useHandCursor: true }).on('pointerup', onClick);
    this.rows.push(t);
  }
}
