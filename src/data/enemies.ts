export type EnemyArchetype = 'crawler' | 'runner' | 'brute';

export interface EnemyDef {
  id: EnemyArchetype;
  /** Vida ao surgir. */
  hp: number;
  /** Velocidade de perseguição, px/s. */
  speed: number;
  /** Dano ao encostar no jogador. */
  contactDamage: number;
  /** XP concedido ao morrer. */
  xpValue: number;
  /** Raio de colisão, px. */
  radius: number;
  /** Peso deste inimigo no "budget" do SpawnDirector. */
  budgetCost: number;
}

/**
 * Arquétipos placeholder do Plano 2. Os reskins por memória e os arquétipos
 * completos (atirador, bombista, voador, invocador, elite, enxame) entram no
 * Plano 5. Valores são pontos de partida para playtest, não finais.
 */
export const ENEMY_DEFS: Record<EnemyArchetype, EnemyDef> = {
  crawler: { id: 'crawler', hp: 10, speed: 30, contactDamage: 6, xpValue: 1, radius: 6, budgetCost: 1 },
  runner: { id: 'runner', hp: 6, speed: 62, contactDamage: 5, xpValue: 1, radius: 5, budgetCost: 1 },
  brute: { id: 'brute', hp: 44, speed: 18, contactDamage: 14, xpValue: 3, radius: 10, budgetCost: 3 },
};
