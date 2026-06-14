// Instead of relying on a local npm install which can hang, we use the official Firebase ESM CDNs
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js';
import { getFirestore, doc, setDoc, getDoc, updateDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js';

// IMPORTANT: Replace this placeholder config with your REAL Firebase config from the Firebase Console!
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

let app, auth, googleProvider, db;

try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY_HERE") {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    db = getFirestore(app);
  } else {
    console.warn("Firebase not configured. Please add your credentials to src/firebase.js.");
  }
} catch (error) {
  console.error("Firebase initialization failed.", error);
}

export { 
  auth, googleProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  db, doc, setDoc, getDoc, updateDoc, onSnapshot 
};
