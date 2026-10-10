async function testHttp() {
  console.log('Testing HTTP /api/chatbot endpoint on http://localhost:5001/api/chatbot ...');

  const tests = [
    {
      name: 'Admin query for Anitha diabetes medicine',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
      body: { message: 'Does Anitha have sugar medicine?', lang: 'en' },
      check: (data) => data.success && data.reply.includes('Metformin')
    },
    {
      name: 'Multi-turn follow-up with history via HTTP',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
      body: {
        message: 'When does she take it?',
        lang: 'en',
        history: [
          { from: 'user', text: 'Does Anitha have sugar medicine?' },
          { from: 'bot', text: 'Yes. Anitha Sundaram is prescribed Metformin 500 mg.' }
        ]
      },
      check: (data) => data.success && data.reply.includes('Metformin') && (data.reply.includes('PM') || data.reply.includes('Afternoon'))
    },
    {
      name: 'Tamil / Tanglish HTTP query',
      headers: { 'Content-Type': 'application/json', 'x-user-role': 'admin' },
      body: { message: 'Anitha-ku sugar tablet irukka?', lang: 'ta' },
      check: (data) => data.success && data.detectedLang === 'ta' && data.reply.includes('Metformin')
    },
    {
      name: 'RBAC restriction for Family of Lakshmi Devi querying Anitha',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'family',
        'x-user-resident-id': 'EC-001'
      },
      body: { message: 'What was Anitha\'s latest BP?', lang: 'en' },
      check: (data) => data.success && data.reply.includes('only provide information for your assigned resident')
    }
  ];

  let passed = 0;
  for (const t of tests) {
    try {
      const res = await fetch('http://localhost:5001/api/chatbot', {
        method: 'POST',
        headers: t.headers,
        body: JSON.stringify(t.body)
      });
      const data = await res.json();
      if (t.check(data)) {
        console.log(`✅ [HTTP PASS] ${t.name}`);
        console.log(`   Reply: "${data.reply.substring(0, 100)}..."`);
        passed++;
      } else {
        console.error(`❌ [HTTP FAIL] ${t.name}:`, data);
      }
    } catch (err) {
      console.error(`💥 [HTTP ERROR] ${t.name}:`, err.message);
    }
  }

  console.log(`HTTP Tests finished: ${passed}/${tests.length} passed.`);
  process.exit(passed === tests.length ? 0 : 1);
}

testHttp();
