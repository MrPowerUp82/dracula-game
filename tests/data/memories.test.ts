import { describe, it, expect } from 'vitest';
import { MEMORIES, MEMORY_PLACEHOLDER, memoryUnlocked } from '../../src/data/memories';
import { defaultSave } from '../../src/save/SaveData';

describe('MEMORIES', () => {
  it('tem 3 memórias com id/nome/timeline e MEMORY_PLACEHOLDER = a primeira', () => {
    expect(MEMORIES).toHaveLength(3);
    for (const m of MEMORIES) {
      expect(m.id).toBeTruthy();
      expect(m.name).toBeTruthy();
      expect(m.timeline.length).toBeGreaterThan(0);
      expect(m.durationSec).toBeGreaterThan(0);
    }
    expect(MEMORY_PLACEHOLDER).toBe(MEMORIES[0]);
  });

  it('memoryUnlocked: a 1ª é livre; a 2ª exige a 1ª concluída', () => {
    const save = defaultSave();
    expect(memoryUnlocked(save, 0)).toBe(true);
    expect(memoryUnlocked(save, 1)).toBe(false);
    expect(memoryUnlocked({ ...save, memoriesCleared: [MEMORIES[0].id] }, 1)).toBe(true);
  });
});
