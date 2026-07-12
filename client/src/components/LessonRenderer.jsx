import { useState, useEffect } from 'react';
import { Lightbulb, Terminal, AlertTriangle, Info, CheckCircle2, XCircle, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import EditorComponent from 'react-simple-code-editor';
const Editor = EditorComponent.default || EditorComponent;
import Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/themes/prism.css';
import { Play, Loader2 } from 'lucide-react';

function CodeBlockWithTabs({ codes }) {
  const cleanCode = (code) => {
    if (!code || typeof code !== 'string') return '';
    return code.replace(/^```[\w]*\n?/g, '').replace(/\n?```$/g, '').trim();
  };

  const availableLangs = ['python', 'cpp', 'java'].filter(l => codes && codes[l]);
  const [activeTab, setActiveTab] = useState(availableLangs[0] || 'python');
  const [editableCodes, setEditableCodes] = useState({});
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState(null);

  useEffect(() => {
    if (codes) {
      const initial = {};
      Object.keys(codes).forEach(l => {
        initial[l] = cleanCode(codes[l]);
      });
      setEditableCodes(initial);
    }
  }, [codes]);

  const handleCopy = () => {
    const rawCode = editableCodes[activeTab] || '';
    navigator.clipboard.writeText(rawCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCodeChange = (newCode) => {
    setEditableCodes(prev => ({
      ...prev,
      [activeTab]: newCode
    }));
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput(null);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
      const res = await fetch(`${baseUrl}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: activeTab,
          code: editableCodes[activeTab]
        })
      });
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Server connection failed or returned an invalid response (Status: ${res.status}). Ensure the backend server is running.`);
      }
      
      const data = await res.json();
      if (data.success) {
        setOutput(data.result);
      } else {
        setOutput({ stderr: data.error, isError: true });
      }
    } catch (error) {
      setOutput({ stderr: error.message, isError: true });
    } finally {
      setIsRunning(false);
    }
  };

  const getLanguageForPrism = (lang) => {
    if (lang === 'cpp' || lang === 'c') return 'cpp';
    if (lang === 'python') return 'python';
    if (lang === 'java') return 'java';
    return 'javascript';
  };

  if (availableLangs.length === 0) {
    return (
      <div className="relative p-4 overflow-x-auto">
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-900 transition-colors"
          title="Copy code"
        >
          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
        </button>
        <pre className="text-sm font-mono text-slate-800 mt-2">
          <code>{cleanCode(codes?.python || "No code available")}</code>
        </pre>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between bg-slate-50 border-b border-slate-200 print:hidden">
        <div className="flex overflow-x-auto custom-scrollbar">
          {availableLangs.map(lang => (
            <button
              key={lang}
              onClick={() => {
                setActiveTab(lang);
                setOutput(null);
              }}
              className={`px-4 py-3 text-xs font-mono transition-colors border-b-2 whitespace-nowrap ${
                activeTab === lang 
                  ? 'border-brand-600 text-brand-700 bg-brand-50' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <Terminal className="w-3 h-3 inline-block mr-2" />
              {lang === 'cpp' ? 'C++' : lang === 'c' ? 'C' : lang === 'python' ? 'Python' : lang === 'java' ? 'Java' : 'JavaScript'}
            </button>
          ))}
        </div>
        <div className="flex items-center pr-2 gap-2">
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
            title="Run Code"
          >
            {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            Run
          </button>
          <button
            onClick={handleCopy}
            className="p-1.5 bg-white hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-900 transition-colors border border-slate-200 shadow-sm"
            title="Copy code"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>
      
      <div className="relative overflow-hidden print:hidden bg-white">
        <Editor
          value={typeof editableCodes[activeTab] === 'string' ? editableCodes[activeTab] : ''}
          onValueChange={handleCodeChange}
          highlight={code => {
            let safeCode = typeof code === 'string' ? code : '';
            let lang = getLanguageForPrism(activeTab);
            let grammar = Prism.languages[lang];
            if (!grammar) {
              grammar = Prism.languages.javascript;
              lang = 'javascript';
            }
            if (!grammar) {
              grammar = Prism.languages.clike;
              lang = 'clike';
            }
            return grammar ? Prism.highlight(safeCode, grammar, lang) : safeCode;
          }}
          padding={16}
          style={{
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            fontSize: 14,
            minHeight: '100px',
            backgroundColor: '#ffffff'
          }}
          className="editor-container text-slate-800 focus:outline-none"
        />
      </div>

      {/* Terminal Output Area */}
      {(output || isRunning) && (
        <div className="border-t border-slate-200 bg-[#0d1117] text-slate-300 font-mono text-sm p-4 overflow-x-auto max-h-[300px] overflow-y-auto print:hidden">
          {isRunning ? (
            <div className="flex items-center gap-2 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
              <span>Executing in Judge0 Sandbox...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {output.compile_output && (
                <div className="text-amber-400 whitespace-pre-wrap mb-4 pb-4 border-b border-white/10">
                  <div className="text-xs uppercase tracking-wider text-amber-500/70 mb-1">Compiler Output</div>
                  {output.compile_output}
                </div>
              )}
              {output.stdout && (
                <div className="whitespace-pre-wrap text-green-400">
                  {output.stdout}
                </div>
              )}
              {output.stderr && (
                <div className="whitespace-pre-wrap text-red-400">
                  {output.stderr}
                </div>
              )}
              {(!output.stdout && !output.stderr && !output.compile_output) && (
                <div className="text-slate-500 italic">Program finished with no output.</div>
              )}
              
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-4 pt-2 border-t border-white/10">
                <span className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${output.isError ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  {output.status || (output.isError ? 'Error' : 'Success')}
                </span>
                {output.time && <span>⏱ {output.time}s</span>}
                {output.memory && <span>💾 {output.memory} KB</span>}
              </div>
            </div>
          )}
        </div>
      )}
      {/* Print only: stacked code blocks */}
      <div className="hidden print:block space-y-4">
        {availableLangs.map(lang => (
          <div key={lang} className="break-inside-avoid border border-black/20 rounded-lg p-4">
            <h4 className="font-bold text-black border-b border-black/20 mb-2 pb-1">
              {lang === 'cpp' ? 'C++' : lang === 'python' ? 'Python' : 'Java'}
            </h4>
            <pre className="text-sm font-mono text-black whitespace-pre-wrap">
              <code>{cleanCode(codes[lang])}</code>
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LessonRenderer({ blocks }) {
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showResults, setShowResults] = useState({});
  const [quizCompleted, setQuizCompleted] = useState({});
  if (!blocks || !blocks.length) {
    return <div className="text-slate-500 italic">No content available for this lesson yet.</div>;
  }

  return (
    <div className="space-y-6 text-slate-700 leading-relaxed max-w-none">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'heading':
            const HeadingTag = `h${block.level || 2}`;
            return (
              <HeadingTag 
                key={idx} 
                className={`text-slate-900 font-bold tracking-tight first:mt-0 ${
                  block.level === 2 ? 'text-2xl mt-10 mb-4' : 'text-xl mt-8 mb-3'
                }`}
              >
                {block.text}
              </HeadingTag>
            );

          case 'paragraph':
            return (
              <div key={idx} className="mb-4 text-slate-700 text-lg prose max-w-none">
                <ReactMarkdown>{typeof block.text === 'string' ? block.text : JSON.stringify(block.text)}</ReactMarkdown>
              </div>
            );

          case 'list':
            const ListTag = block.style === 'numbered' ? 'ol' : 'ul';
            const listClass = block.style === 'numbered' 
              ? 'list-decimal list-outside ml-6 space-y-2 mb-6' 
              : 'list-disc list-outside ml-6 space-y-2 mb-6 marker:text-brand-600';
            
            return (
              <ListTag key={idx} className={listClass}>
                {block.items?.map((item, i) => (
                  <li key={i} className="pl-2 text-slate-700 text-lg prose max-w-none">
                    <ReactMarkdown>{typeof item === 'string' ? item : JSON.stringify(item)}</ReactMarkdown>
                  </li>
                ))}
              </ListTag>
            );

          case 'code':
            try {
              return (
                <div key={idx} className="my-6 rounded-xl overflow-hidden border border-slate-200 bg-[#f6f8fa] shadow-sm">
                  <CodeBlockWithTabs codes={block.codes || { python: block.code }} />
                </div>
              );
            } catch (err) {
              return (
                <div key={idx} className="my-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-600 font-mono text-sm">
                  Error rendering code block: {err.message}
                </div>
              );
            }

          case 'callout':
            return (
              <div key={idx} className="my-8 bg-brand-50 p-6 border-l-4 border-l-brand-600 relative overflow-hidden group shadow-sm rounded-r-xl">
                <div className="absolute top-0 right-0 p-16 bg-white rounded-full blur-2xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-50"></div>
                <div className="flex items-start gap-4 relative z-10">
                  <div className="text-2xl bg-white p-2 rounded-xl shadow-sm border border-brand-100">
                    {block.emoji || '💡'}
                  </div>
                  <div>
                    {block.title && <h4 className="font-bold text-slate-900 mb-1">{block.title}</h4>}
                    <div className="text-slate-700 prose max-w-none [&>p:first-child]:mt-0">
                      <div>
                        <ReactMarkdown>{typeof block.text === 'string' ? block.text : JSON.stringify(block.text)}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );

          case 'video':
            return (
              <div key={idx} className="my-10 max-w-4xl mx-auto relative group">
                <div className="aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 shadow-lg group-hover:shadow-xl transition-shadow bg-slate-900 print:hidden relative">
                  <iframe
                    src={block.url.replace('watch?v=', 'embed/')}
                    title={block.title || 'Video Player'}
                    className="absolute inset-0 w-full h-full"
                    allowFullScreen
                  ></iframe>
                </div>
                {/* Print only: Video Link */}
                <div className="hidden print:block my-4 p-4 border border-black/20 rounded-lg break-inside-avoid">
                  <p className="font-bold text-black mb-1">Video: {block.title || 'Lesson Video'}</p>
                  <a href={block.url} className="text-blue-600 underline break-all">{block.url}</a>
                </div>
              </div>
            );

          case 'quiz': {
            const isBlockCompleted = quizCompleted[idx];
            let score = 0;
            let totalQuestions = block.questions.length;

            if (isBlockCompleted) {
              block.questions.forEach((q, qIdx) => {
                if (quizAnswers[`${idx}-${qIdx}`] === q.correctAnswer) {
                  score++;
                }
              });
            }

            const checkQuizCompletion = (newShowResults) => {
              // Check if all questions in this block have been answered and checked
              const allAnswered = block.questions.every((_, qIdx) => newShowResults[`${idx}-${qIdx}`] === true);
              if (allAnswered && !quizCompleted[idx]) {
                setQuizCompleted(prev => ({ ...prev, [idx]: true }));
                
                // Save to backend
                if (window.location.pathname.includes('/lesson/')) {
                  const lessonId = window.location.pathname.split('/lesson/')[1];
                  fetch(`/api/courses/lesson/${lessonId}/progress`, {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ 
                      quizBestScore: currentScore,
                      quizAttempts: 1
                    })
                  }).catch(err => console.error("Failed to save score:", err));
                }
              }
            };

            return (
              <div key={idx} className="my-10 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm relative overflow-hidden print:bg-transparent print:border-black/20 print:shadow-none print:p-0">
                <div className="absolute top-0 right-0 p-32 bg-brand-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none print:hidden"></div>
                <h3 className="text-2xl font-bold text-slate-900 mb-8 relative z-10 print:text-black flex items-center gap-3">
                  {block.title || 'Knowledge Check'} 
                  <span className="text-brand-700 text-sm font-semibold bg-brand-100 px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">Quiz</span>
                </h3>
                
                <div className="space-y-8 relative z-10">
                  {block.questions.map((q, qIdx) => {
                    const questionKey = `${idx}-${qIdx}`;
                    const selectedAns = quizAnswers[questionKey];
                    const isSubmitted = showResults[questionKey];
                    const isCorrect = selectedAns === q.correctAnswer;

                    return (
                      <div key={qIdx} className="bg-slate-50 p-6 rounded-xl border border-slate-200 print:bg-transparent print:border-black/20 print:p-4">
                        <p className="font-bold text-slate-900 mb-4 print:text-black">{qIdx + 1}. {typeof q.question === 'string' ? q.question : JSON.stringify(q.question)}</p>
                        <div className="space-y-3">
                          {q.options.map((opt, oIdx) => {
                            let btnClass = "w-full text-left p-4 rounded-lg border transition-all break-words whitespace-pre-wrap print:border-black/20 print:text-black print:bg-transparent print:block print:opacity-100 ";
                            if (isSubmitted) {
                              if (oIdx === q.correctAnswer) btnClass += "border-green-500 bg-green-100 text-green-900 print:bg-green-100 print:text-green-900";
                              else if (oIdx === selectedAns) btnClass += "border-red-300 bg-red-50 text-slate-500 line-through print:bg-red-50 print:text-red-900";
                              else btnClass += "border-slate-200 bg-slate-100 text-slate-400 opacity-50";
                            } else {
                              if (selectedAns === oIdx) btnClass += "border-brand-500 bg-brand-50 text-brand-700 shadow-sm print:bg-brand-50 print:border-brand-500";
                              else btnClass += "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50";
                            }

                            return (
                              <div
                                key={oIdx}
                                role="button"
                                tabIndex={0}
                                onClick={() => !isSubmitted && setQuizAnswers(prev => ({ ...prev, [questionKey]: oIdx }))}
                                className={btnClass + (isSubmitted ? " cursor-default" : " cursor-pointer")}
                              >
                                {typeof opt === 'string' ? opt : JSON.stringify(opt)}
                              </div>
                            );
                          })}
                        </div>
                        
                        {!isSubmitted && selectedAns !== undefined && (
                          <div className="mt-4 flex justify-end print:hidden">
                            <button
                              onClick={() => {
                                const newResults = { ...showResults, [questionKey]: true };
                                setShowResults(newResults);
                                checkQuizCompletion(newResults);
                              }}
                              className="px-6 py-2.5 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-500 transition-colors shadow-md shadow-brand-500/20 transform hover:-translate-y-0.5"
                            >
                              Check Answer
                            </button>
                          </div>
                        )}

                        {isSubmitted && (
                          <div className={`mt-4 p-4 rounded-lg flex gap-3 ${isCorrect ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {isCorrect ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <Info className="w-5 h-5 shrink-0" />}
                            <div>
                              <p className="font-bold mb-1">{isCorrect ? 'Correct! Well done.' : 'Not quite. Let\'s review.'}</p>
                              <p className="text-sm opacity-90">{q.explanation}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Final Results Card */}
                {isBlockCompleted && (
                  <div className="mt-8 p-6 bg-slate-50 border border-brand-200 rounded-xl text-center">
                    <h4 className="text-xl font-bold text-slate-900 mb-2">Knowledge Check Completed</h4>
                    <p className="text-slate-600">
                      You scored <span className="text-lg font-bold text-brand-600 mx-1">{score}</span> out of <span className="font-bold text-slate-900 mx-1">{totalQuestions}</span>
                    </p>
                  </div>
                )}
              </div>
            );
          }

          default:
            return null;
        }
      })}
    </div>
  );
}
