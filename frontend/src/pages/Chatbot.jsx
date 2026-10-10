import { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, Pill, CalendarClock, HeartPulse, UserCog, Siren, Mic, MicOff, Volume2, VolumeX, Square, Globe } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { chatbotApi } from '../services/api.js';

const SUGGESTIONS_EN = [
  { label: 'Pending Medications & Remaining Doses', query: 'What medications are remaining for Anitha today?', key: 'med_remaining', icon: Pill },
  { label: 'Latest Vitals, BP & Trends', query: 'What is the latest BP and vital record for Anitha?', key: 'latest_bp', icon: HeartPulse },
  { label: 'Caregiver Duty & Shift Status', query: 'Who is taking care of Anitha and what is their shift?', key: 'caregiver_assigned', icon: UserCog },
  { label: 'Doctor Visits & Emergency Referrals', query: 'Why was she scheduled with a specialist after the emergency?', key: 'doctor_referral', icon: CalendarClock },
  { label: 'Care Plan Goals & Milestone Progress', query: 'What is her care plan and goal progress?', key: 'care_plan', icon: Siren },
  { label: 'General Knowledge & Problem Solving', query: 'What is quantum computing and calculate 75 * 12', key: 'general_ai', icon: Globe },
];

const SUGGESTIONS_TA = [
  { label: 'மீதமுள்ள மாத்திரைகள் (Pending Doses)', query: 'அனிதாவுக்கு இன்று இன்னும் எத்தனை மாத்திரைகள் மீதமுள்ளன?', key: 'med_remaining', icon: Pill },
  { label: 'சமீபத்திய இரத்த அழுத்தம் & உடல்நிலை', query: 'அனிதாவின் சமீபத்திய இரத்த அழுத்தம் (BP) என்ன?', key: 'latest_bp', icon: HeartPulse },
  { label: 'பராமரிப்பாளர் பணி & ஷிப்ட் விவரம்', query: 'அனிதாவின் பராமரிப்பாளர் யார் மற்றும் அவரது பணி நேரம் என்ன?', key: 'caregiver_assigned', icon: UserCog },
  { label: 'சிறப்பு மருத்துவர் & அவசர சிகிச்சை', query: 'அவசர நிகழ்வுக்குப் பின் மருத்துவர் ஆலோசனை ஏன் வழங்கப்பட்டது?', key: 'doctor_referral', icon: CalendarClock },
  { label: 'பராமரிப்புத் திட்டம் & இலக்குகள்', query: 'அனிதாவின் பராமரிப்புத் திட்டம் மற்றும் இலக்கு முன்னேற்றம் என்ன?', key: 'care_plan', icon: Siren },
  { label: 'பொது அறிவு & எண்கணிதம்', query: 'கம்ப்யூட்டர் என்றால் என்ன மற்றும் 75 * 12 கணக்கிடு', key: 'general_ai', icon: Globe },
];

function timeNow() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function hasTamilScript(str) {
  return /[\u0B80-\u0BFF]/.test(str);
}

const TANGLISH_KEYWORDS = [
  'vanakkam', 'enna', 'eppadi', 'enge', 'engu', 'yaaru', 'yaar', 'eppo', 'eppothu',
  'marunthu', 'marundhu', 'mathirai', 'maathirai', 'kuligai', 'sapadu', 'thatha',
  'paati', 'periyavanga', 'mudhiyor', 'seviliyar', 'paramarippalar', 'kaapalar',
  'maruthuvar', 'maruthuva', 'santhippu', 'avasaram', 'udhavi', 'aabathu', 'abathu',
  'kaapathu', 'udalnila', 'udambu', 'raththa', 'azhutham', 'udarpayirchi', 'nigazhchi',
  'nigalchi', 'vilaiyattu', 'sollu', 'sollunga', 'kudu', 'kudunga', 'pannu', 'pannunga',
  'venum', 'vendum', 'theriyanum', 'paakanum', 'iruka', 'irukku', 'pesu', 'pesunga',
  'tamil', 'tamizhil', 'tamilil', 'seiyanum', 'thangirukavanga'
];

function isTanglish(str) {
  const lower = (str || '').toLowerCase();
  return TANGLISH_KEYWORDS.some((k) => lower.includes(k));
}

const GREETING_TA = 'வணக்கம்! நான் உங்கள் எல்டர்கேர் (ElderCare) அறிவார்ந்த AI உதவியாளர். நீங்கள் எதையும் என்னிடம் கேட்கலாம் (Ask me anything) — முதியோர் பராமரிப்பு, மருந்துகள், இரத்த அழுத்தம், அல்லது பொதுவான கேள்விகள் எதையும் தட்டச்சு செய்யுங்கள்!';
const GREETING_EN = 'Hello! I am your ElderCare AI Assistant. Ask me anything — about resident care, live medications, BP trends, appointments, or general topics.';

export default function Chatbot() {
  const { user } = useApp();
  const [language, setLanguage] = useState('ta'); // Default to Tamil as requested

  const [messages, setMessages] = useState([
    {
      id: 'm0',
      from: 'bot',
      text: GREETING_TA,
      time: timeNow(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [autoVoice, setAutoVoice] = useState(true);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState(null);
  const [voiceError, setVoiceError] = useState('');

  // Switch language and update initial welcome greeting immediately
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === 'm0') {
          return {
            ...m,
            text: newLang === 'ta' ? GREETING_TA : GREETING_EN,
          };
        }
        return m;
      })
    );
  };

  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Clean up speech synthesis & speech recognition on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Text-To-Speech function with Tamil (ta-IN) & English (en-IN) support
  const speakText = (text, id) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser.');
      return;
    }

    try {
      window.speechSynthesis.cancel();

      // Clean text of markdown, bracketed tags, and bullet characters
      const cleanText = text
        .replace(/\[.*?\]/g, '')
        .replace(/[*#_`]/g, '')
        .replace(/[•-]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanText) return;

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.92; // Clear and accessible pace for elderly care
      utterance.pitch = 1.0;

      const isTamil = hasTamilScript(cleanText) || language === 'ta';

      if (isTamil) {
        utterance.lang = 'ta-IN';
        if (window.speechSynthesis.getVoices) {
          const voices = window.speechSynthesis.getVoices();
          const tamilVoice = voices.find(
            (v) => v.lang === 'ta-IN' || v.lang.startsWith('ta') || v.name.toLowerCase().includes('tamil')
          );
          if (tamilVoice) {
            utterance.voice = tamilVoice;
          }
        }
      } else {
        utterance.lang = 'en-IN';
        if (window.speechSynthesis.getVoices) {
          const voices = window.speechSynthesis.getVoices();
          const enVoice = voices.find(
            (v) => v.lang === 'en-IN' || v.lang.startsWith('en')
          );
          if (enVoice) {
            utterance.voice = enVoice;
          }
        }
      }

      utterance.onstart = () => {
        setCurrentlySpeakingId(id);
      };
      utterance.onend = () => {
        setCurrentlySpeakingId(null);
      };
      utterance.onerror = () => {
        setCurrentlySpeakingId(null);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Speech synthesis error:', err);
      setCurrentlySpeakingId(null);
    }
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setCurrentlySpeakingId(null);
  };

  const speakMessage = (msg) => {
    let fullText = msg.text || '';
    if (msg.list && msg.list.length > 0) {
      fullText += '. ' + msg.list.join('. ');
    }
    speakText(fullText, msg.id);
  };

  // Speech-To-Text (Microphone voice input with Tamil/English support)
  const startListening = () => {
    setVoiceError('');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError(
        language === 'ta'
          ? 'உங்கள் உலாவியில் குரல் அறிதல் ஆதரிக்கப்படவில்லை. தயவுசெய்து Chrome அல்லது Edge பயன்படுத்தவும்.'
          : 'Voice recognition is not supported in this browser. Please use Chrome or Edge.'
      );
      setTimeout(() => setVoiceError(''), 4000);
      return;
    }

    stopSpeaking();

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      // When Tamil is selected, use ta-IN so spoken Tamil is directly recognized
      recognition.lang = language === 'ta' ? 'ta-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join('');
        setInput(transcript);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setVoiceError(
            language === 'ta'
              ? 'மைக்ரோஃபோன் அணுகல் மறுக்கப்பட்டது. அமைப்புகளில் அனுமதியை இயக்கவும்.'
              : 'Microphone access was denied. Please allow microphone permission.'
          );
        } else if (event.error !== 'no-speech') {
          setVoiceError(
            language === 'ta'
              ? 'குரலை அடையாளம் காண முடியவில்லை. மீண்டும் பேசவும்.'
              : 'Could not recognize voice. Please try again.'
          );
        }
        setIsListening(false);
        setTimeout(() => setVoiceError(''), 4000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Speech recognition start failed:', err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (isListening) stopListening();
    stopSpeaking();

    const userMsg = { id: 'u-' + Date.now(), from: 'user', text: trimmed, time: timeNow() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Strictly determine target language based on what the user actually said:
    // If message contains Tamil script or Tanglish words -> 'ta'
    // If message is in English -> 'en'
    const hasScript = hasTamilScript(trimmed);
    const hasTanglish = isTanglish(trimmed);
    let targetLang = 'en';
    if (hasScript || hasTanglish) {
      targetLang = 'ta';
    } else if (language === 'en') {
      targetLang = 'en';
    } else if (language === 'ta' && !/^[a-zA-Z\s?.,!0-9'-]+$/.test(trimmed)) {
      targetLang = 'ta';
    } else {
      targetLang = 'en';
    }

    try {
      const res = await chatbotApi.sendMessage(trimmed, user, targetLang, messages.slice(-8));
      const botReply = res.reply || (targetLang === 'ta' ? 'தகவல் கிடைக்கவில்லை.' : 'No response received from assistant.');
      const botId = 'b-' + Date.now();
      const botMsg = { id: botId, from: 'bot', time: timeNow(), text: botReply };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);

      if (autoVoice) {
        setTimeout(() => speakText(botReply, botId), 200);
      }
    } catch (err) {
      console.error('[Chatbot] Backend communication error:', err);
      const errorMsg = targetLang === 'ta'
        ? 'மன்னிக்கவும், எல்டர்கேர் சேவையகத்திலிருந்து தகவல்களைப் பெறுவதில் சிக்கல் ஏற்பட்டது. தயவுசெய்து சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.'
        : "I'm sorry, I was unable to connect to the ElderCare server to retrieve real-time records. Please ensure the backend is running and try again.";
      const botId = 'b-' + Date.now();
      const botMsg = { id: botId, from: 'bot', time: timeNow(), text: errorMsg };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);

      if (autoVoice) {
        setTimeout(() => speakText(errorMsg, botId), 200);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const currentSuggestions = language === 'ta' ? SUGGESTIONS_TA : SUGGESTIONS_EN;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>{language === 'ta' ? 'எல்டர்கேர் உதவியாளர் (Care Assistant)' : 'Care Assistant'}</h1>
          <p className="desc">
            {language === 'ta'
              ? 'தமிழ் மற்றும் ஆங்கில குரல் ஆதரவுடன் கூடிய முதியோர் நலன் AI உதவியாளர்.'
              : 'Voice-enabled AI assistant with live speech recognition & natural spoken responses.'}
          </p>
        </div>
      </div>

      <div className="chat-shell">
        <aside className="chat-side">
          <div>
            <h4>{language === 'ta' ? 'விரைவு குறிப்புகள் (Quick Actions)' : 'Quick Actions (Optional)'}</h4>
            <p style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.4 }}>
              {language === 'ta'
                ? '💡 நீங்கள் விரும்பினால் இவற்றை விரைவு தேர்வாக கிளிக் செய்யலாம் அல்லது கீழே எதையும் தட்டச்சு செய்யலாம்.'
                : '💡 Optional quick actions. You can type ANY question freely below.'}
            </p>
            <div className="suggested-q">
              {currentSuggestions.map((s) => (
                <button key={s.key} onClick={() => sendMessage(s.query || s.label)}>
                  <s.icon size={13} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h4>{language === 'ta' ? 'குரல் வழிகாட்டி' : 'Voice Features'}</h4>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              🎙️ <strong>{language === 'ta' ? 'பேசுங்கள்:' : 'Speak:'}</strong>{' '}
              {language === 'ta'
                ? 'மைக்ரோஃபோனைத் தட்டி தமிழில் அல்லது ஆங்கிலத்தில் கேள்விகளை கேளுங்கள்.'
                : 'Click the microphone to ask questions by voice in English or Tamil.'}
              <br />
              🔊 <strong>{language === 'ta' ? 'கேளுங்கள்:' : 'Listen:'}</strong>{' '}
              {language === 'ta'
                ? 'பதில்களைக் கேட்க எந்த பதிலின் கீழும் உள்ள கேளுங்கள் என்பதைத் தொடவும்.'
                : 'Click Listen on any response to hear it read aloud.'}
            </p>
          </div>
          <div>
            <h4>{language === 'ta' ? 'இந்த உதவியாளர் பற்றி' : 'About This Assistant'}</h4>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {language === 'ta'
                ? 'நேரடி MySQL தரவுகளுடன் இணைக்கப்பட்ட எல்டர்கேர் AI உதவியாளர். நீங்கள் எதையும் கேட்கலாம் — முதியோர் பராமரிப்பு, மருந்துகள், இரத்த அழுத்தம், அவசர உதவி அல்லது பொதுவான அறிவியல் & கணினி கேள்விகள்.'
                : 'Open-ended database-aware AI assistant. Ask anything about resident care, medication compliance, vitals trends, emergency histories, or general technical and science topics.'}
            </p>
          </div>
        </aside>

        <div className="chat-window">
          <div className="chat-window-head">
            <div className="bot-avatar"><Bot size={19} /></div>
            <div>
              <h4>{language === 'ta' ? 'எல்டர்கேர் AI உதவியாளர்' : 'ElderCare AI Assistant'}</h4>
              <div className="status-line">
                <span className="dot" />
                {language === 'ta' ? 'ஆன்லைன் • எதையும் கேளுங்கள் (Ask me anything)' : 'Online • Ask me anything'}
              </div>
            </div>

            <div className="voice-header-actions">
              {/* Language Selector */}
              <div className="chat-lang-toggle" role="group" aria-label="Language selection">
                <button
                  type="button"
                  className={'lang-btn ' + (language === 'ta' ? 'active' : '')}
                  onClick={() => handleLanguageChange('ta')}
                  title="தமிழ் பயன்முறை (Tamil mode)"
                >
                  <Globe size={11} /> தமிழ்
                </button>
                <button
                  type="button"
                  className={'lang-btn ' + (language === 'en' ? 'active' : '')}
                  onClick={() => handleLanguageChange('en')}
                  title="English mode"
                >
                  English
                </button>
              </div>

              {currentlySpeakingId && (
                <button
                  type="button"
                  className="voice-stop-btn"
                  onClick={stopSpeaking}
                  title="Stop assistant speech"
                >
                  <Square size={11} /> {language === 'ta' ? 'நிறுத்து' : 'Stop'}
                </button>
              )}
            </div>
          </div>

          <div className="chat-messages" ref={scrollRef}>
            {messages.map((m) => (
              <div className={'msg-row ' + (m.from === 'user' ? 'from-user' : '')} key={m.id}>
                <div className="msg-avatar">{m.from === 'user' ? <User size={15} /> : <Bot size={15} />}</div>
                <div>
                  <div className="msg-bubble">
                    {m.text}
                    {m.list && (
                      <ul>
                        {m.list.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start', gap: 8 }}>
                    <div className="msg-time">{m.time}</div>
                    {m.from === 'bot' && (
                      <button
                        type="button"
                        className={'msg-voice-action ' + (currentlySpeakingId === m.id ? 'speaking' : '')}
                        onClick={() => currentlySpeakingId === m.id ? stopSpeaking() : speakMessage(m)}
                        title={currentlySpeakingId === m.id ? "Stop reading" : "Listen to this answer"}
                      >
                        {currentlySpeakingId === m.id ? <VolumeX size={11} /> : <Volume2 size={11} />}
                        {currentlySpeakingId === m.id ? (language === 'ta' ? 'நிறுத்து' : 'Stop') : (language === 'ta' ? 'கேளுங்கள்' : 'Listen')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="msg-row">
                <div className="msg-avatar"><Bot size={15} /></div>
                <div className="msg-bubble">
                  <div className="typing-dots"><span /><span /><span /></div>
                </div>
              </div>
            )}
          </div>

          {voiceError && (
            <div style={{ padding: '6px 16px', background: '#FEE2E2', color: '#DC2626', fontSize: 11.5, borderTop: '1px solid #FCA5A5' }}>
              {voiceError}
            </div>
          )}

          {isListening && (
            <div className="voice-listening-banner">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div className="voice-wave-animation">
                  <span className="voice-wave-bar" />
                  <span className="voice-wave-bar" />
                  <span className="voice-wave-bar" />
                  <span className="voice-wave-bar" />
                </div>
                <span>
                  {language === 'ta'
                    ? 'உங்கள் குரலைக் கேட்கிறது... இப்போது தமிழில் பேசுங்கள்...'
                    : 'Listening to your voice... Speak now'}
                </span>
              </div>
              <button
                type="button"
                onClick={stopListening}
                style={{ background: 'none', border: 'none', color: '#B91C1C', cursor: 'pointer', fontWeight: 600, fontSize: 11.5 }}
              >
                {language === 'ta' ? 'முடிந்தது' : 'Done'}
              </button>
            </div>
          )}

          <form className="chat-input-bar" onSubmit={handleSubmit}>
            <input
              placeholder={
                isListening
                  ? (language === 'ta' ? 'கேட்கிறது... உங்கள் கேள்வியைப் பேசுங்கள்...' : 'Listening... speak your question...')
                  : (language === 'ta'
                    ? 'எதையும் கேளுங்கள் (Ask me anything)...'
                    : 'Ask me anything...')
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="button"
              className={'chat-mic-btn ' + (isListening ? 'listening' : '')}
              onClick={toggleListening}
              title={isListening ? (language === 'ta' ? 'நிறுத்து' : 'Stop listening') : (language === 'ta' ? 'குரல் மூலம் பேசுங்கள்' : 'Speak using microphone')}
              aria-label={isListening ? 'Stop microphone' : 'Start microphone'}
            >
              {isListening ? <MicOff size={17} /> : <Mic size={17} />}
            </button>
            <button type="submit" className="chat-send-btn" disabled={!input.trim()} aria-label="Send message">
              <Send size={17} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

