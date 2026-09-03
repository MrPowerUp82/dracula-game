import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../../src/core/EventBus';

describe('EventBus', () => {
  it('entrega o payload emitido aos inscritos', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('enemy:died', handler);
    bus.emit('enemy:died', { x: 1, y: 2, xpValue: 5 });
    expect(handler).toHaveBeenCalledWith({ x: 1, y: 2, xpValue: 5 });
  });

  it('off() e o disposer retornado por on() desinscrevem', () => {
    const bus = new EventBus();
    const h1 = vi.fn();
    const h2 = vi.fn();
    const dispose = bus.on('stats:dirty', h1);
    bus.on('stats:dirty', h2);
    dispose();
    bus.off('stats:dirty', h2);
    bus.emit('stats:dirty', {});
    expect(h1).not.toHaveBeenCalled();
    expect(h2).not.toHaveBeenCalled();
  });

  it('once() dispara exatamente uma vez', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.once('player:levelup', handler);
    bus.emit('player:levelup', { level: 2 });
    bus.emit('player:levelup', { level: 3 });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('clear() remove todas as inscrições', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('player:died', handler);
    bus.clear();
    bus.emit('player:died', {});
    expect(handler).not.toHaveBeenCalled();
  });
});
