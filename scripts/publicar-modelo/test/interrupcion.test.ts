import { describe, expect, it } from 'vitest';
import { validarPrevia } from '../validar.js';

describe('interrupción antes del compromiso', () => {
  it('rechaza una versión existente antes de subir nuevos artefactos', async () => {
    const db = {
      doc: (ruta: string) => ({
        get: async () => ruta === 'vocabularios/v1'
          ? { exists: true, get: () => 'v1' }
          : { exists: true },
      }),
    } as never;
    await expect(validarPrevia(db, {
      version: 'v2', version_vocabulario: 'v1', publicado_en: new Date().toISOString(),
      artefactos: { modelo: { hash: 'sha256:x', bytes: 1 }, catalogo: { hash: 'sha256:y', bytes: 1 } },
    })).rejects.toThrow('ya fue publicada');
  });
});

