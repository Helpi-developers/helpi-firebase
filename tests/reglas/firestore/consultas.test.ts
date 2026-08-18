import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { collection, collectionGroup, getDocs, query, where } from 'firebase/firestore';
import { describe, it } from 'vitest';
import { ajena, autorizada, propietaria } from '../helpers/identidades.js';
import { sembrarBase } from '../helpers/siembra.js';
import { testEnv } from '../setup.js';

describe('consultas declaradas', () => {
  it('resuelve la diferencia del catálogo con el índice automático de campo único', async () => {
    await sembrarBase(testEnv);
    const consulta = query(collection(propietaria(testEnv), 'vocabularios/v1/senas'), where('fecha_actualizacion', '>', new Date('2026-01-01')));
    await assertSucceeds(getDocs(consulta));
  });

  it('deniega consultar perfiles aunque la pertenencia sea un campo indexable', async () => {
    await sembrarBase(testEnv);
    const consulta = query(collection(propietaria(testEnv), 'usuarios'), where('uids_autorizados', 'array-contains', 'propietaria'));
    await assertFails(getDocs(consulta));
  });

  it('resuelve la consulta de grupo de colección de rutinas', async () => {
    await sembrarBase(testEnv);
    const consulta = query(collectionGroup(propietaria(testEnv), 'rutinas'), where('pictogramas_referenciados', 'array-contains', 'pictograma-1'));
    await assertSucceeds(getDocs(consulta));
    await assertFails(getDocs(query(collectionGroup(autorizada(testEnv), 'rutinas'), where('pictogramas_referenciados', 'array-contains', 'pictograma-1'))));
    await assertFails(getDocs(query(collectionGroup(ajena(testEnv), 'rutinas'), where('pictogramas_referenciados', 'array-contains', 'pictograma-1'))));
  });
});

