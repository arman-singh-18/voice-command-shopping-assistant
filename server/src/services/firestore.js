// server/src/firestore.js
import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

// Check if Firebase credentials are available
const hasFirebaseCredentials = process.env.FIREBASE_PROJECT_ID && 
                              process.env.FIREBASE_PRIVATE_KEY && 
                              process.env.FIREBASE_CLIENT_EMAIL;

console.log("🔥 Firebase Configuration Check:");
console.log("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID || "NOT SET");
console.log("FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL || "NOT SET");
console.log("FIREBASE_PRIVATE_KEY:", process.env.FIREBASE_PRIVATE_KEY ? "SET" : "NOT SET");
console.log("Has Firebase credentials:", hasFirebaseCredentials);

if (!admin.apps.length) {
  if (hasFirebaseCredentials) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
      console.log("✅ Firebase Admin initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize Firebase Admin:", error);
      // Fallback to in-memory storage
      console.warn("Using in-memory storage as fallback.");
      admin.initializeApp({
        projectId: 'local-development'
      });
    }
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

// Test Firestore connection
async function testFirestoreConnection() {
  try {
    console.log("🔍 Testing Firestore connection...");
    const testDoc = await shoppingListRef.limit(1).get();
    console.log("✅ Firestore connection successful");
    return true;
  } catch (error) {
    console.error("❌ Firestore connection failed:", error.message);
    return false;
  }
}

// In-memory fallback storage
let inMemoryStorage = [];

// Add item
export const addItem = async (item) => {
  try {
    if (hasFirebaseCredentials) {
      const docRef = await shoppingListRef.add(item);
      console.log("✅ Item added to Firestore:", docRef.id);
      return { id: docRef.id, ...item };
    } else {
      // Fallback to in-memory storage
      const newItem = { id: Date.now().toString(), ...item };
      inMemoryStorage.push(newItem);
      console.log("📝 Item added to in-memory storage:", newItem.id);
      return newItem;
    }
  } catch (error) {
    console.error("Error adding item:", error);
    // Fallback to in-memory storage if Firebase fails
    const newItem = { id: Date.now().toString(), ...item };
    inMemoryStorage.push(newItem);
    console.log("📝 Item added to in-memory storage (fallback):", newItem.id);
    return newItem;
  }
};

export const getItems = async () => {
  try {
    if (hasFirebaseCredentials) {
      const snapshot = await shoppingListRef.get();
      const items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      console.log("✅ Retrieved", items.length, "items from Firestore");
      return items;
    } else {
      // Fallback to in-memory storage
      console.log("📝 Retrieved", inMemoryStorage.length, "items from in-memory storage");
      return inMemoryStorage;
    }
  } catch (error) {
    console.error("Error getting items:", error);
    // Fallback to in-memory storage if Firebase fails
    console.log("📝 Retrieved", inMemoryStorage.length, "items from in-memory storage (fallback)");
    return inMemoryStorage;
  }
};

export const deleteItem = async (id) => {
  try {
    if (hasFirebaseCredentials) {
      await shoppingListRef.doc(id).delete();
      console.log("✅ Item deleted from Firestore:", id);
    } else {
      // Fallback to in-memory storage
      inMemoryStorage = inMemoryStorage.filter(item => item.id !== id);
      console.log("📝 Item deleted from in-memory storage:", id);
    }
    return { success: true };
  } catch (error) {
    console.error("Error deleting item:", error);
    // Fallback to in-memory storage if Firebase fails
    inMemoryStorage = inMemoryStorage.filter(item => item.id !== id);
    console.log("📝 Item deleted from in-memory storage (fallback):", id);
    return { success: true };
  }
};

// Test connection on startup
testFirestoreConnection();
