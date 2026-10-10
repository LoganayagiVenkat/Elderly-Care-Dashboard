import { processCareAssistantQuery } from '../services/residentCareAssistant.js';

async function run() {
  const tests = [
    {
      title: 'Contextual follow-up 1: "Tell me about Anitha"',
      history: [],
      message: 'Tell me about Anitha'
    },
    {
      title: 'Contextual follow-up 2: "remaining evlo" (Tanglish for remaining medications)',
      history: [
        { text: 'Tell me about Anitha', from: 'user' },
        { text: 'Anitha Sundaram is in Willow Room 6...', from: 'bot' }
      ],
      message: 'remaining evlo'
    },
    {
      title: 'Contextual follow-up 3: "did she miss any medicine?"',
      history: [
        { text: 'Tell me about Anitha', from: 'user' },
        { text: 'Anitha Sundaram is in Willow Room 6...', from: 'bot' }
      ],
      message: 'did she miss any medicine?'
    },
    {
      title: 'Care Plan query: "what is her care plan and goal progress?"',
      history: [
        { text: 'Tell me about Anitha', from: 'user' },
        { text: 'Anitha Sundaram is in Willow Room 6...', from: 'bot' }
      ],
      message: 'what is her care plan and goal progress?'
    },
    {
      title: 'Activity query: "does she have any recreational activity or yoga today?"',
      history: [
        { text: 'Tell me about Anitha', from: 'user' },
        { text: 'Anitha Sundaram is in Willow Room 6...', from: 'bot' }
      ],
      message: 'does she have any recreational activity or yoga today?'
    },
    {
      title: 'Notifications query: "any urgent alerts or unread notifications?"',
      history: [],
      message: 'any urgent alerts or unread notifications?'
    },
    {
      title: 'Facility stats query: "how many residents are currently in the facility?"',
      history: [],
      message: 'how many residents are currently in the facility?'
    },
    {
      title: 'Document query: "what documents or lab reports are uploaded for Anitha?"',
      history: [],
      message: 'what documents or lab reports are uploaded for Anitha?'
    },
    {
      title: 'Cross-module query: "why did she see a specialist after the emergency?"',
      history: [],
      message: 'why did Anitha see a specialist after the emergency?'
    }
  ];

  for (const t of tests) {
    console.log(`\n========================================`);
    console.log(`TEST: ${t.title}`);
    console.log(`Q: "${t.message}"`);
    try {
      const res = await processCareAssistantQuery({
        message: t.message,
        user: { role: 'admin' },
        lang: 'en',
        history: t.history
      });
      console.log(`A [${res.detectedLang}]:\n${res.reply}`);
    } catch (e) {
      console.error('ERROR:', e);
    }
  }
}

run();
