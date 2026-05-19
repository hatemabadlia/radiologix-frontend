// src/hooks/useAuth.jsx
import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  enableIndexedDbPersistence,
} from "firebase/firestore";
import { auth, googleProvider, db } from "../firebase/config";

// ── Enable offline persistence so Firestore works even when the
//    popup briefly takes focus away from the tab (fixes "client is offline") ──


const AuthContext = createContext({
  user: null,
  loading: true,
});

// ── Helper: create user doc if it doesn't exist yet ──────────
async function ensureUserDoc(firebaseUser) {
  const ref = doc(db, "users", firebaseUser.uid);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
  uid: firebaseUser.uid,
  email: firebaseUser.email,
  displayName: firebaseUser.displayName || "",
  photoURL: firebaseUser.photoURL || "",
  scanCount: 0,
  createdAt: serverTimestamp(),
}, { merge: true });

    }
  } catch (err) {
    // Offline — the write will sync automatically when back online
    console.warn("User doc write deferred (offline):", err.code);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle redirect result (fallback for COOP-blocked popups)
    getRedirectResult(auth).catch(() => {});

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
ensureUserDoc(firebaseUser); // async, don't block UI
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const register = async (email, password, name) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    // Force refresh so displayName is visible immediately
    await cred.user.reload();
    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      email,
      displayName: name,
      scanCount: 0,
      createdAt: serverTimestamp(),
    });
    return cred;
  };

  const loginWithGoogle = async () => {
    try {
      // Try popup first
      const cred = await signInWithPopup(auth, googleProvider);
      await ensureUserDoc(cred.user);
      return cred;
    } catch (err) {
      // If COOP policy blocks the popup, fall back to redirect
      if (
        err.code === "auth/popup-blocked" ||
        err.code === "auth/popup-closed-by-user" ||
        err.message?.includes("Cross-Origin-Opener-Policy")
      ) {
        await signInWithRedirect(auth, googleProvider);
        // Page will reload; getRedirectResult() in useEffect handles completion
        return;
      }
      throw err;
    }
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, loginWithGoogle, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
