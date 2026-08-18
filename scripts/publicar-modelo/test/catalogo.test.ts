import { describe, expect, it } from 'vitest';
import { validarVocabulario } from '../validar.js';

describe('validación de catálogo', () => {
  it('rechaza un vocabulario inexistente o no correspondiente', async () => {
    const db = { doc: () => ({ get: async () => ({ exists: false }) }) } as never;
    await expect(validarVocabulario(db, {
      version: 'v2', version_vocabulario: 'v9', publicado_en: new Date().toISOString(),
      artefactos: { modelo: { hash: 'sha256:x', bytes: 1 }, catalogo: { hash: 'sha256:y', bytes: 1 } },
    })).rejects.toThrow('no existe');
  });
});

