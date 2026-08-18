import { describe, expect, it } from 'vitest';
import { destinoInvalido } from '../../src/comun/envio.js';

describe('destinos inválidos', () => {
  it('reconoce los códigos del proveedor que deben depurarse', () => {
    expect(destinoInvalido({ code: 'messaging/invalid-registration-token' })).toBe(true);
    expect(destinoInvalido({ code: 'messaging/registration-token-not-registered' })).toBe(true);
    expect(destinoInvalido({ code: 'messaging/internal-error' })).toBe(false);
  });
});

