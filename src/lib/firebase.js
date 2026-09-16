import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore/lite';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// The app only ever does one-off reads/writes (no realtime listeners), so
// the "lite" build is used: it talks to Firestore over plain REST/fetch
// calls instead of a persistent WebChannel connection. Some networks
// (school/venue wifi, corporate proxies) can't keep that channel's session
// alive and force it into an endless reconnect loop; plain REST requests
// sidestep that entirely.
export const db = getFirestore(app);
export default app;
