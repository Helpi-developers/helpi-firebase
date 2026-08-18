import { Timestamp } from 'firebase/firestore';

export const base = {
  perfiles: {
    propietaria: {
      uids_autorizados: ['autorizada'],
      nombre: 'Perfil de prueba',
      modo: 'REGISTRADO',
    },
    segunda: {
      uids_autorizados: ['propietaria'],
      nombre: 'Segundo perfil',
      modo: 'REGISTRADO',
    },
  },
  rutina: {
    nombre: 'Rutina de prueba',
    actividades: [{ pasos: [{ pictograma_id: 'pictograma-1', etiqueta: 'Lavarse', ubicacion: 0 }] }],
    pictogramas_referenciados: ['pictograma-1'],
    actualizada_por: 'propietaria',
    fecha_actualizacion: Timestamp.fromDate(new Date('2026-01-01T00:00:00.000Z')),
  },
  dispositivo: {
    tipo: 'TUTOR',
    token_fcm: 'token-de-prueba',
    estado: 'ACTIVO',
  },
  pictograma: { etiqueta: 'Lavarse las manos', ubicacion: 0 },
  resumen: {
    fecha: '2026-01-01',
    rutinas: [{ id_rutina: 'rutina-1', pasos_completados: 1, pasos_totales: 1 }],
    fecha_actualizacion: Timestamp.fromDate(new Date('2026-01-01T00:00:00.000Z')),
  },
  senas: {
    nueva: {
      fecha_actualizacion: Timestamp.fromDate(new Date('2026-01-02T00:00:00.000Z')),
      retirada: false,
    },
    retirada: {
      fecha_actualizacion: Timestamp.fromDate(new Date('2026-01-03T00:00:00.000Z')),
      retirada: true,
    },
  },
};

