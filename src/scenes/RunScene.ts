import Phaser from 'phaser';
import { createWorld, advanceTime, type World } from '../world/World';
import type { System } from '../systems/System';
import { InputSystem } from '../systems/InputSystem';
import { MovementSystem } from '../systems/MovementSystem';
import { CameraSystem } from '../systems/CameraSystem';
import { PhaserInputSource } from '../input/PhaserInputSource';

export class RunScene extends Phaser.Scene {
  private world!: World;
  private systems: System[] = [];
  private playerSprite!: Phaser.GameObjects.Image;

  constructor() {
    super('Run');
  }

  create(): void {
    const seed = Math.floor(Math.random() * 0xffffffff) >>> 0;
    this.world = createWorld(seed);

    const input = new PhaserInputSource(this);
    this.systems = [new InputSystem(input), new MovementSystem(), new CameraSystem()];

    // grade de referência em espaço de mundo, só para o movimento ser visível
    this.add
      .grid(0, 0, 4000, 4000, 32, 32, 0x140d1c, 1, 0x241a30, 1)
      .setDepth(-10);

    this.playerSprite = this.add.image(0, 0, 'dev-player');
  }

  update(_time: number, delta: number): void {
    advanceTime(this.world, delta);
    for (const system of this.systems) system.update(this.world, delta);

    this.playerSprite.setPosition(this.world.player.pos.x, this.world.player.pos.y);
    this.cameras.main.centerOn(this.world.camera.x, this.world.camera.y);
  }
}
