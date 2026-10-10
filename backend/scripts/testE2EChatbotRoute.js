import http from 'http';

async function postChatbot(payload, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request({
      hostname: 'localhost',
      port: 5001,
      path: '/api/chatbot',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...headers,
      },
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({ raw: body, status: res.statusCode });
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('Testing End-to-End Chatbot Route on http://localhost:5001/api/chatbot ...\n');

  const testCases = [
    {
      name: 'Admin - Open-ended Medication adherence and remaining query',
      payload: {
        message: 'How many medications are remaining for Anitha today and what are they?',
        user: { role: 'admin', name: 'System Admin' },
        lang: 'en'
      }
    },
    {
      name: 'Admin - Tamil open-ended vitals inquiry',
      payload: {
        message: 'அனிதாவின் சமீபத்திய இரத்த அழுத்தம் மற்றும் உடல்நிலை எப்படி உள்ளது?',
        user: { role: 'admin', name: 'System Admin' },
        lang: 'ta'
      }
    },
    {
      name: 'Admin - Caregiver shifts and assignment',
      payload: {
        message: 'Which caregiver is on duty for Anitha and what is their working shift?',
        user: { role: 'admin', name: 'System Admin' },
        lang: 'en'
      }
    },
    {
      name: 'Admin - Specialist doctor referral explanation',
      payload: {
        message: 'Why was Anitha referred to a cardiologist and when is the visit?',
        user: { role: 'admin', name: 'System Admin' },
        lang: 'en'
      }
    },
    {
      name: 'Admin - General AI Tech question separation',
      payload: {
        message: 'Explain how neural networks learn in 2 simple sentences',
        user: { role: 'admin', name: 'System Admin' },
        lang: 'en'
      }
    },
    {
      name: 'Family RBAC - Rejection when accessing unauthorized resident',
      payload: {
        message: 'What is Lakshmi Devi BP and medicines?',
        user: { role: 'family', name: 'Kavitha (Anitha Family)', residentId: 'EC-005' },
        lang: 'en'
      }
    },
    {
      name: 'Caregiver Multi-Turn Pronoun Continuity',
      payload: {
        message: 'What about her evening dose?',
        user: { role: 'caregiver', name: 'Priya Sharma' },
        lang: 'en',
        history: [
          { role: 'user', content: 'What is Anitha medication schedule?' },
          { role: 'assistant', content: 'Anitha has Metformin 500mg and Amlodipine 5mg.' }
        ]
      }
    }
  ];

  let passed = 0;
  for (const tc of testCases) {
    try {
      const res = await postChatbot(tc.payload);
      if (res.success && res.reply && res.reply.length > 10) {
        console.log(`[PASS] ${tc.name}`);
        console.log(`       Reply snippet: ${res.reply.substring(0, 100).replace(/\n/g, ' ')}...`);
        passed++;
      } else {
        console.log(`[FAIL] ${tc.name}`);
        console.log(`       Response:`, res);
      }
    } catch (e) {
      console.log(`[ERROR] ${tc.name}:`, e.message);
    }
  }

  console.log(`\nResult: ${passed}/${testCases.length} Passed`);
  process.exit(passed === testCases.length ? 0 : 1);
}

runTests();
