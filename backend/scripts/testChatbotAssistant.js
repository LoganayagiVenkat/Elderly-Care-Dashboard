import { processCareAssistantQuery } from '../services/residentCareAssistant.js';
import { query } from '../config/db.js';

async function runTests() {
  console.log('====================================================');
  console.log('STARTING ELDERCARE RESIDENT CARE & GENERAL AI TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function assertTest(name, queryObj, validator) {
    try {
      const res = await processCareAssistantQuery(queryObj);
      const ok = validator(res);
      if (ok) {
        console.log(`✅ [PASS] ${name}`);
        console.log(`   Q: "${queryObj.message}"`);
        console.log(`   A: "${res.reply.replace(/\n/g, ' ').substring(0, 140)}..."`);
        passed++;
      } else {
        console.error(`❌ [FAIL] ${name}`);
        console.error(`   Q: "${queryObj.message}"`);
        console.error(`   A: "${res.reply}"`);
        failed++;
      }
    } catch (err) {
      console.error(`💥 [ERROR] ${name}:`, err.message);
      failed++;
    }
    console.log('----------------------------------------------------');
  }

  // ==========================================================
  // SECTION 1: RESIDENT CARE DATABASE QUESTIONS
  // ==========================================================

  // 1. Medication check (English)
  await assertTest(
    'Medication check: Does Anitha have sugar medicine?',
    { message: 'Does Anitha have sugar medicine?', user: { role: 'admin' }, lang: 'en' },
    (res) => res.reply.includes('Metformin') || res.reply.includes('glucose')
  );

  // 2. Medication check (Tamil / Tanglish)
  await assertTest(
    'Tamil/Tanglish check: Anitha-ku sugar tablet irukka?',
    { message: 'Anitha-ku sugar tablet irukka?', user: { role: 'admin' }, lang: 'ta' },
    (res) => res.reply.includes('Metformin') && (res.reply.includes('ஆம்') || res.detectedLang === 'ta')
  );

  // 3. Multi-turn Follow-up: "When does she take it?"
  await assertTest(
    'Follow-up: When does she take it?',
    {
      message: 'When does she take it?',
      user: { role: 'admin' },
      lang: 'en',
      history: [
        { from: 'user', text: 'Does Anitha have sugar medicine?' },
        { from: 'bot', text: 'Yes, she has Metformin 500 mg.' }
      ]
    },
    (res) => res.reply.toLowerCase().includes('metformin') && (res.reply.includes('PM') || res.reply.includes('AM') || res.reply.includes('scheduled'))
  );

  // 4. Multi-turn Follow-up: "Did she take it?"
  await assertTest(
    'Follow-up: Did she take it?',
    {
      message: 'Did she take it?',
      user: { role: 'admin' },
      lang: 'en',
      history: [
        { from: 'user', text: 'Does Anitha have sugar medicine?' },
        { from: 'bot', text: 'Yes, she has Metformin 500 mg.' }
      ]
    },
    (res) => res.reply.toLowerCase().includes('metformin') && (res.reply.includes('pending') || res.reply.includes('completed') || res.reply.includes('taken'))
  );

  // 5. Total doses today calculation
  await assertTest(
    'Calculation: How many medicines are scheduled today?',
    { message: 'How many medicines are scheduled today for Anitha?', user: { role: 'admin' }, lang: 'en' },
    (res) => res.reply.includes('medication doses are scheduled') || res.reply.includes('active medications')
  );

  // 6. Tanglish total doses: "Innaiku ethana tablets?"
  await assertTest(
    'Tamil/Tanglish count: Innaiku ethana tablets?',
    {
      message: 'Innaiku ethana tablets?',
      user: { role: 'admin' },
      lang: 'ta',
      history: [{ from: 'user', text: 'Tell me about Anitha Sundaram' }]
    },
    (res) => res.detectedLang === 'ta' && (res.reply.includes('திட்டமிடப்பட்டுள்ளன') || res.reply.includes('மருந்து'))
  );

  // 7. Latest BP
  await assertTest(
    'Care Record: What was her latest BP?',
    {
      message: 'What was her latest BP?',
      user: { role: 'admin' },
      lang: 'en',
      history: [{ from: 'user', text: 'Tell me about Anitha' }]
    },
    (res) => res.reply.includes('BP') || res.reply.includes('121/79') || res.reply.includes('mmHg')
  );

  // 8. Who recorded latest observation?
  await assertTest(
    'Care Record: Who recorded her latest observation?',
    {
      message: 'Who recorded her latest observation?',
      user: { role: 'admin' },
      lang: 'en',
      history: [{ from: 'user', text: 'Anitha Sundaram' }]
    },
    (res) => res.reply.includes('Deepa Suresh') || res.reply.includes('recorded')
  );

  // 9. Historical lookback calculation: "What was her weight two records ago?"
  await assertTest(
    'Historical Calculation: What was her weight two records ago?',
    {
      message: 'What was her weight two records ago?',
      user: { role: 'admin' },
      lang: 'en',
      history: [{ from: 'user', text: 'Anitha Sundaram' }]
    },
    (res) => res.reply.includes('weight 2 records ago') || res.reply.includes('60')
  );

  // 10. Record comparison: "What changed from yesterday?"
  await assertTest(
    'Comparison: What changed from yesterday?',
    {
      message: 'What changed from yesterday?',
      user: { role: 'admin' },
      lang: 'en',
      history: [{ from: 'user', text: 'Anitha Sundaram' }]
    },
    (res) => res.reply.includes('BP') || res.reply.includes('shifted') || res.reply.includes('Observations') || res.reply.includes('Temperature')
  );

  // 11. Trace Emergency -> Specialist -> Appointment relationship
  await assertTest(
    'Relationship Tracing: Why is she seeing the dermatologist?',
    {
      message: 'Why is she seeing the dermatologist?',
      user: { role: 'admin' },
      lang: 'en',
      history: [{ from: 'user', text: 'Anitha Sundaram' }]
    },
    (res) => res.reply.includes('health issue') || res.reply.includes('specialist') || res.reply.includes('scheduled')
  );

  // 12. Cross-module combination: "Does Anitha have anything pending today?"
  await assertTest(
    'Combined Aggregation: Does Anitha have anything pending today?',
    { message: 'Does Anitha have anything pending today?', user: { role: 'admin' }, lang: 'en' },
    (res) => res.reply.includes('Pending Medications') || res.reply.includes('Pending Care Tasks') || res.reply.includes('All scheduled items')
  );

  // 13. Profile details: age, room
  await assertTest(
    'Profile: What is Anitha\'s age?',
    { message: 'What is Anitha\'s age?', user: { role: 'admin' }, lang: 'en' },
    (res) => res.reply.includes('71') && res.reply.includes('years old')
  );

  await assertTest(
    'Profile: Which room is Anitha staying in?',
    { message: 'Which room is she staying in?', user: { role: 'admin' }, lang: 'en', history: [{ from: 'user', text: 'Anitha' }] },
    (res) => res.reply.includes('Willow Room 6')
  );

  // 14. Specialist availability
  await assertTest(
    'Specialist: When is the dermatologist available?',
    { message: 'When is the dermatologist available?', user: { role: 'admin' }, lang: 'en' },
    (res) => res.reply.toLowerCase().includes('dermatology') || res.reply.includes('Suresh Rao')
  );

  // 15. Clinical Safety Safeguard
  await assertTest(
    'Clinical Safety: Should she stop this medicine?',
    { message: 'Should she stop taking Metformin?', user: { role: 'admin' }, lang: 'en' },
    (res) => res.reply.includes('Clinical Safety Guidance') && res.reply.includes('physician')
  );

  // 16. Role-Based Access Control (RBAC): Family assigned to EC-001 querying Anitha (EC-005)
  await assertTest(
    'RBAC Enforcement: Family member of EC-001 querying Anitha Sundaram',
    {
      message: 'What is Anitha\'s BP?',
      user: { role: 'family', residentId: 'EC-001' },
      lang: 'en'
    },
    (res) => res.reply.includes('only provide information for your assigned resident')
  );

  // 17. Emergency details query: "Did Anitha have an emergency recently?"
  await assertTest(
    'Emergency Query: Did Anitha have an emergency recently?',
    { message: 'Did Anitha have an emergency recently?', user: { role: 'admin' }, lang: 'en' },
    (res) => res.reply.includes('Skin disease') || res.reply.includes('Emergency event') || res.reply.includes('allergic rash')
  );

  // 18. Documents query: "Does Anitha have any medical documents?"
  await assertTest(
    'Documents: Does Anitha have any medical documents?',
    { message: 'Does Anitha have any medical documents?', user: { role: 'admin' }, lang: 'en' },
    (res) => res.reply.includes('Assessment') || res.reply.includes('document')
  );

  // 19. Care plan pending tasks query: "What care tasks are pending for Anitha?"
  await assertTest(
    'Care Plan: What care tasks are pending for Anitha?',
    { message: 'What care tasks are pending for Anitha?', user: { role: 'admin' }, lang: 'en' },
    (res) => res.reply.includes('Pending care tasks') || res.reply.includes('stroll') || res.reply.includes('Care Plan')
  );

  // 20. Caregiver assigned residents query: "Which residents are assigned to Priya Nair?"
  await assertTest(
    'Caregiver Assignment: Which residents are assigned to Priya Nair?',
    { message: 'Which residents are assigned to Priya Nair?', user: { role: 'admin' }, lang: 'en' },
    (res) => res.reply.includes('Priya Nair') && (res.reply.includes('Lakshmi Devi') || res.reply.includes('Govind Pillai'))
  );

  // 21. Facility-wide Query: "How many residents are there?"
  await assertTest(
    'Facility Query: How many residents are there in the facility?',
    { message: 'How many residents are there in the facility?', user: { role: 'admin' }, lang: 'en' },
    (res) => res.reply.includes('ElderCare currently accommodates') && res.reply.includes('residents')
  );

  // ==========================================================
  // SECTION 2: GENERAL KNOWLEDGE & OPEN-ENDED AI QUESTIONS
  // ==========================================================

  // 22. General: What is hypertension?
  await assertTest(
    'General AI: What is hypertension?',
    { message: 'What is hypertension?', user: { role: 'admin' }, lang: 'en' },
    (res) => res.reply.toLowerCase().includes('high blood pressure') || res.reply.toLowerCase().includes('artery')
  );

  // 23. General: What is diabetes?
  await assertTest(
    'General AI: What is diabetes?',
    { message: 'What is diabetes?', user: { role: 'admin' }, lang: 'en' },
    (res) => res.reply.toLowerCase().includes('glucose') || res.reply.toLowerCase().includes('insulin')
  );

  // 24. General: Explain Python.
  await assertTest(
    'General AI: Explain Python.',
    { message: 'Explain Python.', user: { role: 'admin' }, lang: 'en' },
    (res) => res.reply.toLowerCase().includes('programming language')
  );

  // 25. General: What is machine learning?
  await assertTest(
    'General AI: What is machine learning?',
    { message: 'What is machine learning?', user: { role: 'admin' }, lang: 'en' },
    (res) => res.reply.toLowerCase().includes('artificial intelligence') || res.reply.toLowerCase().includes('learn')
  );

  // 26. General: How does Wi-Fi work?
  await assertTest(
    'General AI: How does Wi-Fi work?',
    { message: 'How does Wi-Fi work?', user: { role: 'admin' }, lang: 'en' },
    (res) => res.reply.toLowerCase().includes('radio') || res.reply.toLowerCase().includes('wireless')
  );

  // 27. General: What is 5G?
  await assertTest(
    'General AI: What is 5G?',
    { message: 'What is 5G?', user: { role: 'admin' }, lang: 'en' },
    (res) => res.reply.toLowerCase().includes('5th generation') || res.reply.toLowerCase().includes('generation mobile') || res.reply.toLowerCase().includes('latency')
  );

  // 28. General: Explain photosynthesis.
  await assertTest(
    'General AI: Explain photosynthesis.',
    { message: 'Explain photosynthesis.', user: { role: 'admin' }, lang: 'en' },
    (res) => res.reply.toLowerCase().includes('sunlight') || res.reply.toLowerCase().includes('plants')
  );

  // 29. General: What is the difference between TCP and UDP?
  await assertTest(
    'General AI: What is the difference between TCP and UDP?',
    { message: 'What is the difference between TCP and UDP?', user: { role: 'admin' }, lang: 'en' },
    (res) => res.reply.includes('TCP') && res.reply.includes('UDP')
  );

  // 30. General: What is Java?
  await assertTest(
    'General AI: What is Java?',
    { message: 'What is Java?', user: { role: 'admin' }, lang: 'en' },
    (res) => res.reply.toLowerCase().includes('programming language') || res.reply.includes('JVM')
  );

  // 31. General: What is the capital of France?
  await assertTest(
    'General AI: What is the capital of France?',
    { message: 'What is the capital of France?', user: { role: 'admin' }, lang: 'en' },
    (res) => res.reply.includes('Paris')
  );

  // 32. General: Who invented the telephone?
  await assertTest(
    'General AI: Who invented the telephone?',
    { message: 'Who invented the telephone?', user: { role: 'admin' }, lang: 'en' },
    (res) => res.reply.includes('Alexander Graham Bell') || res.reply.includes('Bell')
  );

  // 33. Real-Time DB State Change Test:
  console.log('Testing Real-Time Database Reflection (Modifying medication status in DB)...');
  await query("UPDATE medications SET status = 'completed' WHERE patientId = 'EC-005' AND medicine = 'Metformin'");
  await assertTest(
    'Real-time DB Reflection: Status changed to completed in database',
    {
      message: 'Did she take her Metformin?',
      user: { role: 'admin' },
      lang: 'en',
      history: [{ from: 'user', text: 'Anitha Sundaram' }]
    },
    (res) => res.reply.includes('completed') || res.reply.includes('taken her Metformin')
  );

  // Reset back to pending
  await query("UPDATE medications SET status = 'pending' WHERE patientId = 'EC-005' AND medicine = 'Metformin'");
  await assertTest(
    'Real-time DB Reflection: Status reverted to pending in database',
    {
      message: 'Did she take her Metformin?',
      user: { role: 'admin' },
      lang: 'en',
      history: [{ from: 'user', text: 'Anitha Sundaram' }]
    },
    (res) => res.reply.includes('pending')
  );

  console.log(`\n====================================================`);
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL ${passed + failed})`);
  console.log(`====================================================`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
