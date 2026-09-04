import { POWER_DEFS, type PowerDef } from '../data/powers';

export interface OwnedPower {
  def: PowerDef;
  level: number;
}

/** Poderes equipados na run atual. Puro — o PowerSystem lê e materializa. */
export class PowerRoster {
  private readonly map = new Map<string, OwnedPower>();
  /** Incrementa a cada mutação efetiva; o PowerSystem usa para ressincronizar. */
  revision = 0;

  has(id: string): boolean {
    return this.map.has(id);
  }

  get(id: string): OwnedPower | undefined {
    return this.map.get(id);
  }

  count(): number {
    return this.map.size;
  }

  list(): OwnedPower[] {
    return [...this.map.values()];
  }

  equip(id: string): void {
    if (this.map.has(id) || !POWER_DEFS[id]) return;
    this.map.set(id, { def: POWER_DEFS[id], level: 1 });
    this.revision++;
  }

  levelUp(id: string): void {
    const owned = this.map.get(id);
    if (!owned || owned.level >= owned.def.maxLevel) return;
    owned.level++;
    this.revision++;
  }

  evolve(fromId: string, toId: string): void {
    if (!this.map.has(fromId)) return;
    this.map.delete(fromId);
    this.map.set(toId, { def: POWER_DEFS[toId], level: 1 });
    this.revision++;
  }
}

export function canEvolve(roster: PowerRoster, id: string): boolean {
  const owned = roster.get(id);
  if (!owned || !owned.def.evolvesTo || !owned.def.evolveReq) return false;
  return owned.def.evolveReq.every((req) => (roster.get(req.powerId)?.level ?? 0) >= req.minLevel);
}
