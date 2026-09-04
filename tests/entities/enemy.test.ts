import { describe, it, expect } from 'vitest';
import { Enemy } from '../../src/entities/Enemy';
import { ENEMY_DEFS } from '../../src/data/enemies';

describe('Enemy', () => {
  it('começa inativo e zerado', () => {
    const e = new Enemy();
    expect(e.active).toBe(false);
    expect(e.hp).toBe(0);
    expect(e.pos).toEqual({ x: 0, y: 0 });
  });

  it('spawn() copia os campos da definição e posiciona', () => {
    const e = new Enemy();
    e.spawn(ENEMY_DEFS.brute, 100, -40);
    expect(e.defId).toBe('brute');
    expect(e.pos).toEqual({ x: 100, y: -40 });
    expect(e.hp).toBe(ENEMY_DEFS.brute.hp);
    expect(e.speed).toBe(ENEMY_DEFS.brute.speed);
    expect(e.contactDamage).toBe(ENEMY_DEFS.brute.contactDamage);
    expect(e.xpValue).toBe(ENEMY_DEFS.brute.xpValue);
    expect(e.radius).toBe(ENEMY_DEFS.brute.radius);
  });

  it('reset() volta ao estado zerado sem trocar a referência de pos', () => {
    const e = new Enemy();
    const posRef = e.pos;
    e.spawn(ENEMY_DEFS.runner, 5, 5);
    e.reset();
    expect(e.pos).toBe(posRef);
    expect(e.pos).toEqual({ x: 0, y: 0 });
    expect(e.hp).toBe(0);
    expect(e.speed).toBe(0);
  });

  it('os arquétipos base continuam válidos com budgetCost >= 1', () => {
    for (const key of ['crawler', 'runner', 'brute'] as const) {
      const def = ENEMY_DEFS[key];
      expect(def.id).toBe(key);
      expect(def.hp).toBeGreaterThan(0);
      expect(def.budgetCost).toBeGreaterThanOrEqual(1);
    }
  });
});
