import type { EnemyArchetype } from './enemies';

/** Uma faixa da timeline de spawn: vale a partir de `tSec` até a próxima faixa. */
export interface SpawnPhase {
  tSec: number;
  /** Custo total de inimigos vivos que o director tenta manter nesta faixa. */
  budget: number;
  pool: EnemyArchetype[];
}

export interface MemoryDef {
  id: string;
  durationSec: number;
  timeline: SpawnPhase[];
}

/**
 * Memória de teste do Plano 2 — só serve para exercitar o loop. As 5 memórias
 * reais (com chefe e poder fixo) entram no Plano 5.
 */
export const MEMORY_PLACEHOLDER: MemoryDef = {
  id: 'placeholder',
  durationSec: 600,
  timeline: [
    { tSec: 0, budget: 4, pool: ['crawler'] },
    { tSec: 60, budget: 10, pool: ['crawler', 'runner'] },
    { tSec: 180, budget: 20, pool: ['crawler', 'runner'] },
    { tSec: 360, budget: 34, pool: ['crawler', 'runner', 'brute'] },
  ],
};
