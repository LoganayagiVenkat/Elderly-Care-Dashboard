import dotenv from 'dotenv';
import { query } from '../config/db.js';
import * as authController from '../controllers/auth/authController.js';
import jwt from 'jsonwebtoken';

dotenv.config();

function mockReqRes(body = {}, headers = {}) {
  const req = { body, headers, query: {} };
  let statusCode = 200;
  let responseData = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    }
  };

  return { req, res, getStatus: () => statusCode, getData: () => responseData };
}

async function runTests() {
  console.log('====================================================');
  console.log('  TEST SUITE: Google OAuth 2.0 Integration Tests');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Test missing token/credential rejected
  {
    const { req, res, getStatus, getData } = mockReqRes({});
    await authController.googleLogin(req, res);
    assert(getStatus() === 401, '1. Missing Google credentials returns 401 Unauthorized');
    assert(getData()?.success === false, '1. Response indicates success: false');
  }

  // 2. Test invalid fake token rejected
  {
    const { req, res, getStatus, getData } = mockReqRes({ credential: 'fake.invalid.jwt_token_here' });
    await authController.googleLogin(req, res);
    assert(getStatus() === 401, '2. Invalid Google token returns 401 Unauthorized');
    assert(getData()?.message?.includes('Google authentication failed'), '2. Error message clearly states Google auth failed');
  }

  // 3. Test unregistered Google account on Login page returns UNREGISTERED_ACCOUNT (404)
  const testEmail = `test.oauth.${Date.now()}@eldercare.demo`;
  // Clean up if existed
  await query('DELETE FROM users WHERE email = ?', [testEmail]);

  {
    const { req, res, getStatus, getData } = mockReqRes({
      email: testEmail,
      name: 'Dr. Test Specialist',
      isRegistration: false
    });
    await authController.googleLogin(req, res);
    assert(getStatus() === 404, '3. Unregistered account on Login page returns 404 Not Found');
    assert(getData()?.code === 'UNREGISTERED_ACCOUNT', '3. Response includes code: UNREGISTERED_ACCOUNT');
    assert(getData()?.success === false, '3. Unregistered account does not log in');
  }

  // 4. Test self-assigned Admin registration is blocked (Requirement 7)
  {
    const { req, res, getStatus, getData } = mockReqRes({
      email: testEmail,
      name: 'Unprivileged User',
      role: 'admin',
      isRegistration: true
    });
    await authController.googleLogin(req, res);
    assert(getStatus() === 403, '4. Self-assigned Admin registration returns 403 Forbidden');
    assert(getData()?.message?.includes('Administrator accounts cannot be self-registered'), '4. Message explains Admin accounts cannot be self-registered');
  }

  // 5. Test safe registration with role 'doctor' (Requirement 7 & 8)
  let userToken = null;
  {
    const { req, res, getStatus, getData } = mockReqRes({
      email: testEmail,
      name: 'Dr. Test Specialist',
      role: 'doctor',
      isRegistration: true
    });
    await authController.googleLogin(req, res);
    const data = getData();
    assert(getStatus() === 201, '5. Safe Google registration returns 201 Created');
    assert(data?.success === true, '5. Registration succeeded');
    assert(data?.user?.role === 'doctor', '5. User registered with assigned role: doctor');
    assert(Boolean(data?.token), '5. Valid JWT token issued upon registration');
    userToken = data?.token;

    // Verify in MySQL
    const inDb = await query('SELECT * FROM users WHERE email = ?', [testEmail]);
    assert(inDb.length === 1, '5. User successfully created in MySQL database');
    assert(inDb[0].role === 'doctor', '5. Role correctly stored in MySQL as doctor');
  }

  // 6. Test login for now-registered Google user on Login page (Requirement 6 & 9)
  {
    const { req, res, getStatus, getData } = mockReqRes({
      email: testEmail,
      name: 'Dr. Test Specialist',
      isRegistration: false
    });
    await authController.googleLogin(req, res);
    const data = getData();
    assert(getStatus() === 200, '6. Subsequent login returns 200 OK');
    assert(data?.success === true, '6. Login succeeded');
    assert(data?.user?.role === 'doctor', '6. User preserves existing role (doctor) from MySQL');
    assert(Boolean(data?.token), '6. New signed JWT token issued on login');

    // Verify JWT payload
    const decoded = jwt.decode(data.token);
    assert(decoded.role === 'doctor', '6. JWT claims include role: doctor');
    assert(decoded.email === testEmail, '6. JWT claims include email');
  }

  // 7. Test existing Admin login via Google OAuth preserves Admin role
  {
    const { req, res, getStatus, getData } = mockReqRes({
      email: 'admin@eldercare.demo',
      name: 'Meera Krishnan',
      isRegistration: false
    });
    await authController.googleLogin(req, res);
    const data = getData();
    assert(getStatus() === 200, '7. Existing Admin login succeeds with 200 OK');
    assert(data?.user?.role === 'admin', '7. Preserves existing admin role from MySQL');
    assert(Boolean(data?.token), '7. Valid JWT token issued for admin');
  }

  // Clean up test user
  await query('DELETE FROM users WHERE email = ?', [testEmail]);

  console.log(`\n====================================================`);
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log(`====================================================\n`);

  process.exit(failed === 0 ? 0 : 1);
}

runTests().catch(err => {
  console.error('Test runner encountered an error:', err);
  process.exit(1);
});
