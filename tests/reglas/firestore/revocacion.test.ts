import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { describe, it } from 'vitest';
import { autorizada, propietaria } from '../helpers/identidades.js';
import { sembrarBase } from '../helpers/siembra.js';
import { testEnv } from '../setup.js';

describe('revocación inmediata', () => {
  it('deniega la siguiente solicitud de una identidad retirada', async () => {
    await sembrarBase(testEnv);
    await assertSucceeds(updateDoc(doc(propietaria(testEnv), 'usuarios/propietaria'), { uids_autorizados: [] }));
    await assertFails(getDoc(doc(autorizada(testEnv), 'usuarios/propietaria')));
  });
});
