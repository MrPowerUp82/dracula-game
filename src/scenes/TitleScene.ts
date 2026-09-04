import Phaser from 'phaser';
import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config/gameConfig';
import { t } from '../i18n/pt';

export class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create(): void {
    if (this.textures.exists('art-title')) {
      this.add.image(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT / 2, 'art-title')
        .setDisplaySize(LOGICAL_WIDTH, LOGICAL_HEIGHT);
    } else {
      this.add.rectangle(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT, 0x0b0710).setOrigin(0);
    }

    this.add.rectangle(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT, 0x05030a, 0.28).setOrigin(0);
    this.add.text(LOGICAL_WIDTH / 2, 42, t('title'), {
      fontFamily: 'monospace', fontSize: '16px', color: '#e8d0d0',
      stroke: '#05030a', strokeThickness: 4,
    }).setOrigin(0.5);

    const start = this.add.text(LOGICAL_WIDTH / 2, LOGICAL_HEIGHT - 48, t('start'), {
      fontFamily: 'monospace', fontSize: '12px', color: '#ffffff',
      backgroundColor: '#120a16', padding: { x: 12, y: 7 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    start.on('pointerup', () => this.scene.start('Hub'));
    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('Hub'));
    this.input.keyboard?.once('keydown-SPACE', () => this.scene.start('Hub'));
  }
}
