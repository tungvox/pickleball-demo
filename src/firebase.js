import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, RecaptchaVerifier, EmailAuthProvider } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, enableNetwork, disableNetwork } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD6BAHk0FYFdCdT-K1XnFW8CFRUk1RV4To",
  authDomain: "friendly-sport-6be4b.firebaseapp.com",
  projectId: "friendly-sport-6be4b",
  storageBucket: "friendly-sport-6be4b.appspot.com",
  messagingSenderId: "196502990767",
  appId: "1:196502990767:web:037e72760304be8e64095a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize reCAPTCHA verifier for phone authentication
export const initializeRecaptcha = (containerId) => {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      'size': 'normal',
      'callback': (response) => {
        console.log('reCAPTCHA solved');
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expired');
      }
    });
  }
  return window.recaptchaVerifier;
};

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.log('The current browser does not support persistence.');
    }
  });

// Network status functions
export const enableFirebaseNetwork = () => enableNetwork(db);
export const disableFirebaseNetwork = () => disableNetwork(db);

export default app;
