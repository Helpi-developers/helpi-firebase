import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { getStorage } from 'firebase-admin/storage';

const app = getApps()[0] ?? initializeApp();

export const db = getFirestore(app);
export const messaging = getMessaging(app);
export const storage = getStorage(app);

