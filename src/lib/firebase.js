import { initializeApp, getApps } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Some networks (school/venue wifi, firewalls, some browser privacy
// extensions) don't fail Firestore's default streaming connection fast
// enough to trigger auto-detection - they just let it hang. Forcing plain
// HTTP long polling skips that detection step entirely.
export const db = initializeFirestore(app, { experimentalForceLongPolling: true });
export default app;
