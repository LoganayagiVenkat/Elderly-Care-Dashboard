import { useNavigate, useLocation } from 'react-router-dom';
import { Bot } from 'lucide-react';

export default function ChatbotFab() {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === '/chatbot') return null;

  return (
    <button className="chat-fab" onClick={() => navigate('/chatbot')} aria-label="Open ElderCare Assistant">
      <Bot size={24} />
    </button>
  );
}
