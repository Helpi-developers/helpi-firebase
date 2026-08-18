import { db } from '../comun/firebase.js';

export async function borrarSubarbol(uid: string): Promise<void> {
  await db.recursiveDelete(db.doc(`usuarios/${uid}`));
}

