import { describe, it, expect } from 'vitest';
import { Player } from '../../src/entities/Player';
import { PLAYER_BASE_SPEED } from '../../src/config/gameConfig';

describe('Player', () => {
  it('começa na origem, parado, sem intent', () => {
    const p = new Player();
    expect(p.pos).toEqual({ x: 0, y: 0 });
    expect(p.vel).toEqual({ x: 0, y: 0 });
    expect(p.intent).toEqual({ x: 0, y: 0 });
  });

  it('usa os stats base e começa com hp cheio', () => {
    const p = new Player();
    expect(p.stats.get('moveSpeed')).toBe(PLAYER_BASE_SPEED);
    expect(p.stats.get('maxHp')).toBe(100);
    expect(p.hp).toBe(p.stats.get('maxHp'));
  });

  it('cada Player tem seus próprios stats', () => {
    const a = new Player();
    const b = new Player();
    a.stats.setBase('moveSpeed', 999);
    expect(b.stats.get('moveSpeed')).toBe(PLAYER_BASE_SPEED);
  });
});
