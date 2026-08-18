import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, updateDoc } from 'firebase/firestore';
import { describe, it } from 'vitest';
import { ajena, autorizada, propietaria, sinAutenticar } from '../helpers/identidades.js';
import { sembrarBase } from '../helpers/siembra.js';
import { testEnv } from '../setup.js';

describe('uids_autorizados', () => {
  it('permite a la propietaria quitar, pero nunca agregar, identidades', async () => {
    await sembrarBase(testEnv);
    const perfilPropio = doc(propietaria(testEnv), 'usuarios/propietaria');
    await assertSucceeds(updateDoc(perfilPropio, { uids_autorizados: [] }));
    await assertFails(updateDoc(perfilPropio, { uids_autorizados: ['autorizada', 'ajena'] }));
    await assertFails(updateDoc(doc(autorizada(testEnv), 'usuarios/propietaria'), { uids_autorizados: [] }));
    await assertFails(updateDoc(doc(ajena(testEnv), 'usuarios/propietaria'), { uids_autorizados: [] }));
    await assertFails(updateDoc(doc(sinAutenticar(testEnv), 'usuarios/propietaria'), { uids_autorizados: [] }));
  });
});

