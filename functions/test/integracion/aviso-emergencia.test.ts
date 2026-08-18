import { describe, expect, it, vi } from 'vitest';
import { procesarAviso } from '../../src/aviso-emergencia/index.js';

describe('aviso de emergencia', () => {
  it('emite un mensaje de datos por destino y no persiste el evento', async () => {
    const enviados: unknown[] = [];
    const request = { auth: { uid: 'propietaria' }, data: {} } as never;
    const borrar = vi.fn(async () => undefined);
    const resultado = await procesarAviso(request, {
      resolver: async () => [{ id: 'd1', token: 'token-1' }, { id: 'd2', token: 'token-2' }],
      enviar: async (mensaje) => { enviados.push(mensaje); return 'id'; },
      borrarDestino: borrar,
      ahora: () => new Date('2026-01-01T00:00:00.000Z'),
    });
    expect(resultado.enviados).toBe(2);
    expect(enviados).toHaveLength(2);
    expect(enviados.every((mensaje) => !('notification' in (mensaje as object)))).toBe(true);
    expect(borrar).not.toHaveBeenCalled();
  });

  it('continúa con los demás destinos y depura uno inválido', async () => {
    const enviados: string[] = [];
    const borrar = vi.fn(async () => undefined);
    const request = { auth: { uid: 'propietaria' }, data: {} } as never;
    const resultado = await procesarAviso(request, {
      resolver: async () => [{ id: 'invalido', token: 'bad' }, { id: 'bueno', token: 'ok' }],
      enviar: async (mensaje) => {
        enviados.push(mensaje.token ?? '');
        if (mensaje.token === 'bad') throw Object.assign(new Error('token'), { code: 'messaging/invalid-registration-token' });
        return 'id';
      },
      borrarDestino: borrar,
      ahora: () => new Date(),
    });
    expect(resultado.enviados).toBe(1);
    expect(enviados).toEqual(['bad', 'ok']);
    expect(borrar).toHaveBeenCalledWith('propietaria', 'invalido');
  });
});

