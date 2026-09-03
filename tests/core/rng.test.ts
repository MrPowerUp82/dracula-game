import { describe, it, expect } from 'vitest';
import { Rng } from '../../src/core/Rng';

describe('Rng', () => {
  it('é determinístico para a mesma seed', () => {
    const a = new Rng(12345);
    const b = new Rng(12345);
    const seqA = Array.from({ length: 10 }, () => a.next());
    const seqB = Array.from({ length: 10 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('gera sequências diferentes para seeds diferentes', () => {
    expect(new Rng(1).next()).not.toBe(new Rng(2).next());
  });

  it('next() fica em [0, 1)', () => {
    const r = new Rng(7);
    for (let i = 0; i < 1000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('int() respeita limites inclusivos e retorna inteiros', () => {
    const r = new Rng(99);
    for (let i = 0; i < 1000; i++) {
      const v = r.int(3, 6);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(6);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it('pick() é determinístico e devolve um elemento da lista', () => {
    const items = ['a', 'b', 'c', 'd'] as const;
    expect(new Rng(42).pick(items)).toBe(new Rng(42).pick(items));
    expect(items).toContain(new Rng(42).pick(items));
  });

  it('chance(0) nunca acontece e chance(1) sempre acontece', () => {
    const r = new Rng(5);
    for (let i = 0; i < 50; i++) {
      expect(r.chance(0)).toBe(false);
      expect(r.chance(1)).toBe(true);
    }
  });
});
