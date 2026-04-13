import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { collection, doc, getDocs, limit, query, setDoc, where } from "firebase/firestore";
import { auth, db, firebaseEnabled } from "./firebase";

const USERS_COLLECTION = "users";

const mapAuthError = (error) => {
  switch (error?.code) {
    case "auth/invalid-email":
      return "Invalid email address.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Wrong password. Please try again.";
    case "auth/user-not-found":
      return "User not found.";
    case "auth/too-many-requests":
      return "Too many login attempts. Please try again later.";
    default:
      return error?.message || "Authentication failed.";
  }
};

export const getUserRoleByEmail = async (email) => {
  if (!firebaseEnabled || !email) {
    return "staff";
  }

  const usersQuery = query(collection(db, USERS_COLLECTION), where("email", "==", email), limit(1));
  const snapshot = await getDocs(usersQuery);

  if (snapshot.empty) {
    return "staff";
  }

  return snapshot.docs[0].data().role ?? "staff";
};

export const subscribeToAuthChanges = (callback) => {
  if (!firebaseEnabled) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, callback);
};

export const loginUser = async (email, password, rememberMe = true) => {
  if (!firebaseEnabled) {
    throw new Error("Firebase is not configured. Login is disabled.");
  }

  try {
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const role = await getUserRoleByEmail(credential.user.email);

    return { user: credential.user, role };
  } catch (error) {
    throw new Error(mapAuthError(error));
  }
};

export const registerUser = async ({ name, email, password, role = "staff" }) => {
  if (!firebaseEnabled) {
    throw new Error("Firebase is not configured. Register is disabled.");
  }

  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });
    await setDoc(doc(collection(db, USERS_COLLECTION), credential.user.uid), {
      email,
      name,
      role,
    });

    return { user: credential.user, role };
  } catch (error) {
    throw new Error(mapAuthError(error));
  }
};

export const logoutUser = async () => {
  if (!firebaseEnabled) {
    return;
  }

  await signOut(auth);
};
