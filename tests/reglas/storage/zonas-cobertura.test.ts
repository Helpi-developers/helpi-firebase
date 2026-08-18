import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { getBytes, ref, uploadBytes, type FirebaseStorage } from 'firebase/storage';
import { describe, it } from 'vitest';
import { sembrarBase } from '../helpers/siembra.js';
import { testEnv } from '../setup.js';

describe('cobertura de zonas', () => {
  it('no deja una ubicación sin la decisión esperada', async () => {
    await sembrarBase(testEnv);
    const storage = testEnv.authenticatedContext('propietaria').storage();
    let adminStorage!: FirebaseStorage;
    await testEnv.withSecurityRulesDisabled(async (context) => { adminStorage = context.storage(); });
    await uploadBytes(ref(adminStorage, 'modelos/v1/catalogo'), new Uint8Array([1]));
    await uploadBytes(ref(adminStorage, 'pictogramas/global.webp'), new Uint8Array([1]));
    await assertSucceeds(getBytes(ref(storage, 'modelos/v1/catalogo')));
    await assertSucceeds(getBytes(ref(storage, 'pictogramas/global.webp')));
    await assertSucceeds(uploadBytes(ref(storage, 'usuarios/propietaria/pictogramas/local.webp'), new Uint8Array([1])));
    await assertFails(uploadBytes(ref(storage, 'modelos/v1/catalogo'), new Uint8Array([2])));
  });
});
