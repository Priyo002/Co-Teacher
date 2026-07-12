import { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Bot, PanelRightClose, Trash2, Mic, MicOff, Volume2, Square, Headphones, X } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import ReactMarkdown from 'react-markdown';

export default function AITutorChat({ courseId, lessonId, onClose }) {
  const storageKey = `ai_tutor_chat_${courseId}`;

  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse chat history', e);
    }
    return [
      { role: 'assistant', content: 'Hi! I am your AI tutor for this course. Ask me anything to clarify concepts or dive deeper.' }
    ];
  });
  
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [playingIndex, setPlayingIndex] = useState(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  
  const fetchApi = useApi();
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);
  
  const voiceModeRef = useRef(isVoiceMode);
  const messageRef = useRef(message);
  const chatHistoryRef = useRef(chatHistory);
  
  useEffect(() => {
    voiceModeRef.current = isVoiceMode;
  }, [isVoiceMode]);

  useEffect(() => {
    messageRef.current = message;
  }, [message]);

  useEffect(() => {
    chatHistoryRef.current = chatHistory;
  }, [chatHistory]);

  // Auto-resize textarea when message changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Initialize Speech Recognition
  useEffect(() => {
    let silenceTimer = null;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event) => {
        let newTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            newTranscript += event.results[i][0].transcript + ' ';
          }
        }
        if (newTranscript) {
          setMessage(prev => (prev ? prev + ' ' + newTranscript.trim() : newTranscript.trim()));
          if (voiceModeRef.current) {
            clearTimeout(silenceTimer);
            silenceTimer = setTimeout(() => {
              if (recognitionRef.current && voiceModeRef.current) {
                recognitionRef.current.stop();
              }
            }, 1500);
          }
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        if (event.error !== 'no-speech') {
          setIsListening(false);
        }
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (voiceModeRef.current && messageRef.current.trim().length > 0) {
          sendTutorMessage(messageRef.current);
        }
      };
    }
    
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      window.speechSynthesis.cancel();
    };
  }, []);

  // Load chat history when switching courses
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setChatHistory(JSON.parse(saved));
      } else {
        setChatHistory([
          { role: 'assistant', content: 'Hi! I am your AI tutor for this course. Ask me anything to clarify concepts or dive deeper.' }
        ]);
      }
    } catch (e) {
      console.error('Failed to load chat history', e);
    }
  }, [storageKey]);

  // Save chat history to local storage
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(chatHistory));
  }, [chatHistory, storageKey]);

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear this chat's history?")) {
      window.speechSynthesis.cancel();
      setPlayingIndex(null);
      setChatHistory([
        { role: 'assistant', content: 'Hi! I am your AI tutor for this course. Ask me anything to clarify concepts or dive deeper.' }
      ]);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          console.error(e);
        }
      } else {
        alert("Speech recognition is not supported in this browser.");
      }
    }
  };

  const toggleSpeech = (text, index, isAutoSpeak = false) => {
    if (playingIndex === index && !isAutoSpeak) {
      window.speechSynthesis.cancel();
      setPlayingIndex(null);
    } else {
      window.speechSynthesis.cancel();
      // Clean markdown characters for smoother reading
      const cleanText = text.replace(/[*#`_~]/g, '').trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      utterance.onend = () => {
        setPlayingIndex(null);
        if (voiceModeRef.current && recognitionRef.current) {
          try {
            recognitionRef.current.start();
            setIsListening(true);
          } catch(e) {}
        }
      };
      utterance.onerror = () => setPlayingIndex(null);
      
      setPlayingIndex(index);
      window.speechSynthesis.speak(utterance);
    }
  };

  const sendTutorMessage = async (text) => {
    if (!text.trim() || isTyping) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const userMsg = text.trim();
    setMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    setPlayingIndex(null);

    try {
      const data = await fetchApi(`/courses/${courseId}/chat`, {
        method: 'POST',
        body: JSON.stringify({
          message: userMsg,
          currentLessonId: lessonId,
          history: chatHistoryRef.current
        })
      });
      setChatHistory(prev => {
        const newHistory = [...prev, { role: 'assistant', content: data.reply }];
        if (voiceModeRef.current) {
          setTimeout(() => toggleSpeech(data.reply, newHistory.length - 1, true), 100);
        }
        return newHistory;
      });
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
      if (voiceModeRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch(e) {}
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    sendTutorMessage(message);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border-l border-slate-200 relative z-10 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-2 text-sm text-brand-600 font-semibold">
          <Bot className="w-4 h-4" /> AI Tutor
        </div>
        <div className="flex items-center gap-1">
          {/* Voice Mode Toggle */}
          <button
            onClick={() => {
              if (isVoiceMode) {
                setIsVoiceMode(false);
                recognitionRef.current?.stop();
                window.speechSynthesis.cancel();
              } else {
                setIsVoiceMode(true);
                if (recognitionRef.current) {
                  try {
                    recognitionRef.current.start();
                    setIsListening(true);
                  } catch(e) {}
                }
              }
            }}
            className={`p-1.5 rounded transition-colors ${isVoiceMode ? 'bg-brand-100 text-brand-600' : 'text-slate-500 hover:text-brand-600 hover:bg-slate-100'}`}
            title={isVoiceMode ? "Exit Voice Mode" : "Start Voice Mode"}
          >
            <Headphones className="w-5 h-5" />
          </button>
          
          {chatHistory.length > 1 && (
            <button
              onClick={handleClearHistory}
              className="text-slate-500 hover:text-red-600 p-1.5 rounded hover:bg-slate-100 transition-colors"
              title="Clear Chat History"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {onClose && (
            <button 
              onClick={onClose} 
              className="lg:hidden text-slate-500 hover:text-slate-900 p-1.5 rounded hover:bg-slate-100 transition-colors" 
              title="Shrink AI Tutor"
            >
              <PanelRightClose className="w-5 h-5" />
            </button>
          )}
          </div>
      </div>
      
      {isVoiceMode ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-900 via-[#111827] to-brand-950 animate-in fade-in duration-500 relative overflow-hidden">
           {/* Decorative Background Elements */}
           <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-500/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
           <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
           
           <div className="relative w-48 h-48 flex items-center justify-center mb-16">
              {/* Outer pulsing rings when listening */}
              {isListening && (
                <>
                  <div className="absolute inset-0 bg-brand-500/30 rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" />
                  <div className="absolute inset-4 bg-brand-400/20 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                </>
              )}
              
              {/* Inner glowing orb (Clickable) */}
              <button 
                type="button"
                onClick={() => {
                  if (!isListening && playingIndex === null && !isTyping) {
                    if (recognitionRef.current) {
                      try {
                        recognitionRef.current.start();
                        setIsListening(true);
                      } catch(e) {}
                    }
                  } else if (isListening) {
                    if (recognitionRef.current) {
                      recognitionRef.current.stop();
                    }
                  } else if (playingIndex !== null) {
                    window.speechSynthesis.cancel();
                    setPlayingIndex(null);
                  }
                }}
                className={`relative z-10 w-36 h-36 rounded-full flex items-center justify-center backdrop-blur-xl border border-white/10 transition-all duration-700 ease-out shadow-[0_0_80px_rgba(var(--brand-500-rgb),0.3)] hover:scale-105 active:scale-95 ${
                  isTyping ? 'bg-gradient-to-tr from-brand-600 to-violet-500 animate-[spin_4s_linear_infinite]' :
                  playingIndex !== null ? 'bg-gradient-to-tr from-brand-500 to-blue-500 scale-110 shadow-[0_0_100px_rgba(var(--brand-500-rgb),0.6)]' :
                  isListening ? 'bg-gradient-to-tr from-brand-500 to-indigo-500 scale-100' : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className={`flex items-center justify-center transition-all duration-500 ${isTyping ? 'animate-[spin_4s_linear_infinite_reverse]' : ''}`}>
                  {isTyping ? (
                    <Sparkles className="w-14 h-14 text-white/90 animate-pulse" />
                  ) : playingIndex !== null ? (
                    <Volume2 className="w-14 h-14 text-white/90 animate-pulse" />
                  ) : isListening ? (
                    <Mic className="w-14 h-14 text-white/90" />
                  ) : (
                    <MicOff className="w-14 h-14 text-slate-400" />
                  )}
                </div>
              </button>
           </div>
           
           <div className="text-center space-y-4 relative z-10">
              <h3 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
                {isTyping ? "Thinking..." : playingIndex !== null ? "Speaking..." : isListening ? "Listening..." : "Paused"}
              </h3>
              <p className="text-slate-300/80 text-sm font-medium max-w-[280px] mx-auto leading-relaxed">
                {isTyping ? "The AI tutor is processing your query." : 
                 playingIndex !== null ? "Tap the orb to stop speaking." : 
                 isListening ? "Speak now. I'll respond when you pause." : "Tap the mic orb to resume listening."}
              </p>
           </div>
           
           {/* Close Voice Mode button */}
           <button
             onClick={() => {
                setIsVoiceMode(false);
                recognitionRef.current?.stop();
                window.speechSynthesis.cancel();
             }}
             className="absolute bottom-8 px-6 py-2.5 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white/90 rounded-full text-sm font-medium flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
           >
             <X className="w-4 h-4" /> Exit Voice Mode
           </button>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {chatHistory.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0 border border-brand-200">
                <Sparkles className="w-4 h-4 text-brand-600" />
              </div>
            )}
            <div className={`relative group p-3 rounded-2xl max-w-[85%] ${
              msg.role === 'user' 
                ? 'bg-brand-600 text-white rounded-tr-sm' 
                : 'bg-white text-slate-700 border border-slate-200 rounded-tl-sm prose prose-sm max-w-none shadow-sm'
            }`}>
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{msg.content}</p>
              ) : (
                <div className="pr-6">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                  
                  {/* Play/Stop Audio Button */}
                  <button
                    onClick={() => toggleSpeech(msg.content, idx)}
                    className="absolute top-2 right-2 p-1.5 rounded-full text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title={playingIndex === idx ? "Stop Audio" : "Read Aloud"}
                  >
                    {playingIndex === idx ? (
                      <Square className="w-4 h-4 fill-current text-brand-500" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0 border border-brand-200">
              <Sparkles className="w-4 h-4 text-brand-600" />
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 rounded-tl-sm flex items-center gap-2 shadow-sm">
              <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-200 shrink-0">
        <form onSubmit={handleSendMessage} className="relative flex flex-col justify-center min-h-[48px]">
          {isListening ? (
             <div className="w-full bg-brand-50/50 border border-brand-200 rounded-xl flex items-center justify-between px-4 py-2 shadow-inner animate-in fade-in zoom-in-95 duration-200">
               <div className="flex-1 flex items-center gap-1.5 overflow-hidden pr-4 opacity-80 justify-start">
                 {[...Array(30)].map((_, i) => (
                   <div 
                     key={i} 
                     className="w-1.5 bg-brand-500 rounded-full animate-[pulse_1s_ease-in-out_infinite]" 
                     style={{ 
                       height: `${Math.max(4, Math.random() * 20)}px`, 
                       animationDelay: `${i * 0.05}s` 
                     }}
                   />
                 ))}
               </div>
               <div className="flex items-center gap-2 shrink-0">
                 <button 
                   type="button"
                   onClick={toggleListening}
                   className="w-10 h-10 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors shadow-sm"
                   title="Stop Listening"
                 >
                   <div className="w-3.5 h-3.5 bg-red-600 rounded-[3px]" />
                 </button>
               </div>
             </div>
          ) : (
            <div className="relative w-full">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (message.trim() && !isTyping) handleSendMessage(e);
                  }
                }}
                placeholder="Ask your AI tutor..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-4 pr-24 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500/50 transition-colors shadow-sm resize-none overflow-y-auto block"
                rows={1}
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={toggleListening}
                  className="p-2 rounded-lg transition-colors flex items-center justify-center text-slate-400 hover:text-brand-500 hover:bg-slate-100"
                  title="Speak your question"
                >
                  <Mic className="w-4 h-4" />
                </button>
                <button 
                  type="submit" 
                  disabled={!message.trim() || isTyping}
                  className="p-2 bg-brand-500 text-white rounded-lg hover:bg-brand-400 transition-colors disabled:opacity-50 shadow-sm"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
      </>
      )}
    </div>
  );
}
