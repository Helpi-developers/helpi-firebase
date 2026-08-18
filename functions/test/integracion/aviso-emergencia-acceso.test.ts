import { describe, expect, it } from 'vitest';
import { procesarAviso } from '../../src/aviso-emergencia/index.js';

describe('autorización de aviso de emergencia', () => {
  it('rechaza la ausencia de autenticación y el perfil ajeno', async () => {
    await expect(procesarAviso({ auth: null, data: {} } as never, undefined)).rejects.toMatchObject({ code: 'unauthenticated' });
    await expect(procesarAviso({ auth: { uid: 'autorizada' }, data: { perfil_id: 'propietaria' } } as never, undefined)).rejects.toMatchObject({ code: 'permission-denied' });
  });
});

