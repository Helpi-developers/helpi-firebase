import { describe, expect, it } from 'vitest';
import { firmarCodigo, verificarCodigo } from '../../src/alta-acompanante/verificar.js';

describe('rechazos indistinguibles del alta', () => {
  it('devuelve null para código manipulado, vencido e inexistente', () => {
    const ahora = new Date('2026-01-01T00:00:00.000Z');
    const valido = firmarCodigo('propietaria', new Date('2026-01-01T00:10:00.000Z'), 'nonce');
    expect(verificarCodigo(`${valido}x`)).toBeNull();
    expect(verificarCodigo('inexistente')).toBeNull();
    expect(verificarCodigo(firmarCodigo('propietaria', new Date(ahora.getTime() - 1000), 'nonce'))).toBeNull();
  });
});

