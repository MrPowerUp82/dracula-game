import Phaser from 'phaser';
import type { SaveDataV1 } from '../save/SaveData';
import { persistSave } from '../save/session';
import { applyRunResult, essenceForRun } from '../meta/runReward';
import { POWER_DEFS } from '../data/powers';
import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from '../config/gameConfig';

interface RunEndData {
  memoryId: string;
  kills: number;
  victory: boolean;
  rewardPowerId?: string;
}

export class RunEndScene extends Phaser.Scene {
  constructor() {
    super('RunEnd');
  }

  create(data: RunEndData): void {
    const save = this.registry.get('save') as SaveDataV1;
    const earned = essenceForRun(data.kills, data.victory);
    const next = applyRunResult(save, data);
    this.registry.set('save', next);
    persistSave(next);

    const cx = LOGICAL_WIDTH / 2;
    const lines = [
      data.victory ? 'MEMÓRIA RECUPERADA' : 'O SANGUE ESFRIA',
      `Abates: ${data.kills}`,
      `Essência: +${earned}  (total ${Math.floor(next.essence)})`,
    ];
    if (data.victory && data.rewardPowerId && POWER_DEFS[data.rewardPowerId]) {
      lines.push(`Poder recuperado: ${POWER_DEFS[data.rewardPowerId].name}`);
    }

    lines.forEach((t, i) => {
      this.add
        .text(cx, 60 + i * 18, t, {
          fontFamily: 'monospace',
          fontSize: i === 0 ? '13px' : '10px',
          color: i === 0 ? (data.victory ? '#e8d0d0' : '#a06a6a') : '#b9a9a9',
        })
        .setOrigin(0.5);
    });

    const back = this.add
      .text(cx, LOGICAL_HEIGHT - 40, '↩ Voltar ao Castelo', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#8fd0ff',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    back.on('pointerup', () => this.scene.start('Hub'));
  }
}
