import { processCareAssistantQuery } from '../services/residentCareAssistant.js';

async function run() {
  console.log('Testing Unprecedented & Prompt-Specific Dynamic Questions:\n');

  const testCases = [
    {
      title: 'Dynamic Tanglish morning inquiry: "Anitha-ku morning enna nadandhuchu?"',
      payload: { message: 'Anitha-ku morning enna nadandhuchu?', user: { role: 'admin' }, lang: 'ta' }
    },
    {
      title: 'Tanglish care updates: "Her last three care updates enna?"',
      payload: {
        message: 'Her last three care updates enna?',
        user: { role: 'admin' },
        lang: 'ta',
        history: [{ from: 'user', text: 'Anitha Sundaram' }]
      }
    },
    {
      title: 'Due next query: "Which medicine is due next?"',
      payload: {
        message: 'Which medicine is due next for Anitha?',
        user: { role: 'admin' },
        lang: 'en'
      }
    },
    {
      title: 'Activities query: "Did she complete her activities today?"',
      payload: {
        message: 'Did she complete her activities today?',
        user: { role: 'admin' },
        lang: 'en',
        history: [{ from: 'user', text: 'Anitha Sundaram' }]
      }
    },
    {
      title: 'Who recorded observation: "Who recorded her most recent observation?"',
      payload: {
        message: 'Who recorded her most recent observation?',
        user: { role: 'admin' },
        lang: 'en',
        history: [{ from: 'user', text: 'Anitha Sundaram' }]
      }
    },
    {
      title: 'Cross-module meeting dermatologist: "Why is she meeting a dermatologist?"',
      payload: {
        message: 'Why is she meeting a dermatologist?',
        user: { role: 'admin' },
        lang: 'en',
        history: [{ from: 'user', text: 'Anitha Sundaram' }]
      }
    },
    {
      title: 'Pending query: "What is still pending for her?"',
      payload: {
        message: 'What is still pending for her?',
        user: { role: 'admin' },
        lang: 'en',
        history: [{ from: 'user', text: 'Anitha Sundaram' }]
      }
    },
    {
      title: 'Comparison: "Has anything changed since yesterday?"',
      payload: {
        message: 'Has anything changed since yesterday?',
        user: { role: 'admin' },
        lang: 'en',
        history: [{ from: 'user', text: 'Anitha Sundaram' }]
      }
    },
    {
      title: 'Historical calculation: "What was her weight two records ago?"',
      payload: {
        message: 'What was her weight two records ago?',
        user: { role: 'admin' },
        lang: 'en',
        history: [{ from: 'user', text: 'Anitha Sundaram' }]
      }
    },
    {
      title: 'Chronological summary: "Tell me everything important about her today."',
      payload: {
        message: 'Tell me everything important about her today.',
        user: { role: 'admin' },
        lang: 'en',
        history: [{ from: 'user', text: 'Anitha Sundaram' }]
      }
    },
    {
      title: 'General AI: "What is Python?"',
      payload: { message: 'What is Python?', user: { role: 'admin' }, lang: 'en' }
    },
    {
      title: 'General AI: "Explain 5G."',
      payload: { message: 'Explain 5G.', user: { role: 'admin' }, lang: 'en' }
    },
    {
      title: 'General AI: "What is machine learning?"',
      payload: { message: 'What is machine learning?', user: { role: 'admin' }, lang: 'en' }
    },
    {
      title: 'General AI: "What is hypertension?"',
      payload: { message: 'What is hypertension?', user: { role: 'admin' }, lang: 'en' }
    },
    {
      title: 'General AI: "Who invented the telephone?"',
      payload: { message: 'Who invented the telephone?', user: { role: 'admin' }, lang: 'en' }
    }
  ];

  for (const tc of testCases) {
    console.log(`\n==================================================`);
    console.log(`TEST: ${tc.title}`);
    console.log(`Q: "${tc.payload.message}"`);
    try {
      const res = await processCareAssistantQuery(tc.payload);
      console.log(`A [${res.detectedLang}]:\n${res.reply}`);
    } catch (err) {
      console.error(`ERROR:`, err.message);
    }
  }

  process.exit(0);
}

run();
