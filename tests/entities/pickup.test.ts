import { describe, it, expect } from 'vitest';
import { Pickup } from '../../src/entities/Pickup';

describe('Pickup', () => {
  it('começa inativo, sem valor, não magnetizado', () => {
    const p = new Pickup();
    expect(p.active).toBe(false);
    expect(p.value).toBe(0);
    expect(p.magnetized).toBe(false);
  });

  it('spawn() define tipo, posição e valor', () => {
    const p = new Pickup();
    p.spawn('xpGem', 12, 34, 5);
    expect(p.kind).toBe('xpGem');
    expect(p.pos).toEqual({ x: 12, y: 34 });
    expect(p.value).toBe(5);
    expect(p.magnetized).toBe(false);
  });

  it('reset() zera valor e desmagnetiza', () => {
    const p = new Pickup();
    p.spawn('xpGem', 1, 2, 9);
    p.magnetized = true;
    p.reset();
    expect(p.value).toBe(0);
    expect(p.magnetized).toBe(false);
    expect(p.pos).toEqual({ x: 0, y: 0 });
  });
});
