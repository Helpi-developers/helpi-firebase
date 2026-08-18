import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { afterEach, describe, it } from 'vitest';
import { ajena, autorizada, propietaria, sinAutenticar } from '../helpers/identidades.js';
import { sembrarBase } from '../helpers/siembra.js';
import { testEnv } from '../setup.js';

describe('usuarios/{uid}', () => {
  afterEach(async () => testEnv.clearFirestore());

  it('permite leer a la propietaria y a la autorizada, y deniega al resto', async () => {
    await sembrarBase(testEnv);
    await assertSucceeds(getDoc(doc(propietaria(testEnv), 'usuarios/propietaria')));
    await assertSucceeds(getDoc(doc(autorizada(testEnv), 'usuarios/propietaria')));
    await assertFails(getDoc(doc(ajena(testEnv), 'usuarios/propietaria')));
    await assertFails(getDoc(doc(sinAutenticar(testEnv), 'usuarios/propietaria')));
  });

  it('permite campos generales a propietaria y autorizada', async () => {
    await sembrarBase(testEnv);
    await assertSucceeds(updateDoc(doc(propietaria(testEnv), 'usuarios/propietaria'), { nombre: 'Nuevo' }));
    await assertSucceeds(updateDoc(doc(autorizada(testEnv), 'usuarios/propietaria'), { modo: 'REGISTRADO' }));
    await assertFails(updateDoc(doc(ajena(testEnv), 'usuarios/propietaria'), { nombre: 'No' }));
    await assertFails(updateDoc(doc(sinAutenticar(testEnv), 'usuarios/propietaria'), { nombre: 'No' }));
  });
});
