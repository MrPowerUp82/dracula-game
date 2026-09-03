import { describe, it, expect } from 'vitest';
import {
  LOGICAL_WIDTH,
  LOGICAL_HEIGHT,
  MAX_ENEMIES,
  MAX_PROJECTILES,
  MAX_PICKUPS,
} from '../src/config/gameConfig';

describe('gameConfig', () => {
  it('expõe a resolução lógica do design', () => {
    expect(LOGICAL_WIDTH).toBe(480);
    expect(LOGICAL_HEIGHT).toBe(270);
  });

  it('define os tetos rígidos do orçamento de performance', () => {
    expect(MAX_ENEMIES).toBe(350);
    expect(MAX_PROJECTILES).toBe(1000);
    expect(MAX_PICKUPS).toBe(800);
  });
});
