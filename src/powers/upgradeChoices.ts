import type { Rng } from '../core/Rng';
import type { World } from '../world/World';
import { PowerRoster, canEvolve } from './PowerRoster';
import { POWER_DEFS } from '../data/powers';

export interface UpgradeChoice {
  kind: 'new' | 'level' | 'evolve' | 'heal';
  powerId?: string;
  evolveTo?: string;
  title: string;
  detail: string;
}

const HEAL_AMOUNT = 20;

export function rollUpgradeChoices(
  roster: PowerRoster,
  rng: Rng,
  opts: { maxOwned?: number; unlockedPool?: string[] } = {},
): UpgradeChoice[] {
  const maxOwned = opts.maxOwned ?? 6;
  const pool = opts.unlockedPool ?? Object.keys(POWER_DEFS).filter((id) => id !== 'nosferatu');
  const cands: UpgradeChoice[] = [];

  for (const owned of roster.list()) {
    if (!canEvolve(roster, owned.def.id)) continue;
    const toId = owned.def.evolvesTo!;
    cands.push({
      kind: 'evolve',
      powerId: owned.def.id,
      evolveTo: toId,
      title: `Evoluir: ${POWER_DEFS[toId].name}`,
      detail: `${owned.def.name} se transforma em ${POWER_DEFS[toId].name}.`,
    });
  }

  for (const owned of roster.list()) {
    if (owned.level >= owned.def.maxLevel) continue;
    cands.push({
      kind: 'level',
      powerId: owned.def.id,
      title: `${owned.def.name} — Nível ${owned.level + 1}`,
      detail: 'Reforça este poder.',
    });
  }

  if (roster.count() < maxOwned) {
    for (const id of pool) {
      if (id === 'nosferatu' || roster.has(id) || !POWER_DEFS[id]) continue;
      cands.push({
        kind: 'new',
        powerId: id,
        title: `Novo: ${POWER_DEFS[id].name}`,
        detail: 'Adiciona um poder ao arsenal.',
      });
    }
  }

  // Evoluções são first-class: sempre aparecem. O resto entra embaralhado.
  const evolves = cands.filter((c) => c.kind === 'evolve');
  const rest = cands.filter((c) => c.kind !== 'evolve');
  for (let i = rest.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    const tmp = rest[i];
    rest[i] = rest[j];
    rest[j] = tmp;
  }

  const picks = [...evolves, ...rest].slice(0, 3);
  while (picks.length < 3) {
    picks.push({
      kind: 'heal',
      title: 'Golpe de Sangue',
      detail: `Recupera ${HEAL_AMOUNT} de vida.`,
    });
  }
  return picks;
}

export function applyUpgradeChoice(world: World, c: UpgradeChoice): void {
  if (c.kind === 'new' && c.powerId) {
    world.powers.equip(c.powerId);
  } else if (c.kind === 'level' && c.powerId) {
    world.powers.levelUp(c.powerId);
  } else if (c.kind === 'evolve' && c.powerId && c.evolveTo) {
    world.powers.evolve(c.powerId, c.evolveTo);
  } else if (c.kind === 'heal') {
    world.player.hp = Math.min(world.player.stats.get('maxHp'), world.player.hp + HEAL_AMOUNT);
  }
}
