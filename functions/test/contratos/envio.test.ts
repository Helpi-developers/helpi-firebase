import { describe, expect, it } from 'vitest';
import { mensajeEmergencia, mensajeNovedad, mensajeVinculoCerrado } from '../../src/comun/envio.js';

describe('contratos de envío', () => {
  it('construye los tres mensajes como datos sin campos sensibles', () => {
    const mensajes = [
      mensajeEmergencia('perfil-opaco', new Date('2026-01-01T00:00:00.000Z'), 'token'),
      mensajeNovedad('modelo', 'v2', 'novedades_modelo'),
      mensajeVinculoCerrado('perfil-opaco', 'token'),
    ];
    for (const mensaje of mensajes) {
      expect('notification' in mensaje).toBe(false);
      expect(Object.values(mensaje.data).every((valor) => typeof valor === 'string')).toBe(true);
      expect(mensaje.data).not.toHaveProperty('nombre');
      expect(mensaje.data).not.toHaveProperty('ubicacion');
      expect(mensaje.data).not.toHaveProperty('diagnostico');
      expect(mensaje.data).not.toHaveProperty('contenido');
    }
  });
});

