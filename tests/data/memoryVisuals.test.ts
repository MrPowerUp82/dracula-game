import { describe, it, expect } from 'vitest';
import { MEMORIES } from '../../src/data/memories';

describe('visuals por memória', () => {
  it('mantém chefes e durações definidos para as memórias jogáveis', () => {
    expect(MEMORIES).toHaveLength(5);
    expect(MEMORIES.every((m) => m.bossId && m.bossTimeSec > 0 && m.durationSec > m.bossTimeSec)).toBe(true);
  });
});
