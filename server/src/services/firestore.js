// server/src/firestore.js
import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
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
