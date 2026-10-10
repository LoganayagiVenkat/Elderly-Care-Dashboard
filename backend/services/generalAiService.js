// ============================================================
// General AI Knowledge & External LLM Service
// Handles open-ended non-resident queries: Technology, Medicine,
// Science, World Knowledge, Definitions, Calculations, and Explanations.
// Supports external LLM APIs (Gemini, OpenAI, Groq, Anthropic, Ollama)
// with a comprehensive, rich built-in knowledge & reasoning engine.
// ============================================================

import dotenv from 'dotenv';
dotenv.config();

// Built-in Knowledge Base for Instant, Robust Answers (No API key required)
export const GENERAL_TOPICS = [
  // --- COMPUTER SCIENCE & TECHNOLOGY ---
  {
    triggers: ['python', 'what is python', 'explain python'],
    en: `Python is a high-level, interpreted programming language known for its clean syntax and readability. It is widely used in artificial intelligence, machine learning, data science, web development (with frameworks like Django and FastAPI), and automation scripting. Its extensive library ecosystem (NumPy, Pandas, PyTorch, TensorFlow) makes it one of the most popular languages in the world today.`,
    ta: `பைதான் (Python) என்பது வாசிப்பதற்கு எளிதான, உயர்நிலை கணினி நிரலாக்க மொழியாகும் (Programming Language). இது செயற்கை நுண்ணறிவு (AI), இயந்திர கற்றல் (Machine Learning), தரவு அறிவியல் (Data Science), இணையதள உருவாக்கம் மற்றும் தானியங்கி பணிகளில் பெருமளவில் பயன்படுத்தப்படுகிறது.`
  },
  {
    triggers: ['machine learning', 'what is machine learning', 'explain machine learning', 'what is ml'],
    en: `Machine Learning (ML) is a subfield of artificial intelligence that allows computer systems to learn patterns from historical data and make predictions or decisions without being explicitly hard-coded. Key paradigms include Supervised Learning (classification and regression using labeled data), Unsupervised Learning (finding hidden patterns or clusters), and Reinforcement Learning (learning through rewards and penalties).`,
    ta: `இயந்திரக் கற்றல் (Machine Learning) என்பது செயற்கை நுண்ணறிவின் (AI) ஒரு முக்கிய பிரிவாகும். கணினிகளுக்கு குறிப்பிட்ட விதிகளை நேரடியாக எழுதாமல், தரவுகளின் (Data) மூலம் வடிவங்களைக் கற்றுக்கொண்டு சுயமாக முடிவுகளை எடுக்க அல்லது முன்கணிக்க வைக்கும் தொழில்நுட்பமே இதுவாகும்.`
  },
  {
    triggers: ['artificial intelligence', 'what is ai', 'explain ai', 'what is artificial intelligence'],
    en: `Artificial Intelligence (AI) refers to the simulation of human intelligence by computer machines. It encompasses reasoning, learning, perception, language understanding, and problem-solving. AI powers technologies ranging from conversational virtual assistants and facial recognition to autonomous vehicles, medical diagnosis tools, and advanced robotics.`,
    ta: `செயற்கை நுண்ணறிவு (Artificial Intelligence - AI) என்பது மனிதனைப் போன்ற சிந்தனை, கற்றல், முடிவெடுக்கும் திறன் மற்றும் சிக்கல்களைத் தீர்க்கும் திறனை கணினிகளுக்கு வழங்கும் தொழில்நுட்பமாகும்.`
  },
  {
    triggers: ['quantum computing', 'what is quantum computing', 'explain quantum computing', 'qubits', 'quantum computer'],
    en: `Quantum computing is a cutting-edge paradigm in computer science that utilizes principles of quantum mechanics—namely superposition and entanglement—to process complex information exponentially faster than classical computers for tasks like cryptography, molecular simulation, and optimization. Instead of traditional binary bits (0 or 1), quantum systems operate using quantum bits (qubits).`,
    ta: `குவாண்டம் கம்ப்யூட்டிங் (Quantum Computing) என்பது குவாண்டம் இயக்கவியல் கோட்பாடுகளைப் பயன்படுத்தி (Superposition & Entanglement) இயங்கும் அதிநவீன கணினி தொழில்நுட்பமாகும். இதில் சாதாரண பிட்டுகளுக்குப் பதிலாக குவாண்டம் பிட்கள் (Qubits) பயன்படுகின்றன.`
  },
  {
    triggers: ['5g', 'what is 5g', 'explain 5g', '5th generation mobile'],
    en: `5G is the 5th generation mobile telecommunications network standard. Compared to 4G LTE, 5G delivers up to 100x faster peak data transmission speeds (up to 10-20 Gbps), ultra-low latency (under 1 millisecond), and vastly increased connection density (up to 1 million devices per square kilometer). It enables smart cities, telemedicine, autonomous driving, and IoT ecosystems.`,
    ta: `5G என்பது 5-ஆம் தலைமுறை செல்லுலார் மொபைல் நெட்வொர்க் தொழில்நுட்பமாகும். இது 4G-ஐ விட 100 மடங்கு வேகமான இணைய வேகம், மிகக் குறைந்த தாமதம் (Ultra-low latency - 1ms கீழ்) மற்றும் லட்சக்கணக்கான கருவிகளை ஒரே நேரத்தில் இணைக்கும் அதிநவீன ஆற்றலை வழங்குகிறது.`
  },
  {
    triggers: ['wi-fi', 'wifi', 'how does wi-fi work', 'how does wifi work', 'what is wifi'],
    en: `Wi-Fi (Wireless Fidelity) is a wireless networking technology that uses radio frequency waves (typically 2.4 GHz, 5 GHz, and 6 GHz bands) to transmit digital data between network routers and client devices like laptops, smartphones, and tablets. It is standardized under IEEE 802.11 protocols, translating binary electronic data into high-frequency radio pulses and back.`,
    ta: `வைஃபை (Wi-Fi) என்பது மின்காந்த ரேடியோ அலைகள் (Radio Frequency Waves - 2.4 GHz & 5 GHz) மூலம் வயர்கள் இல்லாமலேயே கணினிகள், மடிக்கணினிகள் மற்றும் ஸ்மார்ட்போன்களுக்கு இடையே அதிவேக இணைய தொடர்பை வழங்கும் கம்பியில்லா தொழில்நுட்பமாகும்.`
  },
  {
    triggers: ['tcp and udp', 'difference between tcp and udp', 'tcp vs udp', 'what is tcp', 'what is udp'],
    en: `TCP (Transmission Control Protocol) and UDP (User Datagram Protocol) are core transport protocols of the Internet:\n• TCP is connection-oriented, reliable, and guarantees in-order delivery of packets with error-checking and flow control (used for Web browsing/HTTP, Email, File transfers).\n• UDP is connectionless, lightweight, and fast with no delivery guarantee or retransmission (used for live video streaming, voice calls/VoIP, and online gaming where speed is prioritized over 100% packet integrity).`,
    ta: `TCP மற்றும் UDP ஆகியவை இணைய தரவு பரிமாற்றத்தின் இரண்டு முக்கிய நெறிமுறைகள் (Protocols):\n• TCP: நம்பகமானது, தரவு பாக்கெட்டுகள் சரியான வரிசையில் போய்ச் சேர்வதை உறுதி செய்கிறது (Web, Email).\n• UDP: மிக வேகமானது, ஆனால் தரவு சேருவதை மறுஉறுதி செய்யாது (Live Streaming, Video Calls, Gaming).`
  },
  {
    triggers: ['java', 'what is java', 'explain java'],
    en: `Java is a class-based, object-oriented programming language designed with the "Write Once, Run Anywhere" (WORA) philosophy. Code compiles into platform-independent bytecode that runs on any system equipped with the Java Virtual Machine (JVM). It powers major enterprise backend systems, Android applications, and financial transaction platforms.`,
    ta: `ஜாவா (Java) என்பது புகழ்பெற்ற ஆப்ஜெக்ட்-ஓரியன்டட் (Object-Oriented) நிரலாக்க மொழியாகும். "Write Once, Run Anywhere" என்ற கோட்பாட்டின் படி, JVM (Java Virtual Machine) உள்ள எந்த இயங்குதளத்திலும் ஜாவா மென்பொருட்களை இயக்க முடியும்.`
  },
  {
    triggers: ['javascript', 'what is javascript', 'explain javascript', 'js'],
    en: `JavaScript is the core programming language of the World Wide Web alongside HTML and CSS. It enables dynamic user interactions, asynchronous API communication, complex client-side applications, and server-side runtimes via Node.js. Modern JavaScript frameworks include React, Vue, and Angular.`,
    ta: `ஜாவாஸ்கிரிப்ட் (JavaScript) என்பது இணையதளங்களை இயங்குநிலையாகவும் (Dynamic) ஊடாடும் வகையிலும் (Interactive) மாற்றும் மிக முக்கியமான இணைய நிரலாக்க மொழியாகும்.`
  },
  {
    triggers: ['blockchain', 'what is blockchain', 'explain blockchain', 'blockchain technology'],
    en: `Blockchain is a decentralized, distributed, and cryptographically secured digital ledger that records transactions across multiple independent computers so that past records cannot be altered retroactively. It serves as the foundation for cryptocurrencies (like Bitcoin and Ethereum) and decentralized smart contracts.`,
    ta: `பிளாக்செயின் (Blockchain) என்பது தரவுகளை பரவலாக்கப்பட்ட முறையில் (Decentralized), யாராலும் திருத்தவோ மாற்றவோ முடியாதவாறு குறியாக்கம் (Cryptographic) செய்து சேமிக்கும் பாதுகாப்பான டிஜிட்டல் தொழில்நுட்பமாகும்.`
  },
  {
    triggers: ['cloud computing', 'what is cloud computing', 'what is cloud', 'aws', 'azure'],
    en: `Cloud computing is the on-demand delivery of IT computing resources—including storage, processing power, databases, networking, and software—over the internet with pay-as-you-go pricing, eliminating the need to maintain on-premise physical servers (e.g., AWS, Microsoft Azure, Google Cloud).`,
    ta: `கிளவுட் கம்ப்யூட்டிங் (Cloud Computing) என்பது இணையம் வழியாக சேமிப்பகம் (Storage), கம்ப்யூட்டிங் சர்வர்கள் மற்றும் மென்பொருள் சேவைகளை தேவைக்கேற்ப வாடகைக்கு பயன்படுத்தும் தொழில்நுட்பமாகும்.`
  },
  {
    triggers: ['database', 'what is database', 'what is sql', 'sql vs nosql'],
    en: `A database is an organized collection of structured information or data stored electronically in a computer system. Relational databases (like MySQL and PostgreSQL) use Structured Query Language (SQL) and tables with rows and columns, enforcing relational schemas and ACID transactions. Non-relational (NoSQL) databases (like MongoDB) store documents, key-values, or graphs for flexible scaling.`,
    ta: `தரவுத்தளம் (Database) என்பது கணினியில் முறைப்படுத்தப்பட்டு சேமிக்கப்படும் தரவுகளின் தொகுப்பாகும். MySQL போன்ற ரிலேஷனல் டேட்டாபேஸ்கள் SQL மொழியைப் பயன்படுத்தி அட்டவணைகளில் தரவுகளைத் துல்லியமாக நிர்வகிக்கின்றன.`
  },
  {
    triggers: ['cybersecurity', 'what is cybersecurity', 'hacker', 'encryption'],
    en: `Cybersecurity is the practice of protecting digital systems, networks, devices, and sensitive data from malicious attacks, unauthorized access, theft, or damage. Key security pillars include encryption, multi-factor authentication, firewalls, regular security patching, and principle of least privilege.`,
    ta: `சைபர் பாதுகாப்பு (Cybersecurity) என்பது கணினிகள், இணைய நெட்வொர்க்குகள் மற்றும் தரவுகளை இணைய தாக்குதல்கள், வைரஸ்கள் மற்றும் அங்கீகரிக்கப்படாத அணுகல்களிலிருந்து பாதுகாக்கும் தொழில்நுட்பமாகும்.`
  },

  // --- GENERAL HEALTH & CLINICAL EDUCATION ---
  {
    triggers: ['hypertension', 'what is hypertension', 'explain hypertension', 'high blood pressure'],
    en: `Hypertension (High Blood Pressure) is a common chronic cardiovascular condition where the force of blood against the artery walls is persistently elevated (typically a systolic reading of 130 mmHg or higher, or diastolic reading of 80 mmHg or higher). Often called the "silent killer" due to lack of early symptoms, untreated hypertension increases the risk of stroke, myocardial infarction (heart attack), and kidney damage. Management includes low-sodium diets, regular exercise, stress control, and prescribed antihypertensive medications (e.g., Amlodipine, Telmisartan). Always consult a healthcare professional for diagnosis.`,
    ta: `உயர் இரத்த அழுத்தம் (Hypertension / High BP) என்பது தமனிகளின் சுவர்களில் இரத்தம் செலுத்தும் அழுத்தம் தொடர்ந்து அதிகமாக இருக்கும் ஒரு நாள்பட்ட நிலையாகும் (130/80 mmHg அல்லது அதற்கு மேல்). தொடக்க நிலையில் அறிகுறிகள் தெரியாததால் இது "அமைதியான கொலையாளி" எனப்படுகிறது. முறையான உடற்பயிற்சி, குறைந்த உப்பு உணவு மற்றும் மருத்துவரின் ஆலோசனையுடன் மருந்துகள் எடுத்துக்கொள்வதன் மூலம் இதை கட்டுப்படுத்தலாம்.`
  },
  {
    triggers: ['diabetes', 'what is diabetes', 'explain diabetes', 'type 2 diabetes', 'blood sugar'],
    en: `Diabetes Mellitus is a metabolic disorder characterized by elevated levels of blood glucose over a prolonged period. It occurs when the pancreas either does not produce sufficient insulin (Type 1 Diabetes, autoimmune) or when body cells fail to respond effectively to insulin (Type 2 Diabetes, insulin resistance, common in seniors). Unmanaged diabetes can lead to cardiovascular complications, neuropathy, retinopathy, and nephropathy. Management involves glycemic monitoring, balanced low-glycemic nutrition, physical activity, and prescribed medication (such as Metformin or Insulin therapy).`,
    ta: `நீரிழிவு நோய் (Diabetes / சர்க்கரை நோய்) என்பது இரத்தத்தில் சர்க்கரையின் அளவு வழக்கத்தை விட அதிகமாக இருக்கும் ஒரு வளர்சிதை மாற்றக் கோளாறாகும். கணையம் போதிய இன்சுலினை சுரக்காதபோது அல்லது உடல் செல்கள் இன்சுலினை சரியாக ஏற்காதபோது இது ஏற்படுகிறது. ஆரோக்கியமான உணவு முறை, உடற்பயிற்சி மற்றும் மருத்துவர் பரிந்துரைக்கும் மருந்துகள் மூலம் இரத்த சர்க்கரை அளவை சீராக பராமரிக்கலாம்.`
  },
  {
    triggers: ['alzheimer', 'dementia', 'what is dementia', 'what is alzheimers', 'memory loss'],
    en: `Dementia is an umbrella clinical term for loss of memory, problem-solving, language, and other cognitive abilities severe enough to interfere with daily life. Alzheimer's disease is the most common cause of dementia, characterized by abnormal amyloid plaques and neurofibrillary tau tangles in the brain leading to progressive neuron loss. Early symptoms include memory lapses, disorientation, and mood changes. Supportive care, cognitive stimulation, routine structure, and medications like Donepezil or Memantine help manage symptoms.`,
    ta: `டிமென்ஷியா (Dementia / நினைவாற்றல் இழப்பு) என்பது வயதான காலத்தில் நினைவாற்றல், சிந்தனை மற்றும் முடிவெடுக்கும் திறன் குறையும் ஒரு நரம்பியல் நிலையாகும். இதில் அல்சைமர் நோய் (Alzheimer's) மிகவும் பொதுவானது. அன்பான பராமரிப்பு, நினைவாற்றல் பயிற்சிகள் மற்றும் மருத்துவ ஆலோசனைகள் மூலம் இந்நிலையை கையாளலாம்.`
  },
  {
    triggers: ['cholesterol', 'what is cholesterol', 'ldl', 'hdl'],
    en: `Cholesterol is a waxy, fat-like substance found in all cells of the human body, necessary for building cell membranes, synthesizing vitamin D, and producing certain hormones. It travels in the bloodstream bound to lipoproteins:\n• LDL (Low-Density Lipoprotein): "Bad" cholesterol that can accumulate inside arterial walls as plaque.\n• HDL (High-Density Lipoprotein): "Good" cholesterol that carries excess cholesterol back to the liver.\nElevated LDL is treated through heart-healthy nutrition and statin therapy (e.g., Atorvastatin).`,
    ta: `கொலஸ்ட்ரால் (Cholesterol) என்பது செல்களின் கட்டமைப்புக்கும் ஹார்மோன் உற்பத்திக்கும் அவசியமான ஒரு கொழுப்புப் பொருளாகும். இதில் LDL (கெட்ட கொழுப்பு) தமனிகளில் படிந்து இதய நோய்களை உருவாக்கும்; HDL (நல்ல கொழுப்பு) இதயத்தைப் பாதுகாக்கும்.`
  },
  {
    triggers: ['arthritis', 'what is arthritis', 'osteoarthritis', 'joint pain'],
    en: `Arthritis refers to inflammation or degeneration of one or more joints in the body. The two primary forms are Osteoarthritis (wear-and-tear breakdown of cartilage, frequent in older adults) and Rheumatoid Arthritis (an autoimmune disorder attacking joint lining). Common symptoms include joint stiffness, swelling, pain, and reduced range of motion. Treatment includes gentle physical therapy, pain relief, hot/cold therapy, and joint-protective movement.`,
    ta: `மூட்டுவலி (Arthritis / Osteoarthritis) என்பது மூட்டுகளில் ஏற்படும் வலி, வீக்கம் மற்றும் தேய்மானத்தைக் குறிக்கிறது. இது முதியோர்களிடம் பொதுவாகக் காணப்படும். மிதமான நடைப்பயிற்சி, பிசியோதெரபி மற்றும் மருத்துவரின் மருந்துகள் மூலம் மூட்டுகளின் ஆரோக்கியத்தை பாதுகாக்கலாம்.`
  },
  {
    triggers: ['osteoporosis', 'what is osteoporosis', 'bone density'],
    en: `Osteoporosis is a systemic skeletal condition characterized by decreased bone mass and microarchitectural deterioration of bone tissue, leading to fragile bones and increased risk of fractures (especially of the hip, spine, and wrist). Prevention and management include adequate calcium and vitamin D intake, weight-bearing exercise, and antiresorptive medications.`,
    ta: `எலும்பு பலவீனம் (Osteoporosis) என்பது எலும்புகளின் அடர்த்தி குறைந்து அவை எளிதில் முறியும் நிலைக்குச் செல்லும் நிலையாகும். கால்சியம், வைட்டமின் டி சத்துக்கள் மற்றும் உடற்பயிற்சி மூலம் எலும்பின் வலிமையைப் பாதுகாக்கலாம்.`
  },

  // --- SCIENCE, NATURE & GENERAL KNOWLEDGE ---
  {
    triggers: ['photosynthesis', 'what is photosynthesis', 'explain photosynthesis'],
    en: `Photosynthesis is the biochemical process by which green plants, algae, and certain bacteria convert sunlight, water, and atmospheric carbon dioxide into chemical energy in the form of glucose, releasing oxygen as a vital byproduct. It takes place within plant cell chloroplasts containing the green pigment chlorophyll: 6CO₂ + 6H₂O + Light Energy → C₆H₁₂O₆ + 6O₂. It is fundamental to life on Earth.`,
    ta: `ஒளிச்சேர்க்கை (Photosynthesis) என்பது பச்சையமுள்ள தாவரங்கள் சூரிய ஒளி, நீர் மற்றும் கார்பன் டை ஆக்சைடைப் பயன்படுத்தி தனக்குத் தேவையான உணவை (குளுக்கோஸ்) தயாரித்து, வளிமண்டலத்திற்கு பிராணவாயுவை (ஆக்சிஜன்) வெளியிடும் இயற்கை நிகழ்வாகும்.`
  },
  {
    triggers: ['telephone', 'who invented the telephone', 'who discovered the telephone', 'inventor of telephone'],
    en: `Alexander Graham Bell is widely credited with patenting the first practical telephone in 1876. While other inventors like Elisha Gray and Antonio Meucci contributed to early voice transmission concepts, Bell was awarded the foundational U.S. Patent (No. 174,465) for transmitting vocal sounds telegraphically.`,
    ta: `தொலைபேசியை (Telephone) 1876-ஆம் ஆண்டு அலெக்சாண்டர் கிரஹாம் பெல் (Alexander Graham Bell) கண்டுபிடித்து காப்புரிமை பெற்றார்.`
  },
  {
    triggers: ['capital of france', 'france capital', 'capital city of france', 'paris'],
    en: `The capital of France is Paris. Known as the "City of Light" (La Ville Lumière), Paris is a major global center for art, commerce, fashion, gastronomy, and culture, located along the Seine River in northern France.`,
    ta: `பிரான்ஸ் நாட்டின் தலைநகரம் பாரிஸ் (Paris) ஆகும்.`
  },
  {
    triggers: ['gravity', 'what is gravity', 'explain gravity'],
    en: `Gravity is a fundamental natural force of attraction between all objects with mass or energy. In classical physics, Sir Isaac Newton described gravity as an attractive force proportional to mass and inversely proportional to the square of distance. In modern physics, Albert Einstein's General Relativity describes gravity as the curvature of spacetime caused by mass and energy.`,
    ta: `புவியீர்ப்பு விசை (Gravity) என்பது பிரபஞ்சத்தில் நிறை கொண்ட அனைத்து பொருட்களும் ஒன்றை ஒன்று ஈர்க்கும் அடிப்படை இயற்கை விசையாகும். பூமியின் இந்த ஈர்ப்பு விசையே நம்மை தரையில் நிலைநிறுத்துகிறது.`
  },
  {
    triggers: ['solar system', 'planets', 'how many planets', 'planets in solar system'],
    en: `The Solar System consists of our Sun and the celestial bodies gravitationally bound to it. There are 8 officially recognized planets, ordered from closest to farthest from the Sun: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune (with Pluto classified as a dwarf planet since 2006).`,
    ta: `நமது சூரியக் குடும்பத்தில் (Solar System) சூரியனைச் சுற்றி 8 முக்கிய கோள்கள் உள்ளன: புதன், வெள்ளி, பூமி, செவ்வாய், வியாழன், சனி, யுரேனஸ் மற்றும் நெப்டியூன்.`
  }
];

/**
 * Check if external LLM API is available via environment variables
 */
export function getExternalLlmConfig() {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (geminiKey) {
    return { provider: 'gemini', key: geminiKey };
  }
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    return { provider: 'openai', key: openaiKey };
  }
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    return { provider: 'groq', key: groqKey };
  }
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    return { provider: 'anthropic', key: anthropicKey };
  }
  const ollamaUrl = process.env.OLLAMA_BASE_URL;
  if (ollamaUrl) {
    return { provider: 'ollama', url: ollamaUrl };
  }
  return null;
}

/**
 * Call external LLM if API key is configured
 */
export async function callExternalLlm(prompt, config, isTamil = false, customSystemPrompt = null) {
  try {
    const defaultSys = `You are an intelligent, empathetic AI digital assistant in an ElderCare management system. Answer the following question clearly, accurately, and politely in ${isTamil ? 'Tamil (தமிழ் / Tanglish)' : 'English'}. If the question involves clinical or medical concepts, provide factual information with standard healthcare guidance.`;
    const sysPrompt = customSystemPrompt || defaultSys;

    if (config.provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.key}`;
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: `${sysPrompt}\n\nUser Question: ${prompt}` }]
          }
        ],
        generationConfig: { maxOutputTokens: 800, temperature: 0.2 }
      };

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (resp.ok) {
        const data = await resp.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim()) return text.trim();
      }
    } else if (config.provider === 'openai' || config.provider === 'groq') {
      const endpoint = config.provider === 'groq'
        ? 'https://api.groq.com/openai/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';
      const model = config.provider === 'groq' ? 'llama-3.1-8b-instant' : 'gpt-4o-mini';

      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.key}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: sysPrompt },
            { role: 'user', content: prompt }
          ],
          max_tokens: 600,
          temperature: 0.2
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text && text.trim()) return text.trim();
      }
    }
  } catch (err) {
    console.warn('[GeneralAI] External LLM call warning:', err.message);
  }
  return null;
}

/**
 * Built-in Semantic Search across General Topics
 */
function searchBuiltInKnowledge(cleanText, isTamil = false) {
  // 1. Direct trigger match
  for (const item of GENERAL_TOPICS) {
    for (const t of item.triggers) {
      if (cleanText.includes(t)) {
        return isTamil ? item.ta : item.en;
      }
    }
  }

  // 2. Tokenized word overlap
  const STOP_WORDS = new Set([
    'what', 'when', 'where', 'which', 'who', 'whom', 'whose', 'why', 'how',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'done', 'the', 'a', 'an', 'and', 'or', 'but',
    'in', 'on', 'at', 'to', 'for', 'with', 'from', 'by', 'about', 'as',
    'this', 'that', 'these', 'those', 'there', 'here',
    'tell', 'explain', 'give', 'know', 'want', 'need', 'show', 'please',
    'enna', 'eppadi', 'irukku', 'sollu', 'solla', 'solunga'
  ]);

  const words = cleanText
    .replace(/[^\w\s]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));

  if (words.length === 0) return null;

  let bestMatch = null;
  let maxScore = 0;

  for (const item of GENERAL_TOPICS) {
    let score = 0;
    for (const t of item.triggers) {
      const triggerWords = t
        .replace(/[^\w\s]/g, ' ')
        .toLowerCase()
        .split(/\s+/)
        .filter((tw) => tw.length >= 3 && !STOP_WORDS.has(tw));

      for (const w of words) {
        if (triggerWords.includes(w)) {
          score += 3;
        }
      }
    }
    if (score > maxScore && score >= 3) {
      maxScore = score;
      bestMatch = item;
    }
  }

  if (bestMatch) {
    return isTamil ? bestMatch.ta : bestMatch.en;
  }

  return null;
}

/**
 * Dynamic calculation & heuristic generator
 */
function generateDynamicHeuristicAnswer(cleanText, isTamil = false) {
  // Math / Calculations: e.g. "Calculate 75 * 12", "what is 25 + 30", "50 / 2", "15 * 8"
  const mathMatch = cleanText.match(/(?:what is|calculate|solve|eval)?\s*(\d+(?:\.\d+)?)\s*([\+\-\*\/xX]|times|plus|minus|divided by)\s*(\d+(?:\.\d+)?)/i);
  if (mathMatch) {
    const num1 = parseFloat(mathMatch[1]);
    let op = mathMatch[2].toLowerCase();
    const num2 = parseFloat(mathMatch[3]);
    let result = 0;

    if (op === '+' || op === 'plus') {
      result = num1 + num2;
      op = '+';
    } else if (op === '-' || op === 'minus') {
      result = num1 - num2;
      op = '-';
    } else if (op === '*' || op === 'x' || op === 'times') {
      result = num1 * num2;
      op = '×';
    } else if (op === '/' || op === 'divided by') {
      result = num2 !== 0 ? Math.round((num1 / num2) * 1000) / 1000 : 'undefined (division by zero)';
      op = '÷';
    }

    if (isTamil) {
      return `கணித விடை: ${num1} ${op} ${num2} = ${result}`;
    }
    return `Calculation result: ${num1} ${op} ${num2} = ${result}`;
  }

  // Definition query fallback: e.g. "what is X?", "explain X"
  const defMatch = cleanText.match(/(?:what is|what are|explain|tell me about|who is|meaning of)\s+([a-zA-Z0-9\s-]+)\??$/i);
  if (defMatch) {
    const topic = defMatch[1].trim();
    if (isTamil) {
      return `"${topic}" என்பது ஒரு பொதுவான தலைப்பாகும். எல்டர்கேர் AI உதவியாளர் முதியோர் நல்வாழ்வு, மருத்துவ பதிவுகள் மற்றும் பொது அறிவுக் கேள்விகளுக்கு விடையளிக்கும் திறன் கொண்டது. இந்தத் தலைப்பைப் பற்றிய கூடுதல் விவரங்களை நீங்கள் தொடர்ந்து கேட்கலாம்!`;
    }
    return `"${topic}" is an open topic. As the ElderCare AI Assistant, I can assist with both resident healthcare management and open-ended general science, technology, and health topics. Feel free to ask more specific questions on "${topic}"!`;
  }

  return null;
}

/**
 * Main General Question Handler
 */
export async function answerGeneralQuestion(message = '', lang = 'en', history = []) {
  const isTamil = lang === 'ta';
  const clean = message.toLowerCase().trim();

  // 1. Try external LLM API if configured
  const extConfig = getExternalLlmConfig();
  if (extConfig) {
    const extAnswer = await callExternalLlm(message, extConfig, isTamil);
    if (extAnswer) {
      return {
        success: true,
        reply: extAnswer,
        source: 'llm',
        detectedLang: isTamil ? 'ta' : 'en'
      };
    }
  }

  // 2. Query built-in knowledge base
  const knowledgeAnswer = searchBuiltInKnowledge(clean, isTamil);
  if (knowledgeAnswer) {
    return {
      success: true,
      reply: knowledgeAnswer,
      source: 'knowledge_base',
      detectedLang: isTamil ? 'ta' : 'en'
    };
  }

  // 3. Dynamic calculation / heuristic engine
  const dynamicAnswer = generateDynamicHeuristicAnswer(clean, isTamil);
  if (dynamicAnswer) {
    return {
      success: true,
      reply: dynamicAnswer,
      source: 'heuristic',
      detectedLang: isTamil ? 'ta' : 'en'
    };
  }

  // 4. Courteous open-ended fallback
  if (isTamil) {
    return {
      success: true,
      reply: `நான் உங்கள் கேள்வியைப் புரிந்துகொண்டேன் ("${message}"). இது எல்டர்கேர் முதியோர் தரவுத்தளத்தில் உள்ள குறிப்பிட்ட நபர் பற்றிய கேள்வி இல்லை. கணினி தொழில்நுட்பம், மருத்துவ பொது அறிவு, அல்லது எல்டர்கேர் முதியோர் பராமரிப்பு விவரங்கள் பற்றி நீங்கள் என்ன வேண்டுமானாலும் தொடர்ந்து கேட்கலாம்!`,
      source: 'general_fallback',
      detectedLang: 'ta'
    };
  }

  return {
    success: true,
    reply: `I understand your question: "${message}". While this is not a resident-specific record in our ElderCare database, I can answer general knowledge, technology, healthcare concepts, and science questions. Feel free to ask more details on this topic or about any ElderCare resident!`,
    source: 'general_fallback',
    detectedLang: 'en'
  };
}

export default { answerGeneralQuestion, getExternalLlmConfig, callExternalLlm, GENERAL_TOPICS };
