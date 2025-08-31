// Simple Firebase test using the JSON file
import admin from "firebase-admin";
import fs from "fs";

console.log("🔍 Simple Firebase Project Verification");
console.log("=" .repeat(50));

try {
  // Read the service account file
  const serviceAccount = JSON.parse(fs.readFileSync('./firebase-service-account.json', 'utf8'));
  
  console.log("📋 Service Account Info:");
  console.log("Project ID:", serviceAccount.project_id);
  console.log("Client Email:", serviceAccount.client_email);
  console.log("Private Key ID:", serviceAccount.private_key_id);
  
  // Initialize Firebase Admin
  console.log("\n🔧 Initializing Firebase Admin...");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("✅ Firebase Admin initialized successfully");
  
  // Test Firestore access
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
  
  console.log("\n🎉 All tests passed! Your Firebase configuration is correct.");
  console.log("Project ID 'voice-command-470407' is working properly.");
  
} catch (error) {
  console.error("❌ Test failed:", error.message);
  
  if (error.message.includes("project")) {
    console.log("\n💡 This might be a project ID issue. Check:");
    console.log("1. Firestore is enabled in project 'voice-command-470407'");
    console.log("2. Service account has Firestore permissions");
  }
  
  if (error.message.includes("permission")) {
    console.log("\n💡 This might be a permissions issue. Check:");
    console.log("1. Service account has 'Firestore User' role");
    console.log("2. Firestore rules allow read/write access");
  }
  
  if (error.message.includes("ENOENT")) {
    console.log("\n💡 Service account file not found. Make sure firebase-service-account.json exists in the server directory.");
  }
}
