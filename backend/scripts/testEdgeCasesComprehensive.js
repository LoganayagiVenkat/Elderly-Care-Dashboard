import { processCareAssistantQuery } from '../services/residentCareAssistant.js';

async function runComprehensiveTests() {
  console.log('========================================================');
  console.log('RUNNING COMPREHENSIVE EDGE-CASE & SPECIFICATION TESTS');
  console.log('========================================================\n');

  const testCases = [
    {
      title: '1. Unknown Resident / Non-existent record',
      payload: { message: 'What is the latest BP or care record for John Doe?', user: { role: 'admin' }, lang: 'en' },
      validator: (r) => r.reply.includes('not a resident-specific record') || r.reply.includes('not available in ElderCare') || r.reply.includes('No clinical care records')
    },
    {
      title: '2. Tanglish Medication Calculation: "Anitha-ku remaining evlo?"',
      payload: { message: 'Anitha-ku remaining evlo?', user: { role: 'admin' }, lang: 'ta' },
      validator: (r) => r.detectedLang === 'ta' && (r.reply.includes('மீதமுள்ளன') || r.reply.includes('Pending') || r.reply.includes('நிலுவையில்'))
    },
    {
      title: '3. Follow-up pronoun + Tanglish count: "innum ethana baaki?"',
      payload: {
        message: 'innum ethana baaki?',
        user: { role: 'admin' },
        lang: 'ta',
        history: [{ from: 'user', text: 'Tell me about Anitha Sundaram' }]
      },
      validator: (r) => r.detectedLang === 'ta' && (r.reply.includes('மாத்திரைகள்') || r.reply.includes('Pending') || r.reply.includes('மீதமுள்ளன'))
    },
    {
      title: '4. Notifications query: "Are there any notifications today?"',
      payload: { message: 'Are there any notifications today?', user: { role: 'admin' }, lang: 'en' },
      validator: (r) => r.reply.includes('ElderCare Notifications') || r.reply.includes('unread')
    },
    {
      title: '5. Documents query: "What medical documents are on file for Raghavan?"',
      payload: { message: 'What medical documents are on file for Raghavan?', user: { role: 'admin' }, lang: 'en' },
      validator: (r) => r.reply.includes('Raghavan Kumar') && r.reply.includes('Lab Results')
    },
    {
      title: '6. Specialist weekly availability: "What days does Dr. Suresh Rao consult?"',
      payload: { message: 'What days does Dr. Suresh Rao consult?', user: { role: 'admin' }, lang: 'en' },
      validator: (r) => r.reply.includes('Suresh Rao') && r.reply.includes('Dermatology')
    },
    {
      title: '7. Multi-module summary: "Tell me everything about Raghavan Kumar"',
      payload: { message: 'Tell me everything about Raghavan Kumar: his condition, caregiver, and emergency history.', user: { role: 'admin' }, lang: 'en' },
      validator: (r) => r.reply.includes('Raghavan Kumar') && (r.reply.includes('Deepa Suresh') || r.reply.includes('Diabetes'))
    },
    {
      title: '8. Unknown General AI math: "Calculate 125 * 8"',
      payload: { message: 'Calculate 125 * 8', user: { role: 'admin' }, lang: 'en' },
      validator: (r) => r.reply.includes('1000')
    }
  ];

  let passed = 0;
  for (const tc of testCases) {
    console.log(`TEST: ${tc.title}`);
    console.log(`Q: "${tc.payload.message}"`);
    try {
      const res = await processCareAssistantQuery(tc.payload);
      const ok = tc.validator(res);
      if (ok) {
        console.log(`✅ [PASS]`);
        console.log(`A: ${res.reply.substring(0, 160).replace(/\n/g, ' ')}...\n`);
        passed++;
      } else {
        console.log(`❌ [FAIL]`);
        console.log(`A: ${res.reply}\n`);
      }
    } catch (err) {
      console.log(`💥 [ERROR]: ${err.message}\n`);
    }
  }

  console.log(`RESULTS: ${passed}/${testCases.length} Passed`);
  process.exit(passed === testCases.length ? 0 : 1);
}

runComprehensiveTests();
