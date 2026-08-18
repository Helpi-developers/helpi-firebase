import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { describe, it } from 'vitest';
import { ajena, autorizada, propietaria, sinAutenticar } from '../helpers/identidades.js';
import { sembrarBase } from '../helpers/siembra.js';
import { testEnv } from '../setup.js';

describe('colecciones globales', () => {
  it('permite lectura a cualquier autenticado, no a la identidad anónima', async () => {
    await sembrarBase(testEnv);
    const paths = ['vocabularios/v1/senas/nueva', 'modelos/v1', 'config/modelo_activo', 'pictogramas/pictograma-1'];
    for (const path of paths) {
      await assertSucceeds(getDoc(doc(propietaria(testEnv), path)));
      await assertSucceeds(getDoc(doc(autorizada(testEnv), path)));
      await assertSucceeds(getDoc(doc(ajena(testEnv), path)));
      await assertFails(getDoc(doc(sinAutenticar(testEnv), path)));
      await assertFails(setDoc(doc(propietaria(testEnv), path), { intento: true }));
    }
  });
});

