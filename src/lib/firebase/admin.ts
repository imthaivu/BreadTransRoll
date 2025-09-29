import { App, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { getFirestore as getAdminDb } from "firebase-admin/firestore";
import { getStorage as getAdminStorage } from "firebase-admin/storage";

let adminApp: App | null = null;

function getServiceAccount() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin environment variables");
  }
  return {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n"),
  };
}

export function getAdminApp(): App {
  if (!adminApp) {
    if (getApps().length === 0) {
      const { projectId, clientEmail, privateKey } = getServiceAccount();
      adminApp = initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } else {
      adminApp = getApps()[0]!;
    }
  }
  return adminApp;
}

export const adminAuth = () => getAdminAuth(getAdminApp());
export const adminDb = () => getAdminDb(getAdminApp());
export const adminStorage = () => getAdminStorage(getAdminApp());
