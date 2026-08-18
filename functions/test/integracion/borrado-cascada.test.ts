import { describe, expect, it } from 'vitest';
import { estaVencido, sumarDias } from '../../src/comun/vencimientos.js';

describe('borrado en cascada', () => {
  it('usa el instante absoluto de la marca y puede ejercitarse sin esperar la ventana', () => {
    const solicitado = new Date('2026-01-01T00:00:00.000Z');
    const vence = sumarDias(solicitado, 30);
    expect(estaVencido(vence, new Date('2026-01-31T00:00:01.000Z'))).toBe(true);
  });
});

