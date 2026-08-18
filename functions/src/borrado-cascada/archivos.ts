import { storage } from '../comun/firebase.js';

export async function borrarArchivosDeCuenta(uid: string): Promise<void> {
  await storage.bucket().deleteFiles({ prefix: `usuarios/${uid}/` });
}

