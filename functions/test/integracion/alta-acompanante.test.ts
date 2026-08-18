import { describe, expect, it } from 'vitest';
import { firmarCodigo, verificarCodigo } from '../../src/alta-acompanante/verificar.js';

describe('alta de acompañante', () => {
  it('verifica un código vigente sin consultar un almacén', () => {
    const codigo = firmarCodigo('propietaria', new Date(Date.now() + 60_000), 'nonce');
    expect(verificarCodigo(codigo)?.emisor).toBe('propietaria');
  });
});

