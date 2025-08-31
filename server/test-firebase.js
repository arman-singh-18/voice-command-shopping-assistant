// Test script to verify Firebase configuration
// This will help identify the correct project ID and permissions

import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

console.log("🔍 Firebase Project Verification");
console.log("=" .repeat(50));

// Check environment variables
console.log("Environment Variables:");
console.log("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID || "❌ NOT SET");
console.log("FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL || "❌ NOT SET");
console.log("FIREBASE_PRIVATE_KEY:", process.env.FIREBASE_PRIVATE_KEY ? "✅ SET" : "❌ NOT SET");

if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
  console.log("\n❌ Missing required environment variables!");
  console.log("Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY");
  process.exit(1);
}

// Try to initialize Firebase Admin
try {
  console.log("\n🔧 Initializing Firebase Admin...");
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
  console.log("✅ Firebase Admin initialized successfully");
} catch (error) {
  console.error("❌ Failed to initialize Firebase Admin:", error.message);
  process.exit(1);
}

// Test Firestore access
async function testFirestore() {
  try {
    console.log("\n🔥 Testing Firestore access...");
    const db = admin.firestore();
    
    // Test basic read operation
    const testCollection = db.collection("test");
    await testCollection.limit(1).get();
    console.log("✅ Firestore read access successful");
    
    // Test write operation
    const testDoc = await testCollection.add({
      test: true,
      timestamp: new Date().toISOString()
    });
    console.log("✅ Firestore write access successful");
    
    // Clean up test document
    await testDoc.delete();
    console.log("✅ Firestore delete access successful");
    
    return true;
  } catch (error) {
    console.error("❌ Firestore access failed:", error.message);
    
    if (error.message.includes("project")) {
      console.log("\n💡 This might be a project ID issue. Common problems:");
      console.log("1. Wrong project ID - check your Firebase console");
      console.log("2. Firestore not enabled in this project");
      console.log("3. Service account doesn't have Firestore permissions");
    }
    
    if (error.message.includes("permission")) {
      console.log("\n💡 This might be a permissions issue. Check:");
      console.log("1. Service account has 'Firestore User' role");
      console.log("2. Firestore rules allow read/write access");
    }
    
    return false;
  }
}

// Test project information
async function testProjectInfo() {
  try {
    console.log("\n📋 Testing project information...");
    const projectId = await admin.app().options.projectId;
    console.log("✅ Project ID:", projectId);
    
    // Try to get project metadata
    const auth = admin.auth();
    const userRecord = await auth.getUserByEmail(process.env.FIREBASE_CLIENT_EMAIL);
    console.log("✅ Service account verified:", userRecord.email);
    
    return true;
  } catch (error) {
    console.error("❌ Project info test failed:", error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  const projectOk = await testProjectInfo();
  const firestoreOk = await testFirestore();
  
  console.log("\n" + "=" .repeat(50));
  console.log("📊 Test Results:");
  console.log("Project Info:", projectOk ? "✅ PASS" : "❌ FAIL");
  console.log("Firestore Access:", firestoreOk ? "✅ PASS" : "❌ FAIL");
  
  if (projectOk && firestoreOk) {
    console.log("\n🎉 All tests passed! Your Firebase configuration is correct.");
  } else {
    console.log("\n🔧 Some tests failed. Check the error messages above.");
  }
}

runTests().catch(console.error);
