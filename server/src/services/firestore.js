// server/src/firestore.js
import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

// Check if Firebase credentials are available
const hasFirebaseCredentials = process.env.FIREBASE_PROJECT_ID && 
                              process.env.FIREBASE_PRIVATE_KEY && 
                              process.env.FIREBASE_CLIENT_EMAIL;

if (!admin.apps.length) {
  if (hasFirebaseCredentials) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
  } else {
    console.warn("Firebase credentials not found. Using in-memory storage as fallback.");
    // Initialize with default config for local development
    admin.initializeApp({
      projectId: 'local-development'
    });
  }
}

const db = admin.firestore();
const shoppingListRef = db.collection("shopping_list");

// In-memory fallback storage
let inMemoryStorage = [];

// Add item
export const addItem = async (item) => {
  try {
    if (hasFirebaseCredentials) {
      const docRef = await shoppingListRef.add(item);
      return { id: docRef.id, ...item };
    } else {
      // Fallback to in-memory storage
      const newItem = { id: Date.now().toString(), ...item };
      inMemoryStorage.push(newItem);
      return newItem;
    }
  } catch (error) {
    console.error("Error adding item:", error);
    // Fallback to in-memory storage if Firebase fails
    const newItem = { id: Date.now().toString(), ...item };
    inMemoryStorage.push(newItem);
    return newItem;
  }
};

export const getItems = async () => {
  try {
    if (hasFirebaseCredentials) {
      const snapshot = await shoppingListRef.get();
      return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } else {
      // Fallback to in-memory storage
      return inMemoryStorage;
    }
  } catch (error) {
    console.error("Error getting items:", error);
    // Fallback to in-memory storage if Firebase fails
    return inMemoryStorage;
  }
};

export const deleteItem = async (id) => {
  try {
    if (hasFirebaseCredentials) {
      await shoppingListRef.doc(id).delete();
    } else {
      // Fallback to in-memory storage
      inMemoryStorage = inMemoryStorage.filter(item => item.id !== id);
    }
    return { success: true };
  } catch (error) {
    console.error("Error deleting item:", error);
    // Fallback to in-memory storage if Firebase fails
    inMemoryStorage = inMemoryStorage.filter(item => item.id !== id);
    return { success: true };
  }
};
