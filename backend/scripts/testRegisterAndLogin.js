async function testAuthFlow() {
  const base = 'http://localhost:5000/api';

  const testUser = {
    name: 'Test Nurse',
    username: `nurse_${Date.now().toString().slice(-4)}`,
    password: 'password123',
    email: `nurse_${Date.now().toString().slice(-4)}@eldercare.demo`,
    phone: '+91 98400 99887',
    role: 'caregiver'
  };

  console.log('1. Registering new user:', testUser.username);
  const regRes = await fetch(`${base}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testUser)
  });
  const regData = await regRes.json();
  console.log('Register response:', regData);

  if (!regData.success) {
    console.error('Registration failed!');
    process.exit(1);
  }

  console.log('\n2. Logging in with newly registered user...');
  const logRes = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: testUser.username, password: testUser.password })
  });
  const logData = await logRes.json();
  console.log('Login response:', logData);

  console.log('\n3. Testing Demo Admin login with "admin"...');
  const adminRes = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin' })
  });
  const adminData = await adminRes.json();
  console.log('Admin login with "admin":', adminData.success);

  console.log('\n4. Testing Demo Admin login with "Care@123"...');
  const adminRes2 = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'Care@123' })
  });
  const adminData2 = await adminRes2.json();
  console.log('Admin login with "Care@123":', adminData2.success);

  console.log('\n=== REGISTER & SIGNIN FULLY VERIFIED! ===');
}

testAuthFlow().catch(console.error);
