import Phaser from 'phaser';
import { initSave } from '../save/session';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    const r = initSave();
    this.registry.set('save', r.save);
    this.registry.set('savePersistent', r.persistent);
    this.registry.set('saveRecovered', r.recovered);
    this.scene.start('Preload');
  }
}
