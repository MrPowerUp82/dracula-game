import { defaultSave, type SaveDataV1 } from './SaveData';

export const SAVE_KEY = 'dracula.save.v1';
export const CORRUPT_KEY = 'dracula.save.corrupt';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface LoadResult {
  save: SaveDataV1;
  recovered: boolean;
  persistent: boolean;
}

export function safeLocalStorage(): StorageLike | null {
  try {
    const ls = (globalThis as { localStorage?: StorageLike }).localStorage;
    if (!ls) return null;
    const probe = '__dracula_probe__';
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return ls;
  } catch {
    return null;
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function num(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}
function strArray(v: unknown, fallback: string[]): string[] {
  return Array.isArray(v) && v.every((x) => typeof x === 'string') ? (v as string[]) : fallback;
}
function numRecord(v: unknown, fallback: Record<string, number>): Record<string, number> {
  if (!isRecord(v)) return fallback;
  const out: Record<string, number> = {};
  for (const [k, val] of Object.entries(v)) {
    if (typeof val === 'number' && Number.isFinite(val)) out[k] = val;
  }
  return out;
}

export function migrate(raw: Record<string, unknown>): SaveDataV1 {
  const d = defaultSave();
  const settings = isRecord(raw.settings) ? raw.settings : {};
  const stats = isRecord(raw.stats) ? raw.stats : {};
  return {
    version: 1,
    essence: num(raw.essence, d.essence),
    baseStats: numRecord(raw.baseStats, d.baseStats),
    unlockedPowers: strArray(raw.unlockedPowers, d.unlockedPowers),
    memoriesCleared: strArray(raw.memoriesCleared, d.memoriesCleared),
    permanentPowers: strArray(raw.permanentPowers, d.permanentPowers),
    coffinRevives: num(raw.coffinRevives, d.coffinRevives),
    settings: {
      screenShake:
        typeof settings.screenShake === 'boolean' ? settings.screenShake : d.settings.screenShake,
      damageNumbers:
        typeof settings.damageNumbers === 'boolean' ? settings.damageNumbers : d.settings.damageNumbers,
      lang: typeof settings.lang === 'string' ? settings.lang : d.settings.lang,
      volumeMusic: num(settings.volumeMusic, d.settings.volumeMusic),
      volumeSfx: num(settings.volumeSfx, d.settings.volumeSfx),
    },
    stats: {
      runs: num(stats.runs, d.stats.runs),
      kills: num(stats.kills, d.stats.kills),
      bestTimeByMemory: numRecord(stats.bestTimeByMemory, d.stats.bestTimeByMemory),
    },
  };
}

export function loadSave(storage: StorageLike | null): LoadResult {
  if (!storage) return { save: defaultSave(), recovered: false, persistent: false };
  const raw = storage.getItem(SAVE_KEY);
  if (raw == null) return { save: defaultSave(), recovered: false, persistent: true };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    storage.setItem(CORRUPT_KEY, raw);
    return { save: defaultSave(), recovered: true, persistent: true };
  }
  if (!isRecord(parsed) || typeof parsed.version !== 'number') {
    storage.setItem(CORRUPT_KEY, raw);
    return { save: defaultSave(), recovered: true, persistent: true };
  }
  return { save: migrate(parsed), recovered: false, persistent: true };
}

export function writeSave(storage: StorageLike | null, data: SaveDataV1): boolean {
  if (!storage) return false;
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
