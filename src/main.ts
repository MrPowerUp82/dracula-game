import Phaser from 'phaser';
import { LOGICAL_WIDTH, LOGICAL_HEIGHT } from './config/gameConfig';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { HubScene } from './scenes/HubScene';
import { RunScene } from './scenes/RunScene';
import { UpgradeScene } from './scenes/UpgradeScene';
import { RunEndScene } from './scenes/RunEndScene';
import { TitleScene } from './scenes/TitleScene';
import { MemoryIntroScene } from './scenes/MemoryIntroScene';
import { HUDScene } from './scenes/HUDScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: LOGICAL_WIDTH,
  height: LOGICAL_HEIGHT,
  pixelArt: true,
  backgroundColor: '#0b0710',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: { default: 'arcade', arcade: { debug: false } },
  scene: [BootScene, PreloadScene, TitleScene, HubScene, MemoryIntroScene, RunScene, HUDScene, UpgradeScene, RunEndScene],
};

const game = new Phaser.Game(config);

// Hook de depuração para verificação manual no navegador (dev). Sem efeito no jogo.
(window as unknown as { __GAME__: Phaser.Game }).__GAME__ = game;
