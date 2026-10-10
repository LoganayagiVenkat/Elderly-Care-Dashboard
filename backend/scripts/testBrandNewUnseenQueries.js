import { processCareAssistantQuery } from '../services/residentCareAssistant.js';

async function run() {
  console.log('Testing 100% Unseen & Brand-New Open-Ended Questions:\n');

  const testCases = [
    {
      title: 'Unseen Resident Query: Who is the emergency contact for Raghavan?',
      payload: { message: 'Who is the emergency contact for Raghavan?', user: { role: 'admin' }, lang: 'en' }
    },
    {
      title: 'Unseen Resident Query: What room is Lakshmi staying in?',
      payload: { message: 'What room is Lakshmi staying in?', user: { role: 'admin' }, lang: 'en' }
    },
    {
      title: 'Unseen Caregiver Query: Who are all the nurses or caregivers on duty?',
      payload: { message: 'Who are all the nurses or caregivers on duty?', user: { role: 'admin' }, lang: 'en' }
    },
    {
      title: 'Unseen General AI Query: What is quantum computing?',
      payload: { message: 'What is quantum computing?', user: { role: 'admin' }, lang: 'en' }
    },
    {
      title: 'Unseen Math Calculation: Calculate 75 * 12',
      payload: { message: 'Calculate 75 * 12', user: { role: 'admin' }, lang: 'en' }
    },
    {
      title: 'Unseen General AI Query: Explain blockchain technology.',
      payload: { message: 'Explain blockchain technology.', user: { role: 'admin' }, lang: 'en' }
    }
  ];

  for (const tc of testCases) {
    console.log(`==================================================`);
    console.log(`TEST: ${tc.title}`);
    console.log(`Q: "${tc.payload.message}"`);
    try {
      const res = await processCareAssistantQuery(tc.payload);
      console.log(`A [${res.detectedLang}]:\n${res.reply}\n`);
    } catch (err) {
      console.error(`ERROR:`, err.message);
    }
  }

  process.exit(0);
}

run();
