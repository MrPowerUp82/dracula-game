import Phaser from 'phaser';
import type { World } from '../world/World';
import {
  rollUpgradeChoices,
  applyUpgradeChoice,
  type UpgradeChoice,
} from '../powers/upgradeChoices';
import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config/gameConfig';

interface UpgradeData {
  world: World;
}

/** Overlay modal: 3 cartas de upgrade, 1 reroll grátis. Pausa a RunScene. */
export class UpgradeScene extends Phaser.Scene {
  private world!: World;
  private rerollsLeft = 1;
  private cardObjects: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super('Upgrade');
  }

  create(data: UpgradeData): void {
    this.world = data.world;
    this.rerollsLeft = 1;

    this.add
      .rectangle(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT, 0x05030a, 0.8)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(0);
    this.add
      .text(LOGICAL_WIDTH / 2, 26, 'MEMÓRIA RECUPERADA', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#e8d0d0',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1);

    this.renderChoices(rollUpgradeChoices(this.world.powers, this.world.rng));
  }

  private renderChoices(choices: UpgradeChoice[]): void {
    for (const o of this.cardObjects) o.destroy();
    this.cardObjects = [];

    const cardW = 130;
    const gap = 12;
    const totalW = choices.length * cardW + (choices.length - 1) * gap;
    const startX = (LOGICAL_WIDTH - totalW) / 2;
    const y = 60;

    choices.forEach((choice, i) => {
      const x = startX + i * (cardW + gap);
      const box = this.add
        .rectangle(x, y, cardW, 120, 0x1a1420, 1)
        .setOrigin(0)
        .setScrollFactor(0)
        .setStrokeStyle(2, choice.kind === 'evolve' ? 0xb31217 : 0x554455)
        .setDepth(1)
        .setInteractive({ useHandCursor: true });
      const title = this.add
        .text(x + 8, y + 10, choice.title, {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#ffffff',
          wordWrap: { width: cardW - 16 },
        })
        .setScrollFactor(0)
        .setDepth(2);
      const detail = this.add
        .text(x + 8, y + 52, choice.detail, {
          fontFamily: 'monospace',
          fontSize: '8px',
          color: '#b9a9a9',
          wordWrap: { width: cardW - 16 },
        })
        .setScrollFactor(0)
        .setDepth(2);
      box.on('pointerup', () => this.pick(choice));
      this.cardObjects.push(box, title, detail);
    });

    const reroll = this.add
      .text(LOGICAL_WIDTH / 2, y + 132, this.rerollsLeft > 0 ? '↻ Rerolar (1)' : '', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#8fd0ff',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2);
    if (this.rerollsLeft > 0) {
      reroll.setInteractive({ useHandCursor: true }).on('pointerup', () => {
        this.rerollsLeft--;
        this.renderChoices(rollUpgradeChoices(this.world.powers, this.world.rng));
      });
    }
    this.cardObjects.push(reroll);
  }

  private pick(choice: UpgradeChoice): void {
    applyUpgradeChoice(this.world, choice);
    const run = this.scene.get('Run');
    this.scene.stop();
    run.events.emit('upgrade:done');
  }
}
