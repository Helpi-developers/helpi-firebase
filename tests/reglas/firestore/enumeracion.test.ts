import { assertFails } from '@firebase/rules-unit-testing';
import { collection, getDocs } from 'firebase/firestore';
import { describe, it } from 'vitest';
import { ajena, autorizada, propietaria, sinAutenticar } from '../helpers/identidades.js';
import { sembrarBase } from '../helpers/siembra.js';
import { testEnv } from '../setup.js';

describe('enumeración de perfiles', () => {
  it('deniega consultas de perfiles a las cuatro clases', async () => {
    await sembrarBase(testEnv);
    await assertFails(getDocs(collection(propietaria(testEnv), 'usuarios')));
    await assertFails(getDocs(collection(autorizada(testEnv), 'usuarios')));
    await assertFails(getDocs(collection(ajena(testEnv), 'usuarios')));
    await assertFails(getDocs(collection(sinAutenticar(testEnv), 'usuarios')));
  });
});

