import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { deleteObject, getBytes, ref, uploadBytes } from 'firebase/storage';
import { describe, it } from 'vitest';
import { sembrarBase } from '../helpers/siembra.js';
import { testEnv } from '../setup.js';

describe('zona de Storage por cuenta', () => {
  it('permite leer, escribir y borrar a propietaria y autorizada', async () => {
    await sembrarBase(testEnv);
    const ruta = 'usuarios/propietaria/pictogramas/imagen.webp';
    for (const uid of ['propietaria', 'autorizada']) {
      const storage = testEnv.authenticatedContext(uid).storage();
      await assertSucceeds(uploadBytes(ref(storage, ruta), new Uint8Array([1, 2])));
      await assertSucceeds(getBytes(ref(storage, ruta)));
      await assertSucceeds(deleteObject(ref(storage, ruta)));
    }
    for (const uid of ['ajena', 'sin_autenticar']) {
      const storage = uid === 'sin_autenticar'
        ? testEnv.unauthenticatedContext().storage()
        : testEnv.authenticatedContext(uid).storage();
      await assertFails(uploadBytes(ref(storage, ruta), new Uint8Array([1])));
      await assertFails(getBytes(ref(storage, ruta)));
    }
  });

  it('aplica la misma separación a los audios por cuenta', async () => {
    await sembrarBase(testEnv);
    const ruta = 'usuarios/propietaria/audios/audio.webm';
    await assertSucceeds(uploadBytes(ref(testEnv.authenticatedContext('propietaria').storage(), ruta), new Uint8Array([1])));
    await assertSucceeds(getBytes(ref(testEnv.authenticatedContext('autorizada').storage(), ruta)));
    await assertFails(getBytes(ref(testEnv.authenticatedContext('ajena').storage(), ruta)));
  });
});

