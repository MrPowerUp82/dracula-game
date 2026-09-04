import { describe, it, expect } from 'vitest';
import { essenceForRun, applyRunResult } from '../../src/meta/runReward';
import { defaultSave } from '../../src/save/SaveData';

describe('essenceForRun', () => {
  it('vitória rende mais que derrota para os mesmos abates', () => {
    expect(essenceForRun(100, true)).toBeGreaterThan(essenceForRun(100, false));
  });

  it('derrota paga ~40% (com teto menor)', () => {
    // raw = 20 + 100*0.6 = 80; derrota => floor(min(80,140)*0.4) = 32
    expect(essenceForRun(100, false)).toBe(32);
  });

  it('vitória tem teto de 220', () => {
    expect(essenceForRun(100000, true)).toBe(220);
  });
});

describe('applyRunResult', () => {
  it('vitória credita essência, marca a memória e concede o poder permanente', () => {
    const save = defaultSave();
    const next = applyRunResult(save, { memoryId: 'm1', kills: 50, victory: true, rewardPowerId: 'mist-form' });
    expect(next.essence).toBeGreaterThan(0);
    expect(next.memoriesCleared).toContain('m1');
    expect(next.permanentPowers).toContain('mist-form');
    expect(next.stats.runs).toBe(1);
    expect(next.stats.kills).toBe(50);
  });

  it('derrota credita essência mas não marca memória nem concede poder', () => {
    const next = applyRunResult(defaultSave(), { memoryId: 'm1', kills: 10, victory: false });
    expect(next.memoriesCleared).toEqual([]);
    expect(next.permanentPowers).toEqual([]);
    expect(next.stats.runs).toBe(1);
  });

  it('repetir a mesma memória não duplica na lista', () => {
    let s = applyRunResult(defaultSave(), { memoryId: 'm1', kills: 1, victory: true, rewardPowerId: 'mist-form' });
    s = applyRunResult(s, { memoryId: 'm1', kills: 1, victory: true, rewardPowerId: 'mist-form' });
    expect(s.memoriesCleared).toEqual(['m1']);
    expect(s.permanentPowers).toEqual(['mist-form']);
  });
});
