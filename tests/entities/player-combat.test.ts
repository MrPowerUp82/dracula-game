import { describe, it, expect } from 'vitest';
import { Player, DEFAULT_PLAYER_STATS } from '../../src/entities/Player';
import { PLAYER_RADIUS, PLAYER_PICKUP_RADIUS } from '../../src/config/gameConfig';

describe('Player (campos de combate)', () => {
  it('tem raio de colisão e nenhum i-frame ativo ao nascer', () => {
    const p = new Player();
    expect(p.radius).toBe(PLAYER_RADIUS);
    expect(p.invulnUntilMs).toBe(0);
  });

  it('tem pickupRadius nos stats padrão', () => {
    const p = new Player();
    expect(p.stats.pickupRadius).toBe(PLAYER_PICKUP_RADIUS);
    expect(DEFAULT_PLAYER_STATS.pickupRadius).toBe(PLAYER_PICKUP_RADIUS);
  });
});
