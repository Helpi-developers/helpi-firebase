import type { RulesTestContext, RulesTestEnvironment } from '@firebase/rules-unit-testing';

export const UID = {
  propietaria: 'propietaria',
  autorizada: 'autorizada',
  ajena: 'ajena',
  segunda: 'segunda',
} as const;

export type ClaseSolicitante = 'propietaria' | 'autorizada' | 'ajena' | 'sin_autenticar';

export function contexto(
  env: RulesTestEnvironment,
  clase: ClaseSolicitante,
): RulesTestContext {
  if (clase === 'sin_autenticar') return env.unauthenticatedContext();
  return env.authenticatedContext(UID[clase]);
}

export function propietaria(env: RulesTestEnvironment) {
  return contexto(env, 'propietaria').firestore();
}

export function autorizada(env: RulesTestEnvironment) {
  return contexto(env, 'autorizada').firestore();
}

export function ajena(env: RulesTestEnvironment) {
  return contexto(env, 'ajena').firestore();
}

export function sinAutenticar(env: RulesTestEnvironment) {
  return contexto(env, 'sin_autenticar').firestore();
}

