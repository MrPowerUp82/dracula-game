import { describe, expect, it } from 'vitest';
import { ENEMY_DEFS } from '../../src/data/enemies';
import { MEMORIES } from '../../src/data/memories';
import { POWER_DEFS } from '../../src/data/powers';
import { BOSS_DEFS } from '../../src/data/bosses';

describe('roster completo do design', () => {
  it('possui os nove arquétipos de inimigos', () => {
    expect(Object.keys(ENEMY_DEFS).sort()).toEqual(
      ['bomber', 'brute', 'crawler', 'elite', 'flyer', 'runner', 'shooter', 'summoner', 'swarm'].sort(),
    );
  });

  it('possui cinco memórias com chefe válido e recompensa válida quando houver', () => {
    expect(MEMORIES).toHaveLength(5);
    for (const memory of MEMORIES) {
      expect(BOSS_DEFS[memory.bossId]).toBeDefined();
      if (memory.rewardPowerId) expect(POWER_DEFS[memory.rewardPowerId]).toBeDefined();
      for (const phase of memory.timeline) {
        for (const id of phase.pool) expect(ENEMY_DEFS[id]).toBeDefined();
      }
    }
  });

  it('M3 e M4 concedem os poderes permanentes do DESIGN.md', () => {
    expect(MEMORIES[2].rewardPowerId).toBe('wolf-pack');
    expect(MEMORIES[3].rewardPowerId).toBe('night-domain');
  });
});
