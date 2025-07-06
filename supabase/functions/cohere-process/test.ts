// Test script for the cohere-process edge function
// Run this with: deno run --allow-net test.ts

const FUNCTION_URL = 'http://localhost:54321/functions/v1/cohere-process';

interface TestCase {
  name: string;
  payload: any;
  expectedStatus: number;
}

const testCases: TestCase[] = [
  {
    name: 'Valid request with all parameters',
    payload: {
      query: 'What are the symptoms of a common cold?',
      max_tokens: 150,
      temperature: 0.5
    },
    expectedStatus: 200
  },
  {
    name: 'Valid request with minimal parameters',
    payload: {
      query: 'How to treat a headache?'
    },
    expectedStatus: 200
  },
  {
    name: 'Missing query parameter',
    payload: {
      max_tokens: 100,
      temperature: 0.7
    },
    expectedStatus: 400
  },
  {
    name: 'Empty query string',
    payload: {
      query: '',
      max_tokens: 100
    },
    expectedStatus: 400
  },
  {
    name: 'Invalid max_tokens (too high)',
    payload: {
      query: 'Test query',
      max_tokens: 5000
    },
    expectedStatus: 400
  },
  {
    name: 'Invalid temperature (negative)',
    payload: {
      query: 'Test query',
      temperature: -0.5
    },
    expectedStatus: 400
  },
  {
    name: 'Invalid JSON',
    payload: 'invalid json',
    expectedStatus: 400
  }
];

async function runTest(testCase: TestCase) {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  
  try {
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: typeof testCase.payload === 'string' 
        ? testCase.payload 
        : JSON.stringify(testCase.payload)
    });

    const responseData = await response.json();
    
    if (response.status === testCase.expectedStatus) {
      console.log(`✅ PASS - Status: ${response.status}`);
      if (responseData.status === 'success') {
        console.log(`   Response length: ${responseData.data.text.length} characters`);
      } else {
        console.log(`   Error: ${responseData.error}`);
      }
    } else {
      console.log(`❌ FAIL - Expected: ${testCase.expectedStatus}, Got: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(responseData, null, 2)}`);
    }
  } catch (error) {
    console.log(`❌ FAIL - Network error: ${error.message}`);
  }
}

async function testCORS() {
  console.log('\n🧪 Testing: CORS preflight request');
  
  try {
    const response = await fetch(FUNCTION_URL, {
      method: 'OPTIONS',
    });

    if (response.status === 200) {
      const corsOrigin = response.headers.get('Access-Control-Allow-Origin');
      const corsMethods = response.headers.get('Access-Control-Allow-Methods');
      
      console.log(`✅ PASS - CORS preflight successful`);
      console.log(`   Allow-Origin: ${corsOrigin}`);
      console.log(`   Allow-Methods: ${corsMethods}`);
    } else {
      console.log(`❌ FAIL - CORS preflight failed with status: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ FAIL - CORS test error: ${error.message}`);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Cohere Edge Function Tests');
  console.log('=====================================');
  
  // Test CORS first
  await testCORS();
  
  // Run all test cases
  for (const testCase of testCases) {
    await runTest(testCase);
  }
  
  console.log('\n🏁 All tests completed!');
  console.log('\nTo run these tests:');
  console.log('1. Start Supabase locally: supabase start');
  console.log('2. Deploy the function: supabase functions deploy cohere-process');
  console.log('3. Run this test: deno run --allow-net test.ts');
}

// Run tests if this file is executed directly
if (import.meta.main) {
  runAllTests();
}