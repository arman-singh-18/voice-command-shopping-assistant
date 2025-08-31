// Test script to check environment variables
// This will help us debug the Dialogflow issue

console.log("🔍 Environment Variables Check");
console.log("=" .repeat(40));

const envVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY', 
  'FIREBASE_CLIENT_EMAIL',
  'DIALOGFLOW_PROJECT_ID',
  'DEFAULT_LANGUAGE_CODE',
  'NODE_ENV',
  'PORT'
];

envVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Don't log the actual private key for security
    if (varName === 'FIREBASE_PRIVATE_KEY') {
      console.log(`${varName}: ${value.substring(0, 20)}... (truncated)`);
    } else {
      console.log(`${varName}: ${value}`);
    }
  } else {
    console.log(`${varName}: ❌ NOT SET`);
  }
});

console.log("\n" + "=" .repeat(40));
console.log("✅ Environment check complete");
