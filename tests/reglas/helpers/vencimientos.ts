import { Timestamp } from 'firebase/firestore';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';

export function instanteVencido(): Timestamp {
  return Timestamp.fromDate(new Date(Date.now() - 60_000));
}

export function instanteFuturo(): Timestamp {
  return Timestamp.fromDate(new Date(Date.now() + 60_000));
}

export async function sembrarPendiente(
  env: RulesTestEnvironment,
  uid: string,
  venceEn: Timestamp,
): Promise<void> {
  await env.withSecurityRulesDisabled(async (context) => {
    await context.firestore().doc(`eliminaciones_pendientes/${uid}`).set({
      vence_en: venceEn,
      solicitada_en: Timestamp.now(),
    });
  });
}

