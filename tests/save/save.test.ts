import { describe, it, expect } from 'vitest';
import { loadSave, writeSave, migrate, SAVE_KEY, CORRUPT_KEY, type StorageLike } from '../../src/save/save';
import { defaultSave } from '../../src/save/SaveData';

function fakeStorage(seed: Record<string, string> = {}): StorageLike & { map: Record<string, string> } {
  const map = { ...seed };
  return {
    map,
    getItem: (k) => (k in map ? map[k] : null),
    setItem: (k, v) => {
      map[k] = v;
    },
    removeItem: (k) => {
      delete map[k];
    },
  };
}

describe('save', () => {
  it('storage nulo => save default, não persistente', () => {
    const r = loadSave(null);
    expect(r.save).toEqual(defaultSave());
    expect(r.persistent).toBe(false);
  });

  it('chave vazia => default persistente', () => {
    const r = loadSave(fakeStorage());
    expect(r.recovered).toBe(false);
    expect(r.persistent).toBe(true);
    expect(r.save.unlockedPowers).toEqual(['bat-swarm']);
  });

  it('round-trip: writeSave grava e loadSave lê de volta', () => {
    const s = fakeStorage();
    const data = { ...defaultSave(), essence: 123, memoriesCleared: ['m1'] };
    expect(writeSave(s, data)).toBe(true);
    expect(loadSave(s).save.essence).toBe(123);
    expect(loadSave(s).save.memoriesCleared).toEqual(['m1']);
  });

  it('JSON corrompido => backup no CORRUPT_KEY + save novo', () => {
    const s = fakeStorage({ [SAVE_KEY]: '{ not json' });
    const r = loadSave(s);
    expect(r.recovered).toBe(true);
    expect(r.save).toEqual(defaultSave());
    expect(s.map[CORRUPT_KEY]).toBe('{ not json');
  });

  it('objeto sem version => tratado como corrompido', () => {
    const s = fakeStorage({ [SAVE_KEY]: JSON.stringify({ essence: 5 }) });
    expect(loadSave(s).recovered).toBe(true);
  });

  it('migrate preenche campos ausentes e força version 1', () => {
    const m = migrate({ version: 1, essence: 9 });
    expect(m.version).toBe(1);
    expect(m.essence).toBe(9);
    expect(m.settings.lang).toBe('pt');
    expect(m.stats.runs).toBe(0);
    expect(Array.isArray(m.unlockedPowers)).toBe(true);
  });

  it('writeSave devolve false quando setItem lança (quota)', () => {
    const s: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceeded');
      },
      removeItem: () => {},
    };
    expect(writeSave(s, defaultSave())).toBe(false);
  });
});
