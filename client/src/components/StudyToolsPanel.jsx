import { useState } from 'react';
import { MessageSquare, BrainCircuit, PlayCircle, Send, Sparkles, Loader2 } from 'lucide-react';
import { useApi } from '../hooks/useApi';

export default function StudyToolsPanel({ courseId, lessonId }) {
  const [activeTab, setActiveTab] = useState('chat');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const fetchApi = useApi();
  const [chatLog, setChatLog] = useState([
    { role: 'assistant', content: 'Hi! I am your AI tutor for this lesson. Ask me anything to clarify concepts or dive deeper.' }
  ]);

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!message.trim() || loading) return;
    
    const userMsg = message;
    setChatLog([...chatLog, { role: 'user', content: userMsg }]);
    setMessage('');
    setLoading(true);
    
    try {
      const response = await fetchApi(`/courses/${courseId}/lessons/${lessonId}/chat`, {
        method: 'POST',
        body: JSON.stringify({ message: userMsg, history: chatLog })
      });
      setChatLog(prev => [...prev, { role: 'assistant', content: response.reply }]);
    } catch (err) {
      setChatLog(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    setLoading(true);
    try {
      await fetchApi(`/courses/${courseId}/lessons/${lessonId}/${action}`, { method: 'POST' });
      // In a real app, we would re-fetch the lesson or show the result.
      // For now, we will just alert success since the streaming logic isn't wired to the UI state completely.
      alert(`${action} generated successfully! Reload page to see changes.`);
    } catch (err) {
      alert(`Error generating ${action}: ` + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel mt-12 overflow-hidden flex flex-col h-[500px]">
      <div className="flex border-b border-white/5">
        <button 
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${activeTab === 'chat' ? 'text-brand-400 border-b-2 border-brand-500 bg-brand-500/5' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
        >
          <MessageSquare className="w-4 h-4" /> AI Tutor
        </button>
        <button 
          onClick={() => setActiveTab('quiz')}
          className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${activeTab === 'quiz' ? 'text-brand-400 border-b-2 border-brand-500 bg-brand-500/5' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
        >
          <BrainCircuit className="w-4 h-4" /> Practice Quiz
        </button>
        <button 
          onClick={() => setActiveTab('video')}
          className={`flex-1 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${activeTab === 'video' ? 'text-brand-400 border-b-2 border-brand-500 bg-brand-500/5' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
        >
          <PlayCircle className="w-4 h-4" /> Videos
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-dark-900/50">
        {activeTab === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 space-y-4 mb-4 overflow-y-auto">
              {chatLog.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-4 ${
                    msg.role === 'user' ? 'bg-brand-600 text-white' : 'bg-dark-700 text-slate-200 border border-white/5'
                  }`}>
                    {msg.role === 'assistant' && <Sparkles className="w-4 h-4 text-brand-400 mb-2" />}
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <form onSubmit={handleSendChat} className="relative">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask your AI tutor..."
                disabled={loading}
                className="input-field pr-12 bg-dark-800 border-white/10 disabled:opacity-50"
              />
              <button 
                type="submit" 
                disabled={loading}
                className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-brand-500 text-dark-900 rounded-lg hover:bg-brand-400 transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'quiz' && (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <BrainCircuit className="w-16 h-16 text-slate-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Test Your Knowledge</h3>
            <p className="text-slate-400 mb-6 max-w-sm">Generate a 5-question multiple choice quiz based exactly on this lesson's content.</p>
            <button 
              onClick={() => handleAction('quiz')}
              disabled={loading}
              className="btn-primary shadow-brand-500/20"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Generate Quiz'}
            </button>
          </div>
        )}

        {activeTab === 'video' && (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <PlayCircle className="w-16 h-16 text-slate-600 mb-4" />
            <h3 className="text-xl font-bold mb-2">Suggested Videos</h3>
            <p className="text-slate-400 mb-6 max-w-sm">Our AI will search YouTube for the best tutorials relevant to this specific lesson.</p>
            <button 
              onClick={() => handleAction('add-videos')}
              disabled={loading}
              className="btn-primary shadow-brand-500/20"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Find Videos'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
