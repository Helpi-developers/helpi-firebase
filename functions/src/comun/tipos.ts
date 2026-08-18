import type { Timestamp } from 'firebase-admin/firestore';

export interface Tutor {
  uid: string;
  nombre?: string;
  parentesco?: string;
  telefono?: string;
  email?: string;
  estado?: 'ACTIVO' | 'INACTIVO';
}

export interface Perfil {
  uids_autorizados: string[];
  tutores?: Tutor[];
  [campo: string]: unknown;
}

export interface Dispositivo {
  tipo: 'USUARIO' | 'TUTOR';
  token_fcm: string;
  estado: 'ACTIVO' | 'INACTIVO';
}

export interface Paso {
  pictograma_id?: string;
  id_pictograma?: string;
  etiqueta?: string;
  ubicacion?: string | number;
  [campo: string]: unknown;
}

export interface Actividad {
  pasos?: Paso[];
  [campo: string]: unknown;
}

export interface Rutina {
  actividades?: Actividad[];
  pictogramas_referenciados?: string[];
  actualizada_por?: string;
  fecha_actualizacion?: Timestamp;
  deleted_at?: Timestamp | null;
  [campo: string]: unknown;
}

export interface Resumen {
  fecha: string;
  rutinas: Array<Record<string, unknown>>;
  fecha_actualizacion: Timestamp;
}

export interface EliminacionPendiente {
  vence_en: Timestamp;
  solicitada_en: Timestamp;
}

