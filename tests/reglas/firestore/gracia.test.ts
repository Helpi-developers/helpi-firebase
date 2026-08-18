import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc } from 'firebase/firestore';
import { describe, it } from 'vitest';
import { autorizada, propietaria } from '../helpers/identidades.js';
import { sembrarBase } from '../helpers/siembra.js';
import { instanteFuturo, instanteVencido, sembrarPendiente } from '../helpers/vencimientos.js';
import { testEnv } from '../setup.js';

describe('ventana de gracia', () => {
  it.each([['futuro', instanteFuturo], ['vencido', instanteVencido]])(
    'cierra el perfil mientras el vencimiento es %s', async (_estado, reloj) => {
      await sembrarBase(testEnv);
      await sembrarPendiente(testEnv, 'propietaria', reloj());
      await assertFails(getDoc(doc(propietaria(testEnv), 'usuarios/propietaria')));
      await assertFails(getDoc(doc(autorizada(testEnv), 'usuarios/propietaria')));
      await assertSucceeds(getDoc(doc(propietaria(testEnv), 'eliminaciones_pendientes/propietaria')));
      await assertFails(getDoc(doc(autorizada(testEnv), 'eliminaciones_pendientes/propietaria')));
      await assertFails(getDoc(doc(propietaria(testEnv), 'eliminaciones_pendientes/segunda')));
      await assertFails(deleteDoc(doc(propietaria(testEnv), 'eliminaciones_pendientes/propietaria')));
    },
  );
});
