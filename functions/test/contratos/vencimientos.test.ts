import { describe, expect, it } from 'vitest';
import { estaVencido, sumarDias, sumarMinutos } from '../../src/comun/vencimientos.js';

describe('vencimientos como instantes absolutos', () => {
  it('trata un instante sembrado en el pasado como vencido', () => {
    const inicio = new Date('2026-01-01T00:00:00.000Z');
    const vence = sumarMinutos(inicio, 10);
    expect(estaVencido(vence, new Date('2026-01-01T00:10:01.000Z'))).toBe(true);
    expect(estaVencido(vence, new Date('2026-01-01T00:09:59.000Z'))).toBe(false);
  });

  it('calcula la ventana de gracia sin depender de la zona horaria', () => {
    expect(sumarDias(new Date('2026-01-01T00:00:00.000Z'), 30).toISOString()).toBe('2026-01-31T00:00:00.000Z');
  });
});

