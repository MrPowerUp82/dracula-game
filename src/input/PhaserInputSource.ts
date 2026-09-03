import Phaser from 'phaser';
import type { InputSource } from '../systems/InputSystem';

/** Lê WASD + setas do teclado do Phaser e devolve um eixo em [-1, 1]. */
export class PhaserInputSource implements InputSource {
  private readonly w: Phaser.Input.Keyboard.Key;
  private readonly a: Phaser.Input.Keyboard.Key;
  private readonly s: Phaser.Input.Keyboard.Key;
  private readonly d: Phaser.Input.Keyboard.Key;
  private readonly space: Phaser.Input.Keyboard.Key;
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard!;
    this.w = kb.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.a = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.s = kb.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.d = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.space = kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.cursors = kb.createCursorKeys();
  }

  consumeDash(): boolean {
    return Phaser.Input.Keyboard.JustDown(this.space);
  }

  getAxis(): { x: number; y: number } {
    const left = this.a.isDown || this.cursors.left.isDown;
    const right = this.d.isDown || this.cursors.right.isDown;
    const up = this.w.isDown || this.cursors.up.isDown;
    const down = this.s.isDown || this.cursors.down.isDown;
    return {
      x: (right ? 1 : 0) - (left ? 1 : 0),
      y: (down ? 1 : 0) - (up ? 1 : 0),
    };
  }
}
