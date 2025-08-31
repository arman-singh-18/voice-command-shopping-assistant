// Test script for deployment verification
// Run with: node test-deployment.js

const API_BASE = process.env.API_BASE || "https://voice-command-shopping-assistant-2.onrender.com";

async function testEndpoint(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    console.log(`Testing ${method} ${endpoint}...`);
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response:', JSON.stringify(data, null, 2));
      return true;
    } else {
      const errorText = await response.text();
      console.error('Error:', errorText);
      return false;
    }
  } catch (error) {
    console.error('Request failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Testing Voice Command Shopping Assistant Deployment');
  console.log('API Base:', API_BASE);
  console.log('=' .repeat(50));
  
  // Test 1: Health check
  console.log('\n1. Testing health endpoint...');
  const healthOk = await testEndpoint('/api/health');
  
  // Test 2: Root endpoint
  console.log('\n2. Testing root endpoint...');
  const rootOk = await testEndpoint('/');
  
  // Test 3: Shopping list endpoint
  console.log('\n3. Testing shopping list endpoint...');
  const listOk = await testEndpoint('/api/list');
  
  // Test 4: Dialogflow endpoint
  console.log('\n4. Testing dialogflow endpoint...');
  const dialogflowOk = await testEndpoint('/api/dialogflow/query', 'POST', {
    message: 'add milk',
    sessionId: 'test-session'
  });
  
  // Test 5: Non-existent endpoint (should return 404)
  console.log('\n5. Testing non-existent endpoint...');
  const notFoundOk = await testEndpoint('/api/nonexistent');
  
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Test Results:');
  console.log(`Health Check: ${healthOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Root Endpoint: ${rootOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Shopping List: ${listOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Dialogflow: ${dialogflowOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`404 Handler: ${!notFoundOk ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = healthOk && rootOk && listOk && dialogflowOk && !notFoundOk;
  console.log(`\nOverall: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (!allPassed) {
    console.log('\n🔧 Troubleshooting Tips:');
    console.log('1. Check if the server is running on Render');
    console.log('2. Verify environment variables are set correctly');
    console.log('3. Check Render logs for any startup errors');
    console.log('4. Ensure Firebase and Dialogflow credentials are valid');
  }
}

// Run tests
runTests().catch(console.error);
