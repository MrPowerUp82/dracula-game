import { describe, it, expect } from 'vitest';
import { STAT_TRACKS, trackCost, buyTrack } from '../../src/meta/statTracks';
import { defaultSave } from '../../src/save/SaveData';

describe('STAT_TRACKS', () => {
  it('tem 10 trilhas, cada uma com 5 custos crescentes', () => {
    expect(STAT_TRACKS).toHaveLength(10);
    for (const t of STAT_TRACKS) {
      expect(t.costs).toHaveLength(t.maxLevel);
      for (let i = 1; i < t.costs.length; i++) expect(t.costs[i]).toBeGreaterThan(t.costs[i - 1]);
    }
  });
});

describe('trackCost', () => {
  it('devolve o custo do próximo nível e null no máximo', () => {
    const t = STAT_TRACKS[0];
    expect(trackCost(t, 0)).toBe(t.costs[0]);
    expect(trackCost(t, t.maxLevel)).toBeNull();
  });
});

describe('buyTrack', () => {
  it('compra quando há essência: deduz e sobe o nível', () => {
    const t = STAT_TRACKS[0];
    const save = { ...defaultSave(), essence: 1000 };
    const r = buyTrack(save, t.key);
    expect(r.ok).toBe(true);
    expect(r.save.essence).toBe(1000 - t.costs[0]);
    expect(r.save.baseStats[t.key]).toBe(1);
  });

  it('falha sem essência suficiente e não muda o save', () => {
    const save = { ...defaultSave(), essence: 0 };
    const r = buyTrack(save, STAT_TRACKS[0].key);
    expect(r.ok).toBe(false);
    expect(r.save).toBe(save);
  });

  it('falha no nível máximo', () => {
    const t = STAT_TRACKS[0];
    const save = { ...defaultSave(), essence: 99999, baseStats: { [t.key]: t.maxLevel } };
    expect(buyTrack(save, t.key).ok).toBe(false);
  });

  it('trilha inexistente falha', () => {
    expect(buyTrack(defaultSave(), 'nope').ok).toBe(false);
  });
});
