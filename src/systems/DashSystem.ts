import type { System } from './System';
import type { World } from '../world/World';
import type { InputSource } from './InputSystem';
import { powerLevel } from '../data/powers';
import { cooldownMult } from '../stats/derive';
import { DASH_DEFAULT_IFRAME_MS } from '../config/gameConfig';

/** Forma de Névoa: dash manual (Espaço) com i-frames, se o poder estiver equipado. */
export class DashSystem implements System {
  private cdLeftMs = 0;

  constructor(private readonly source: InputSource) {}

  update(world: World, deltaMs: number): void {
    this.cdLeftMs = Math.max(0, this.cdLeftMs - deltaMs);
    const pressed = this.source.consumeDash();
    const owned = world.powers.get('mist-form');
    if (!owned || !pressed || this.cdLeftMs > 0) return;

    const p = world.player;
    let dx = p.intent.x;
    let dy = p.intent.y;
    if (dx === 0 && dy === 0) {
      dx = Math.sign(p.vel.x);
      dy = Math.sign(p.vel.y);
    }
    if (dx === 0 && dy === 0) dx = 1;

    const lv = powerLevel(owned.def, owned.level);
    const len = Math.hypot(dx, dy) || 1;
    const dist = lv.speed ?? 80;
    const fromX = p.pos.x;
    const fromY = p.pos.y;
    p.pos.x += (dx / len) * dist;
    p.pos.y += (dy / len) * dist;
    world.events.emit('player:dashed', { fromX, fromY, toX: p.pos.x, toY: p.pos.y });

    p.invulnUntilMs = Math.max(
      p.invulnUntilMs,
      world.time.elapsedMs + (lv.iframeMs ?? DASH_DEFAULT_IFRAME_MS),
    );
    this.cdLeftMs = (lv.cooldownMs ?? 3500) * cooldownMult(p.stats);
  }
}
