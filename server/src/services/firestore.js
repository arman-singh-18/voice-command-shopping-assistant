import admin from "firebase-admin";
import dotenv from "dotenv";
import { createRequire } from "module";

dotenv.config();
const require = createRequire(import.meta.url);

// Load service account JSON directly
const serviceAccount = require("../../firebase-service-account.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

const db = admin.firestore();
const shoppingListRef = db.collection("shopping_list");

// Add item
export const addItem = async (item) => {
  const docRef = await shoppingListRef.add(item);
  return { id: docRef.id, ...item };
};

export const getItems = async () => {
  const snapshot = await shoppingListRef.get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const deleteItem = async (id) => {
  await shoppingListRef.doc(id).delete();
  return { success: true };
};

