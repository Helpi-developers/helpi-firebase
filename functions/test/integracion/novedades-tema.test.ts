import { describe, expect, it } from 'vitest';
import { publicarNovedad } from '../../src/novedades-tema/index.js';

describe('novedades por tema', () => {
  it('publica disponibilidad sin transportar contenido', async () => {
    let mensaje: Record<string, unknown> | undefined;
    const emitido = await publicarNovedad({ categoria: 'modelo', version: 'v2' }, async (valor) => {
      mensaje = valor as unknown as Record<string, unknown>;
      return 'id';
    });
    expect(emitido).toBe(true);
    expect(mensaje).toMatchObject({ topic: 'novedades_modelo' });
    expect(mensaje).not.toHaveProperty('notification');
    expect(mensaje).not.toHaveProperty('contenido');
  });

  it('termina sin emitir para una categoría desconocida', async () => {
    let llamadas = 0;
    expect(await publicarNovedad({ categoria: 'desconocida', version: 'v2' }, async () => { llamadas += 1; return 'id'; })).toBe(false);
    expect(llamadas).toBe(0);
  });
});

