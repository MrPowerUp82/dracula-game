import Phaser from 'phaser';
import type { MemoryDef } from '../data/memories';
import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config/gameConfig';

export class MemoryIntroScene extends Phaser.Scene {
  constructor() { super('MemoryIntro'); }

  create(data: { memory?: MemoryDef }): void {
    const memory = data.memory ?? (this.registry.get('selectedMemory') as MemoryDef);
    const artKey = memory.id === 'm1' && this.textures.exists('art-memory1') ? 'art-memory1' : 'art-title';
    if (this.textures.exists(artKey)) {
      this.add.image(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2, artKey)
        .setDisplaySize(LOGICAL_WIDTH, LOGICAL_HEIGHT);
    } else {
      this.add.rectangle(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT, 0x0b0710).setOrigin(0);
    }
    this.add.rectangle(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT, 0x05030a, 0.48).setOrigin(0);
    this.add.text(LOGICAL_WIDTH / 2, 48, memory.name, {
      fontFamily: 'monospace', fontSize: '18px', color: '#e8d0d0', stroke: '#05030a', strokeThickness: 4,
    }).setOrigin(0.5);
    this.add.text(LOGICAL_WIDTH / 2, 76, `O chefe aguarda após ${memory.bossTimeSec}s`, {
      fontFamily: 'monospace', fontSize: '9px', color: '#c8b8b8',
    }).setOrigin(0.5);
    const begin = () => this.scene.start('Run');
    this.add.text(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 38, '▶ Entrar na memória', {
      fontFamily: 'monospace', fontSize: '11px', color: '#ffffff', backgroundColor: '#120a16',
      padding: { x: 10, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerup', begin);
    this.input.keyboard?.once('keydown-ENTER', begin);
    this.input.keyboard?.once('keydown-SPACE', begin);
  }
}
