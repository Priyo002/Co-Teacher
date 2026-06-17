import { useState } from 'react';
import { Lightbulb, Terminal, AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

function CodeBlockWithTabs({ codes }) {
  const availableLangs = ['python', 'cpp', 'java'].filter(l => codes && codes[l]);
  const [activeTab, setActiveTab] = useState(availableLangs[0] || 'python');

  if (availableLangs.length === 0) {
    return (
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm font-mono text-slate-200">
          <code>{codes?.python || "No code available"}</code>
        </pre>
      </div>
    );
  }

  return (
    <>
      <div className="flex bg-white/5 border-b border-white/5 overflow-x-auto custom-scrollbar">
        {availableLangs.map(lang => (
          <button
            key={lang}
            onClick={() => setActiveTab(lang)}
            className={`px-4 py-3 text-xs font-mono transition-colors border-b-2 whitespace-nowrap ${
              activeTab === lang 
                ? 'border-brand-500 text-brand-400 bg-brand-500/10' 
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Terminal className="w-3 h-3 inline-block mr-2" />
            {lang === 'cpp' ? 'C++' : lang === 'python' ? 'Python' : 'Java'}
          </button>
        ))}
      </div>
      <div className="p-4 overflow-x-auto custom-scrollbar">
        <pre className="text-sm font-mono text-slate-200">
          <code>{codes[activeTab]}</code>
        </pre>
      </div>
    </>
  );
}

export default function LessonRenderer({ blocks }) {
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showResults, setShowResults] = useState({});
  if (!blocks || !blocks.length) {
    return <div className="text-slate-400 italic">No content available for this lesson yet.</div>;
  }

  return (
    <div className="space-y-6 text-slate-300 leading-relaxed max-w-none">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'heading':
            const HeadingTag = `h${block.level || 2}`;
            return (
              <HeadingTag 
                key={idx} 
                className={`text-white font-bold tracking-tight first:mt-0 ${
                  block.level === 2 ? 'text-2xl mt-10 mb-4' : 'text-xl mt-8 mb-3'
                }`}
              >
                {block.text}
              </HeadingTag>
            );

          case 'paragraph':
            return (
              <div key={idx} className="mb-4 text-slate-300 text-lg prose prose-invert max-w-none">
                <ReactMarkdown>{block.text}</ReactMarkdown>
              </div>
            );

          case 'list':
            const ListTag = block.style === 'numbered' ? 'ol' : 'ul';
            const listClass = block.style === 'numbered' 
              ? 'list-decimal list-outside ml-6 space-y-2 mb-6' 
              : 'list-disc list-outside ml-6 space-y-2 mb-6 marker:text-brand-500';
            
            return (
              <ListTag key={idx} className={listClass}>
                {block.items.map((item, i) => (
                  <li key={i} className="pl-2 text-slate-300 text-lg prose prose-invert max-w-none">
                    <ReactMarkdown>{item}</ReactMarkdown>
                  </li>
                ))}
              </ListTag>
            );

          case 'code':
            return (
              <div key={idx} className="my-6 rounded-xl overflow-hidden border border-white/10 bg-[#0d1117] shadow-xl">
                <CodeBlockWithTabs codes={block.codes || { python: block.code }} />
              </div>
            );

          case 'callout':
            return (
              <div key={idx} className="my-8 glass-panel p-6 border-l-4 border-l-brand-500 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-16 bg-brand-500/5 rounded-full blur-2xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-50"></div>
                <div className="flex items-start gap-4 relative z-10">
                  <div className="text-2xl bg-dark-900/50 p-2 rounded-xl shadow-inner border border-white/5">
                    {block.emoji || '💡'}
                  </div>
                  <div>
                    {block.title && <h4 className="font-bold text-white mb-1">{block.title}</h4>}
                    <div className="text-slate-300 prose prose-invert max-w-none">
                      <ReactMarkdown>{block.text}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            );

          case 'video':
            return (
              <div key={idx} className="my-8 aspect-video w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <iframe
                  src={block.url.replace('watch?v=', 'embed/')}
                  title={block.title || 'Video Player'}
                  className="w-full h-full"
                  allowFullScreen
                ></iframe>
              </div>
            );

          case 'quiz':
            return (
              <div key={idx} className="my-10 bg-dark-800 rounded-2xl border border-white/10 p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-brand-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <h3 className="text-2xl font-bold text-white mb-8 relative z-10">{block.title || 'Knowledge Check'}</h3>
                
                <div className="space-y-8 relative z-10">
                  {block.questions.map((q, qIdx) => {
                    const questionKey = `${idx}-${qIdx}`;
                    const selectedAns = quizAnswers[questionKey];
                    const isSubmitted = showResults[questionKey];
                    const isCorrect = selectedAns === q.correctAnswer;

                    return (
                      <div key={qIdx} className="bg-dark-950 p-6 rounded-xl border border-white/5">
                        <p className="font-bold text-slate-200 mb-4">{qIdx + 1}. {q.question}</p>
                        <div className="space-y-3">
                          {q.options.map((opt, oIdx) => {
                            let btnClass = "w-full text-left p-4 rounded-lg border transition-all ";
                            if (isSubmitted) {
                              if (oIdx === q.correctAnswer) btnClass += "border-green-500 bg-green-500/10 text-white";
                              else if (oIdx === selectedAns) btnClass += "border-red-500 bg-red-500/10 text-slate-400 line-through";
                              else btnClass += "border-white/5 bg-white/5 text-slate-500 opacity-50";
                            } else {
                              if (selectedAns === oIdx) btnClass += "border-brand-500 bg-brand-500/10 text-white";
                              else btnClass += "border-white/5 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10";
                            }

                            return (
                              <button
                                key={oIdx}
                                disabled={isSubmitted}
                                onClick={() => setQuizAnswers(prev => ({ ...prev, [questionKey]: oIdx }))}
                                className={btnClass}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                        
                        {!isSubmitted && selectedAns !== undefined && (
                          <div className="mt-4 flex justify-end">
                            <button
                              onClick={() => setShowResults(prev => ({ ...prev, [questionKey]: true }))}
                              className="px-4 py-2 bg-brand-500 text-dark-900 font-bold rounded-lg hover:bg-brand-400 transition-colors"
                            >
                              Check Answer
                            </button>
                          </div>
                        )}

                        {isSubmitted && (
                          <div className={`mt-4 p-4 rounded-lg flex gap-3 ${isCorrect ? 'bg-green-500/10 text-green-400' : 'bg-brand-500/10 text-brand-400'}`}>
                            {isCorrect ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <Info className="w-5 h-5 shrink-0" />}
                            <div>
                              <p className="font-bold mb-1">{isCorrect ? 'Correct!' : 'Not quite.'}</p>
                              <p className="text-sm opacity-90">{q.explanation}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
