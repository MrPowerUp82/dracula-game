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

    this.renderChoices(rollUpgradeChoices(this.world.powers, this.world.rng, { unlockedPool: this.world.draftPool }));
  }

  private renderChoices(choices: UpgradeChoice[]): void {
    for (const o of this.cardObjects) o.destroy();
    this.cardObjects = [];

    const cardW = 130;
    const gap = 12;
    const totalW = choices.length * cardW + (choices.length - 1) * gap;
    const startX = (LOGICAL_WIDTH - totalW) / 2;
    const y = 52;
    const cardH = 168;
    const hasFrames = this.textures.exists('ui-power-card-frames');

    choices.forEach((choice, i) => {
      const x = startX + i * (cardW + gap);
      const backdrop = this.add
        .rectangle(x, y, cardW, cardH, 0x100b16, 0.96)
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(1);
      let hitTarget: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image = backdrop;
      this.cardObjects.push(backdrop);
      if (hasFrames) {
        const frame = choice.kind === 'evolve' ? 2 : choice.kind === 'new' ? 1 : 0;
        const frameImage = this.add
          .image(x + cardW / 2, y + cardH / 2, 'ui-power-card-frames', frame)
          .setDisplaySize(cardW, cardH)
          .setScrollFactor(0)
          .setDepth(2)
          .setInteractive({ useHandCursor: true });
        hitTarget = frameImage;
        this.cardObjects.push(frameImage);
      } else {
        backdrop
          .setStrokeStyle(2, choice.kind === 'evolve' ? 0xb31217 : 0x554455)
          .setInteractive({ useHandCursor: true });
      }
      const title = this.add
        .text(x + 12, y + 35, choice.title, {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#ffffff',
          align: 'center',
          wordWrap: { width: cardW - 24 },
        })
        .setOrigin(0.5, 0)
        .setX(x + cardW / 2)
        .setScrollFactor(0)
        .setDepth(3);
      const detail = this.add
        .text(x + 12, y + 91, choice.detail, {
          fontFamily: 'monospace',
          fontSize: '8px',
          color: '#b9a9a9',
          align: 'center',
          wordWrap: { width: cardW - 24 },
        })
        .setOrigin(0.5, 0)
        .setX(x + cardW / 2)
        .setScrollFactor(0)
        .setDepth(3);
      hitTarget.on('pointerup', () => this.pick(choice));
      this.cardObjects.push(title, detail);
    });

    const reroll = this.add
      .text(LOGICAL_WIDTH / 2, y + cardH + 14, this.rerollsLeft > 0 ? '↻ Rerolar (1)' : '', {
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
        this.renderChoices(rollUpgradeChoices(this.world.powers, this.world.rng, { unlockedPool: this.world.draftPool }));
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
