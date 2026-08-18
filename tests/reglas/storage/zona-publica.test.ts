import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { getBytes, ref, uploadBytes, type FirebaseStorage } from 'firebase/storage';
import { describe, it } from 'vitest';
import { sembrarBase } from '../helpers/siembra.js';
import { testEnv } from '../setup.js';

describe('zona pública de Storage', () => {
  it('permite lectura autenticada y deniega escritura y lectura anónima', async () => {
    await sembrarBase(testEnv);
    const ruta = 'modelos/v1/modelo';
    let adminStorage!: FirebaseStorage;
    await testEnv.withSecurityRulesDisabled(async (context) => { adminStorage = context.storage(); });
    await uploadBytes(ref(adminStorage, ruta), new Uint8Array([1, 2, 3]));
    for (const uid of ['propietaria', 'autorizada', 'ajena']) {
      const storage = testEnv.authenticatedContext(uid).storage();
      await assertSucceeds(getBytes(ref(storage, ruta)));
      await assertFails(uploadBytes(ref(storage, `modelos/v1/${uid}`), new Uint8Array([4])));
    }
    await assertFails(getBytes(ref(testEnv.unauthenticatedContext().storage(), ruta)));
  });
});
