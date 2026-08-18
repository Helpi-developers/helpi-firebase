import { describe, expect, it } from 'vitest';
import { mensajeNovedad } from '../../src/comun/envio.js';

describe('forma de la novedad', () => {
  it('no incluye carga de notificación ni contenido', () => {
    const mensaje = mensajeNovedad('vocabulario', 'v1', 'novedades_vocabulario');
    expect('notification' in mensaje).toBe(false);
    expect(Object.keys(mensaje.data)).toEqual(['tipo', 'categoria', 'version']);
  });
});

