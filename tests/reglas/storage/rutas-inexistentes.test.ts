import { assertFails } from '@firebase/rules-unit-testing';
import { ref, uploadBytes } from 'firebase/storage';
import { describe, it } from 'vitest';
import { sembrarBase } from '../helpers/siembra.js';
import { testEnv } from '../setup.js';

describe('rutas que no existen', () => {
  it('deniega video, keypoints y cualquier ruta no declarada', async () => {
    await sembrarBase(testEnv);
    const storage = testEnv.authenticatedContext('propietaria').storage();
    for (const ruta of [
      'usuarios/propietaria/videos/video.mp4',
      'usuarios/propietaria/keypoints/puntos.json',
      'usuarios/propietaria/glosas/secuencia.json',
      'credenciales/token.txt',
    ]) {
      await assertFails(uploadBytes(ref(storage, ruta), new Uint8Array([1])));
    }
  });
});

