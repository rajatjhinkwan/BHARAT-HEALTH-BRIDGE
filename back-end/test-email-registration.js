/**
 * BHARAT HEALTH BRIDGE — Email-Based Patient Registration & EMR Profile Verification Script
 * 
 * This is a highly logical, runnable integration test script. It demonstrates and validates:
 * 1. Registering a patient user using ONLY an email address (with name & password, making phone number optional).
 * 2. Automatic backend creation of a clinical Patient EMR document (linked via patientProfileId).
 * 3. Logically authenticating/logging in using the newly registered email address.
 * 
 * Running this script:
 * Make sure the backend server is running (usually on port 4000), then execute:
 * $ node test-email-registration.js
 */

import http from 'http';

const BACKEND_URL = 'http://localhost:4000/api';

// Generate a random email to ensure uniqueness on every execution
const testEmail = `patient.bridge.${Math.floor(1000 + Math.random() * 9000)}@example.com`;
const testPassword = 'security_pin_123456';
const testName = 'Aarav Singhal';

console.log('\x1b[36m%s\x1b[0m', '================================================================');
console.log('\x1b[36m%s\x1b[0m', '   BHARAT HEALTH BRIDGE — EMAIL REGISTRATION VERIFIER ENGINE    ');
console.log('\x1b[36m%s\x1b[0m', '================================================================');
console.log(`[INFO] Generated Unique Test Email: ${testEmail}\n`);

// Helper to make local http post request without external dependencies
function postRequest(urlPath, payload) {
  return new Promise((resolve, reject) => {
    const dataString = JSON.stringify(payload);
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: `/api${urlPath}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': dataString.length,
      },
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseBody);
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (_) {
          resolve({ statusCode: res.statusCode, raw: responseBody });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(dataString);
    req.end();
  });
}

async function runVerification() {
  try {
    // -----------------------------------------------------------------
    // STEP 1: PATIENT REGISTRATION VIA EMAIL ADDRESS
    // -----------------------------------------------------------------
    console.log('\x1b[33m%s\x1b[0m', '[STEP 1] Submitting email-only registration payload...');
    const registrationPayload = {
      name: testName,
      email: testEmail,
      password: testPassword,
      role: 'patient' // Explicitly registering with patient role
    };

    console.log('Request Payload:', JSON.stringify(registrationPayload, null, 2));
    
    const regResult = await postRequest('/users/register', registrationPayload);
    
    if (regResult.statusCode === 201) {
      console.log('\x1b[32m%s\x1b[0m', `✓ Registration Successful (HTTP ${regResult.statusCode})!`);
      console.log('Response Profile Data:', JSON.stringify(regResult.data, null, 2));
      console.log('\x1b[35m%s\x1b[0m', `  ↳ Generated Patient EMR Profile ID (patientProfileId): ${regResult.data.user.patientProfileId || 'Pending login check'}\n`);
    } else {
      console.log('\x1b[31m%s\x1b[0m', `✗ Registration Failed! (HTTP ${regResult.statusCode})`);
      console.log('Error details:', regResult.data || regResult.raw);
      return;
    }

    // -----------------------------------------------------------------
    // STEP 2: LOGGING IN USING THE REGISTERED EMAIL ADDRESS
    // -----------------------------------------------------------------
    console.log('\x1b[33m%s\x1b[0m', '[STEP 2] Submitting login request with registered email credentials...');
    const loginPayload = {
      email: testEmail,
      password: testPassword
    };

    console.log('Request Payload:', JSON.stringify(loginPayload, null, 2));

    const loginResult = await postRequest('/users/login', loginPayload);

    if (loginResult.statusCode === 200) {
      console.log('\x1b[32m%s\x1b[0m', `✓ Login Successful (HTTP ${loginResult.statusCode})!`);
      console.log('Response Auth Token & Dashboard Profile:', JSON.stringify(loginResult.data, null, 2));
      
      const pProfileId = loginResult.data.user.patientProfileId;
      if (pProfileId) {
        console.log('\x1b[32m%s\x1b[0m', `\n[SUCCESS] Unified EMR Sync is ACTIVE!`);
        console.log(`Patient Name: ${loginResult.data.user.name}`);
        console.log(`Associated Email: ${loginResult.data.user.email}`);
        console.log(`EMR Profile ID: ${pProfileId}`);
        console.log(`Role: ${loginResult.data.user.role}`);
      } else {
        console.log('\x1b[31m%s\x1b[0m', `\n[WARNING] User authenticated but EMR Profile linkage is missing!`);
      }
    } else {
      console.log('\x1b[31m%s\x1b[0m', `✗ Login Failed! (HTTP ${loginResult.statusCode})`);
      console.log('Error details:', loginResult.data || loginResult.raw);
    }

  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '\n[CRITICAL ERROR] Failed to connect to local Bharat Health Bridge server!');
    console.error('Make sure the node server is running on http://localhost:4000. Error message:', error.message);
  }
  
  console.log('\x1b[36m%s\x1b[0m', '\n================================================================');
}

runVerification();
