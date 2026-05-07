import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  OAuthProvider, 
  signInWithPopup, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { initializeFirestore, collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, deleteDoc, doc, getDoc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);

// Use the database ID from config if present
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId || '(default)');
export const auth = getAuth(app);

// Enable persistence
setPersistence(auth, browserLocalPersistence).catch(console.error);

// Admin check logic
export const checkIsAdmin = async (email: string | null): Promise<boolean> => {
  if (!email) return false;
  
  const normalizedEmail = email.toLowerCase().trim();
  console.log("Checking admin status for:", normalizedEmail);
  
  // Bootstrap admins
  if (normalizedEmail === "gloria@cademmy.com" || normalizedEmail === "gloriaalbamx@gmail.com") {
    console.log("Admin status: TRUE (Bootstrap)");
    return true;
  }
  
  try {
    const adminDoc = await getDoc(doc(db, 'admin_emails', normalizedEmail));
    const isRegisteredAdmin = adminDoc.exists();
    console.log("Admin status:", isRegisteredAdmin ? "TRUE (Registered)" : "FALSE");
    return isRegisteredAdmin;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
};
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const microsoftProvider = new OAuthProvider('microsoft.com');
microsoftProvider.addScope('openid');
microsoftProvider.addScope('profile');
microsoftProvider.addScope('email');
microsoftProvider.setCustomParameters({ prompt: 'select_account' });

export { signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification };

// Validate Connection to Firestore
async function testConnection() {
  // Wait a bit to ensure initialization is fully complete
  await new Promise(resolve => setTimeout(resolve, 2000));
  try {
    // Attempt to fetch a non-existent document to test connectivity
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firestore connection test successful.");
  } catch (error) {
    console.error("Firestore connection test failed:", error);
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is offline. This often means the project ID is incorrect or Firestore hasn't been initialized in the console.");
    }
  }
}
testConnection();

// Types for error handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
