import admin from 'firebase-admin';
import { env } from './env.js';

function normalizePrivateKey(value) {
  if (!value) {
    return '';
  }

  let privateKey = String(value).trim();

  if (
    (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
    (privateKey.startsWith("'") && privateKey.endsWith("'"))
  ) {
    privateKey = privateKey.slice(1, -1);
  }

  return privateKey
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
}

function buildServiceAccount() {
  if (env.firebaseServiceAccount) {
    const serviceAccount = { ...env.firebaseServiceAccount };

    if (serviceAccount.private_key) {
      serviceAccount.private_key = normalizePrivateKey(serviceAccount.private_key);
    }

    return serviceAccount;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  if (projectId && clientEmail && privateKey) {
    return {
      project_id: projectId,
      client_email: clientEmail,
      private_key: privateKey,
    };
  }

  return null;
}

function initAdminApp() {
  if (admin.apps.length) {
    return admin.app();
  }

  const serviceAccount = buildServiceAccount();

  if (serviceAccount) {
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id || serviceAccount.projectId,
    });
  }

  return admin.initializeApp();
}

export const adminApp = initAdminApp();
export const adminDb = admin.firestore(adminApp);
export const adminAuth = admin.auth(adminApp);
export const fieldValue = admin.firestore.FieldValue;
export const timestamp = admin.firestore.Timestamp;

