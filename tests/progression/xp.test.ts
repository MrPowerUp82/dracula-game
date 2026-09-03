import { describe, it, expect } from 'vitest';
import { xpToNext } from '../../src/progression/xp';

describe('xpToNext', () => {
  it('segue a fórmula do design em níveis-chave', () => {
    expect(xpToNext(1)).toBe(5 + 4 + 0); // 9
    expect(xpToNext(5)).toBe(5 + 20 + 0); // 25
    expect(xpToNext(9)).toBe(5 + 36 + 0); // 41
    expect(xpToNext(10)).toBe(5 + 40 + 20); // 65
    expect(xpToNext(11)).toBe(5 + 44 + 20); // 69
    expect(xpToNext(20)).toBe(5 + 80 + 40); // 125
  });

  it('é estritamente crescente do nível 1 ao 60', () => {
    for (let l = 1; l < 60; l++) {
      expect(xpToNext(l + 1)).toBeGreaterThan(xpToNext(l));
    }
  });
});
