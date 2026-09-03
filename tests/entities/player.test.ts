import { describe, it, expect } from 'vitest';
import { Player, DEFAULT_PLAYER_STATS } from '../../src/entities/Player';
import { PLAYER_BASE_SPEED } from '../../src/config/gameConfig';

describe('Player', () => {
  it('começa na origem, parado, sem intent', () => {
    const p = new Player();
    expect(p.pos).toEqual({ x: 0, y: 0 });
    expect(p.vel).toEqual({ x: 0, y: 0 });
    expect(p.intent).toEqual({ x: 0, y: 0 });
  });

  it('usa os stats padrão e começa com hp cheio', () => {
    const p = new Player();
    expect(p.stats.moveSpeed).toBe(PLAYER_BASE_SPEED);
    expect(p.stats.maxHp).toBe(100);
    expect(p.hp).toBe(p.stats.maxHp);
  });

  it('tem stats próprios (não compartilha a referência do default)', () => {
    const p = new Player();
    p.stats.moveSpeed = 999;
    expect(DEFAULT_PLAYER_STATS.moveSpeed).toBe(PLAYER_BASE_SPEED);
  });
});
