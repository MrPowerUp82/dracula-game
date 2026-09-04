import type { System } from './System';
import type { World } from '../world/World';
import { IFRAME_MS } from '../config/gameConfig';

/**
 * Dano por encostar num inimigo. Um acerto por janela de i-frames — o primeiro
 * inimigo a tocar o jogador no frame causa dano e ativa a invulnerabilidade;
 * os demais são ignorados até os i-frames expirarem.
 */
export class ContactDamageSystem implements System {
  update(world: World): void {
    const p = world.player;
    const now = world.time.elapsedMs;
    if (now < p.invulnUntilMs) return;

    world.enemies.forEachActive((e) => {
      if (world.time.elapsedMs < p.invulnUntilMs) return; // já foi atingido neste frame
      const dx = e.pos.x - p.pos.x;
      const dy = e.pos.y - p.pos.y;
      const rr = p.radius + e.radius;
      if (dx * dx + dy * dy > rr * rr) return;

      const dmg = Math.max(1, e.contactDamage - p.stats.get('armor'));
      p.hp -= dmg;
      p.invulnUntilMs = world.time.elapsedMs + IFRAME_MS;
      world.events.emit('player:damaged', { amount: dmg, hpRemaining: p.hp });
      if (p.hp <= 0) {
        p.hp = 0;
        world.events.emit('player:died', {});
      }
    });

    const b = world.boss;
    if (b.active && b.phase !== 'intro' && world.time.elapsedMs >= p.invulnUntilMs) {
      const dx = b.pos.x - p.pos.x;
      const dy = b.pos.y - p.pos.y;
      const rr = p.radius + b.radius;
      if (dx * dx + dy * dy <= rr * rr) {
        const dmg = Math.max(1, b.contactDamage - p.stats.get('armor'));
        p.hp -= dmg;
        p.invulnUntilMs = world.time.elapsedMs + IFRAME_MS;
        world.events.emit('player:damaged', { amount: dmg, hpRemaining: p.hp });
        if (p.hp <= 0) {
          p.hp = 0;
          world.events.emit('player:died', {});
        }
      }
    }
  }
}
