import { describe, expect, it } from 'vitest';
import { firmarCodigo } from '../../src/alta-acompanante/verificar.js';

describe('no persistencia del código de vinculación', () => {
  it('emite un valor autocontenido sin escribir en un almacén desde el contrato', () => {
    const codigo = firmarCodigo('propietaria', new Date('2026-01-01T00:10:00.000Z'), 'nonce');
    expect(codigo).toContain('.');
    expect(codigo).not.toContain('firestore');
  });
});

