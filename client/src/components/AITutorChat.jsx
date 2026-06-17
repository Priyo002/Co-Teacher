import { useState } from 'react';
import { Send, Sparkles, Bot, PanelRightClose } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import ReactMarkdown from 'react-markdown';

export default function AITutorChat({ courseId, lessonId, onClose }) {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: 'Hi! I am your AI tutor for this lesson. Ask me anything to clarify concepts or dive deeper.' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const fetchApi = useApi();

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || isTyping) return;

    const userMsg = message.trim();
    setMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const data = await fetchApi(`/courses/${courseId}/lessons/${lessonId}/chat`, {
        method: 'POST',
        body: JSON.stringify({
          message: userMsg,
          history: chatHistory
        })
      });
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-dark-900 border-l border-white/10 relative z-10 overflow-hidden">
      <div className="p-4 border-b border-white/10 bg-dark-950 flex items-center justify-between gap-3 shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-500/20 rounded-lg text-brand-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-200">AI Tutor</h3>
            <p className="text-xs text-brand-400">Online</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors" title="Shrink AI Tutor">
            <PanelRightClose className="w-5 h-5" />
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {chatHistory.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center shrink-0 border border-brand-500/30">
                <Sparkles className="w-4 h-4 text-brand-400" />
              </div>
            )}
            <div className={`p-3 rounded-2xl max-w-[85%] ${
              msg.role === 'user' 
                ? 'bg-brand-600 text-white rounded-tr-sm' 
                : 'bg-dark-800 text-slate-300 border border-white/5 rounded-tl-sm prose prose-invert prose-sm max-w-none'
            }`}>
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
              ) : (
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center shrink-0 border border-brand-500/30">
              <Sparkles className="w-4 h-4 text-brand-400" />
            </div>
            <div className="p-4 rounded-2xl bg-dark-800 border border-white/5 rounded-tl-sm flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-dark-950 border-t border-white/10 shrink-0">
        <form onSubmit={handleSendMessage} className="relative flex items-center">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask your AI tutor..."
            className="w-full bg-dark-800 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 transition-colors"
          />
          <button 
            type="submit" 
            disabled={!message.trim() || isTyping}
            className="absolute right-2 p-2 bg-brand-500 text-dark-900 rounded-lg hover:bg-brand-400 transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
