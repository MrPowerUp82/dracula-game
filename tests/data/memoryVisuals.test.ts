import { describe, it, expect } from 'vitest';
import { MEMORIES } from '../../src/data/memories';
import { MEMORY_VISUALS } from '../../src/data/memoryVisuals';

describe('visuals por memória', () => {
  it('mantém chefes e durações definidos para as memórias jogáveis', () => {
    expect(MEMORIES).toHaveLength(5);
    expect(MEMORIES.every((m) => m.bossId && m.bossTimeSec > 0 && m.durationSec > m.bossTimeSec)).toBe(true);
  });

  it('centraliza um visual completo para cada memória sem inventar chaves vazias', () => {
    for (const memory of MEMORIES) {
      const visuals = MEMORY_VISUALS[memory.id];
      expect(visuals.introArt).toBeTruthy();
      expect(visuals.parallaxKeys).toHaveLength(3);
      expect(Object.keys(visuals.enemySprites)).toHaveLength(9);
    }
  });
});
