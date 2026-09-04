import { loadSave, writeSave, safeLocalStorage, type LoadResult, type StorageLike } from './save';
import type { SaveDataV1 } from './SaveData';

let storage: StorageLike | null = null;

/** Chamado uma vez pela BootScene. */
export function initSave(): LoadResult {
  storage = safeLocalStorage();
  return loadSave(storage);
}

export function persistSave(save: SaveDataV1): boolean {
  return writeSave(storage, save);
}
