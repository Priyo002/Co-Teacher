import { useState, useRef, useEffect } from 'react';
import { Maximize2, Code2, Play, Loader2, Settings, Keyboard, Plus, TerminalSquare, ChevronDown, Check as CheckIcon, XCircle } from 'lucide-react';
import EditorComponent from 'react-simple-code-editor';
const Editor = EditorComponent.default || EditorComponent;
import Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/themes/prism.css'; // Standard Light theme for editor
import { useApi } from '../hooks/useApi';

const LANGUAGES = [
  { id: 'python', name: 'Python 3', defaultCode: 'print("Hello, World!")' },
  { id: 'javascript', name: 'JavaScript (Node.js)', defaultCode: 'console.log("Hello, World!");' },
  { id: 'java', name: 'Java', defaultCode: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}' },
  { id: 'cpp', name: 'C++', defaultCode: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}' },
];

export default function IDEPage() {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('ide_language');
    if (saved) {
      const found = LANGUAGES.find(l => l.id === saved);
      if (found) return found;
    }
    return LANGUAGES[0];
  });
  
  const [code, setCode] = useState(() => {
    try {
      const savedCodes = JSON.parse(localStorage.getItem('ide_codes') || '{}');
      const savedLang = localStorage.getItem('ide_language');
      const currentLang = savedLang ? (LANGUAGES.find(l => l.id === savedLang) || LANGUAGES[0]) : LANGUAGES[0];
      return savedCodes[currentLang.id] || currentLang.defaultCode;
    } catch {
      return LANGUAGES[0].defaultCode;
    }
  });
  const [mode, setMode] = useState('stdin'); // 'stdin' | 'testcases'
  const [stdin, setStdin] = useState('');
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [testCases, setTestCases] = useState([]);
  const [activeTestCase, setActiveTestCase] = useState(0);
  const [rightPanelWidth, setRightPanelWidth] = useState(500);
  const dropdownRef = useRef(null);
  const containerRef = useRef(null);
  
  const fetchApi = useApi();

  useEffect(() => {
    localStorage.setItem('ide_language', language.id);
  }, [language]);

  useEffect(() => {
    try {
      const savedCodes = JSON.parse(localStorage.getItem('ide_codes') || '{}');
      savedCodes[language.id] = code;
      localStorage.setItem('ide_codes', JSON.stringify(savedCodes));
    } catch (e) {
      console.error("Failed to save code to localStorage", e);
    }
  }, [code, language]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsLangOpen(false);
      }
    };
    
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('run-code-btn')?.click();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setMode(prev => prev === 'stdin' ? 'testcases' : 'stdin');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setShowSettings(prev => !prev);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLanguageChange = (langId) => {
    const newLang = LANGUAGES.find(l => l.id === langId);
    setLanguage(newLang);
    
    try {
      const savedCodes = JSON.parse(localStorage.getItem('ide_codes') || '{}');
      setCode(savedCodes[newLang.id] || newLang.defaultCode);
    } catch {
      setCode(newLang.defaultCode);
    }
    
    setOutput(null);
    setIsLangOpen(false);
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    const isTestCaseMode = mode === 'testcases' && testCases.length > 0;
    
    if (isTestCaseMode) {
      const newCases = [...testCases];
      newCases[activeTestCase] = { ...newCases[activeTestCase], actualOutput: { status: 'Running...' } };
      setTestCases(newCases);
    } else {
      setOutput({ status: 'Running...' });
    }
    
    const currentStdin = isTestCaseMode ? testCases[activeTestCase].input : stdin;

    try {
      const res = await fetchApi('/execute', {
        method: 'POST',
        body: JSON.stringify({
          language: language.id,
          code,
          stdin: currentStdin
        })
      });

      if (res && res.success) {
        if (isTestCaseMode) {
          const newCases = [...testCases];
          newCases[activeTestCase] = { ...newCases[activeTestCase], actualOutput: res.result };
          setTestCases(newCases);
        } else {
          setOutput(res.result);
        }
      } else {
        const errorOut = { isError: true, stderr: 'Execution failed.' };
        if (isTestCaseMode) {
          const newCases = [...testCases];
          newCases[activeTestCase] = { ...newCases[activeTestCase], actualOutput: errorOut };
          setTestCases(newCases);
        } else {
          setOutput(errorOut);
        }
      }
    } catch (error) {
      const errorOut = { isError: true, stderr: error.message };
      if (isTestCaseMode) {
        const newCases = [...testCases];
        newCases[activeTestCase] = { ...newCases[activeTestCase], actualOutput: errorOut };
        setTestCases(newCases);
      } else {
        setOutput(errorOut);
      }
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-white text-slate-800 font-sans">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold">
              <Code2 className="w-5 h-5 text-brand-500" />
              AZ IDE
            </div>
          </div>
          
          {/* Mode Toggle */}
          <div className="flex items-center gap-3 text-sm">
            <button 
              onClick={() => setMode('stdin')}
              className={`focus:outline-none ${mode === 'stdin' ? 'text-slate-800 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
            >
              stdin/stdout
            </button>
            <button 
              onClick={() => setMode(mode === 'stdin' ? 'testcases' : 'stdin')}
              className="relative inline-flex h-5 w-10 items-center rounded-full bg-slate-200 border border-slate-300 transition-colors focus:outline-none"
            >
              <span 
                className="inline-block h-3.5 w-3.5 transform rounded-full bg-brand-500 transition-transform duration-200 ease-in-out" 
                style={{ transform: mode === 'testcases' ? 'translateX(22px)' : 'translateX(3px)' }}
              />
            </button>
            <button 
              onClick={() => setMode('testcases')}
              className={`focus:outline-none ${mode === 'testcases' ? 'text-slate-800 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
            >
              test cases
            </button>
          </div>
          
          {/* Custom Language Selector */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-1.5 focus:outline-none hover:bg-slate-50 transition-colors min-w-[140px] justify-between shadow-sm"
            >
              {language.name}
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {isLangOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 rounded-xl overflow-hidden z-50 shadow-2xl border border-white/10"
                   style={{ 
                     background: 'rgba(40, 40, 40, 0.85)', 
                     backdropFilter: 'blur(12px)',
                     WebkitBackdropFilter: 'blur(12px)',
                     boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)'
                   }}>
                <div className="py-1">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.id}
                      onClick={() => handleLanguageChange(lang.id)}
                      className="w-full text-left px-3 py-2 text-[15px] font-medium text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                    >
                      <div className="w-4 flex items-center justify-center">
                        {language.id === lang.id && <CheckIcon className="w-4 h-4 text-white" strokeWidth={3} />}
                      </div>
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowKeyboard(true)}
            className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors border border-slate-200 rounded-lg bg-white shadow-sm"
          >
            <Keyboard className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors border border-slate-200 rounded-lg bg-white shadow-sm"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button 
            id="run-code-btn"
            onClick={handleRunCode}
            disabled={isRunning}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-1.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 shadow-md hover:shadow-lg"
          >
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            Run
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden" ref={containerRef}>
        {/* Left: Code Editor */}
        <div className="flex-1 overflow-hidden flex flex-col bg-white">
          <div className="flex-1 overflow-y-auto custom-scrollbar relative flex">
            {/* Line Numbers */}
            <div 
              className="flex flex-col text-right pr-3 pt-[16px] pb-[16px] select-none text-slate-400 bg-slate-50 border-r border-slate-200 shrink-0"
              style={{
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                fontSize: `${fontSize}px`,
                lineHeight: 1.5,
                minWidth: '48px',
              }}
            >
              {code.split('\n').map((_, i) => (
                <div key={i + 1} className="opacity-60 hover:opacity-100 transition-opacity">
                  {i + 1}
                </div>
              ))}
            </div>

            <div className="flex-1 relative">
              <Editor
                value={code}
                onValueChange={setCode}
                highlight={c => Prism.highlight(c, Prism.languages[language.id === 'cpp' ? 'cpp' : language.id === 'java' ? 'java' : language.id === 'python' ? 'python' : 'javascript'] || Prism.languages.javascript, language.id)}
                padding={16}
                className="font-mono min-h-full"
                style={{
                  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                  backgroundColor: 'transparent',
                  fontSize: `${fontSize}px`,
                  lineHeight: 1.5,
                  color: '#333'
                }}
                textareaClassName="focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Resizable Divider */}
        <div 
          className="w-1.5 bg-slate-200 hover:bg-brand-400 cursor-col-resize transition-colors z-10 shrink-0"
          onMouseDown={(e) => {
            e.preventDefault();
            const handleMouseMove = (moveEvent) => {
              if (containerRef.current) {
                const containerRect = containerRef.current.getBoundingClientRect();
                const newWidth = containerRect.right - moveEvent.clientX;
                if (newWidth > 300 && newWidth < containerRect.width - 300) {
                  setRightPanelWidth(newWidth);
                }
              }
            };
            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
              document.body.style.cursor = 'default';
            };
            document.body.style.cursor = 'col-resize';
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        />

        {/* Right: Input/Output & Test Cases */}
        <div className="flex flex-col bg-slate-50 shrink-0" style={{ width: rightPanelWidth }}>
          {mode === 'stdin' ? (
            <>
              {/* STDIN Panel */}
              <div className="flex-1 flex flex-col border-b border-slate-200">
                <div className="px-4 py-2 border-b border-slate-200 flex items-center gap-2 text-xs font-semibold tracking-widest text-slate-400 uppercase">
                  <TerminalSquare className="w-3.5 h-3.5" />
                  STDIN
                </div>
                <textarea 
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  placeholder="Enter input..."
                  className="flex-1 bg-transparent text-slate-700 p-4 resize-none focus:outline-none font-mono text-sm"
                  spellCheck={false}
                />
              </div>
              
              {/* STDOUT Panel */}
              <div className="flex-1 flex flex-col">
                <div className="px-4 py-2 border-b border-slate-200 flex items-center gap-2 text-xs font-semibold tracking-widest text-slate-400 uppercase">
                  <TerminalSquare className="w-3.5 h-3.5" />
                  OUTPUT
                </div>
                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar font-mono text-sm">
                  {!output ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                      <TerminalSquare className="w-12 h-12 opacity-30" />
                      Run your code to see output
                    </div>
                  ) : output.status === 'Running...' ? (
                    <div className="text-brand-500 animate-pulse">Running...</div>
                  ) : (
                    <div className="space-y-4">
                      {output.compile_output && (
                        <div>
                          <div className="text-xs text-amber-600/70 mb-1">Compiler Output</div>
                          <div className="text-amber-600 whitespace-pre-wrap">{output.compile_output}</div>
                        </div>
                      )}
                      {output.stdout && (
                        <div className="text-slate-700 whitespace-pre-wrap">{output.stdout}</div>
                      )}
                      {output.stderr && (
                        <div className="text-red-500 whitespace-pre-wrap">{output.stderr}</div>
                      )}
                      {(!output.stdout && !output.stderr && !output.compile_output) && (
                        <div className="text-slate-400 italic">Program finished with no output.</div>
                      )}
                      
                      <div className="pt-4 mt-4 border-t border-slate-200 flex gap-4 text-xs">
                        <span className={output.isError ? 'text-red-500 font-semibold' : 'text-green-600 font-semibold'}>
                          Status: {output.status || (output.isError ? 'Error' : 'Success')}
                        </span>
                        {output.time && <span className="text-slate-500">Time: {output.time}s</span>}
                        {output.memory && <span className="text-slate-500">Memory: {output.memory} KB</span>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Test Cases Panel */
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
              {testCases.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                  <TerminalSquare className="w-12 h-12 opacity-30" />
                  No test cases loaded
                  <button 
                    onClick={() => {
                      setTestCases([{ id: Date.now(), input: '', expectedOutput: '' }]);
                      setActiveTestCase(0);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-sm transition-colors text-slate-700 shadow-sm mt-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Test Case
                  </button>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  {/* Tabs */}
                  <div className="flex items-center border-b border-slate-200 bg-slate-50 px-2 pt-2 gap-1 overflow-x-auto custom-scrollbar">
                    {testCases.map((tc, idx) => (
                      <button
                        key={tc.id}
                        onClick={() => setActiveTestCase(idx)}
                        className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap flex items-center gap-2 ${
                          activeTestCase === idx 
                            ? 'bg-white text-brand-600 border border-b-0 border-slate-200' 
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-transparent border-b-0'
                        }`}
                        style={{ marginBottom: activeTestCase === idx ? '-1px' : '0' }}
                      >
                        Case {idx + 1}
                      </button>
                    ))}
                    <button 
                      onClick={() => {
                        setTestCases([...testCases, { id: Date.now(), input: '', expectedOutput: '' }]);
                        setActiveTestCase(testCases.length);
                      }}
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-t-lg transition-colors mb-[1px]"
                      title="Add Test Case"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Test Case Editor */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold tracking-widest text-slate-500 uppercase">Input</label>
                      <textarea
                        value={testCases[activeTestCase].input}
                        onChange={(e) => {
                          const newCases = [...testCases];
                          newCases[activeTestCase].input = e.target.value;
                          setTestCases(newCases);
                        }}
                        className="w-full bg-slate-100/50 border border-slate-200/80 rounded-xl p-4 font-mono text-sm text-slate-700 resize-y min-h-[100px] focus:outline-none focus:border-brand-400 focus:bg-white focus:shadow-sm transition-all"
                        placeholder="Enter test case input..."
                        spellCheck={false}
                      />
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold tracking-widest text-slate-500 uppercase">Expected Output</label>
                      <textarea
                        value={testCases[activeTestCase].expectedOutput}
                        onChange={(e) => {
                          const newCases = [...testCases];
                          newCases[activeTestCase].expectedOutput = e.target.value;
                          setTestCases(newCases);
                        }}
                        className="w-full bg-slate-100/50 border border-slate-200/80 rounded-xl p-4 font-mono text-sm text-slate-700 resize-y min-h-[100px] focus:outline-none focus:border-brand-400 focus:bg-white focus:shadow-sm transition-all"
                        placeholder="Expected output (optional)..."
                        spellCheck={false}
                      />
                    </div>
                    
                    {/* Actual Output (Shows when code is run) */}
                    {testCases[activeTestCase].actualOutput && (
                      <div className="flex flex-col gap-2 pt-6 mt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold tracking-widest text-slate-500 uppercase">Actual Output</label>
                          <div className="flex items-center gap-3">
                            {testCases[activeTestCase].expectedOutput?.trim() && testCases[activeTestCase].actualOutput.stdout !== undefined && testCases[activeTestCase].actualOutput.status !== 'Running...' && (
                              <span className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wide uppercase ${
                                testCases[activeTestCase].expectedOutput.trim() === testCases[activeTestCase].actualOutput.stdout.trim()
                                  ? 'bg-green-100 text-green-700 border border-green-200'
                                  : 'bg-red-100 text-red-700 border border-red-200'
                              }`}>
                                {testCases[activeTestCase].expectedOutput.trim() === testCases[activeTestCase].actualOutput.stdout.trim() ? 'Passed' : 'Failed'}
                              </span>
                            )}
                            {testCases[activeTestCase].actualOutput.status && testCases[activeTestCase].actualOutput.status !== 'Running...' && (
                              <span className={`text-xs font-bold ${testCases[activeTestCase].actualOutput.isError ? 'text-red-500' : 'text-green-600'}`}>
                                {testCases[activeTestCase].actualOutput.status || (testCases[activeTestCase].actualOutput.isError ? 'Error' : 'Success')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-sm min-h-[100px] overflow-y-auto shadow-inner">
                          {testCases[activeTestCase].actualOutput.status === 'Running...' ? (
                            <div className="text-brand-400 animate-pulse flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Running...
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {testCases[activeTestCase].actualOutput.compile_output && (
                                <div>
                                  <div className="text-xs text-amber-500/70 mb-1">Compiler Output</div>
                                  <div className="text-amber-500 whitespace-pre-wrap">{testCases[activeTestCase].actualOutput.compile_output}</div>
                                </div>
                              )}
                              {testCases[activeTestCase].actualOutput.stdout && (
                                <div className="text-slate-100 whitespace-pre-wrap">{testCases[activeTestCase].actualOutput.stdout}</div>
                              )}
                              {testCases[activeTestCase].actualOutput.stderr && (
                                <div className="text-red-400 whitespace-pre-wrap">{testCases[activeTestCase].actualOutput.stderr}</div>
                              )}
                              {(!testCases[activeTestCase].actualOutput.stdout && !testCases[activeTestCase].actualOutput.stderr && !testCases[activeTestCase].actualOutput.compile_output) && (
                                <div className="text-slate-500 italic">Program finished with no output.</div>
                              )}
                              
                              <div className="pt-3 mt-3 border-t border-slate-800 flex gap-4 text-xs">
                                {testCases[activeTestCase].actualOutput.time && <span className="text-slate-400">Time: {testCases[activeTestCase].actualOutput.time}s</span>}
                                {testCases[activeTestCase].actualOutput.memory && <span className="text-slate-400">Memory: {testCases[activeTestCase].actualOutput.memory} KB</span>}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-md transition-opacity" onClick={() => setShowSettings(false)}></div>
          <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-white/50 transform transition-all">
            <div className="px-6 py-5 border-b border-slate-200/50 flex items-center justify-between bg-white/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                <Settings className="w-5 h-5 text-brand-500" />
                Editor Settings
              </h3>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-700 transition-colors bg-white hover:bg-slate-100 p-1 rounded-full shadow-sm">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 space-y-8 text-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 font-semibold tracking-wide">Font Size</label>
                  <span className="bg-brand-50 text-brand-700 px-3 py-1 rounded-full font-mono font-bold text-xs shadow-inner">{fontSize}px</span>
                </div>
                <input 
                  type="range" 
                  min="12" 
                  max="24" 
                  value={fontSize} 
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-500"
                />
                <div className="flex justify-between text-xs font-medium text-slate-400 px-1">
                  <span>Small</span>
                  <span>Large</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showKeyboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-md transition-opacity" onClick={() => setShowKeyboard(false)}></div>
          <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white/50 transform transition-all">
            <div className="px-6 py-5 border-b border-slate-200/50 flex items-center justify-between bg-white/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                <Keyboard className="w-5 h-5 text-brand-500" />
                Keyboard Shortcuts
              </h3>
              <button onClick={() => setShowKeyboard(false)} className="text-slate-400 hover:text-slate-700 transition-colors bg-white hover:bg-slate-100 p-1 rounded-full shadow-sm">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center py-3 px-4 hover:bg-white/60 rounded-xl transition-colors group">
                  <span className="text-slate-700 font-medium group-hover:text-brand-600 transition-colors">Run Code</span>
                  <div className="flex gap-1.5 shadow-sm bg-white p-1 rounded-lg border border-slate-100">
                    <kbd className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-slate-600 font-mono text-xs font-bold shadow-sm">Ctrl</kbd>
                    <span className="text-slate-400 flex items-center">+</span>
                    <kbd className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-slate-600 font-mono text-xs font-bold shadow-sm">Enter</kbd>
                  </div>
                </div>
                <div className="flex justify-between items-center py-3 px-4 hover:bg-white/60 rounded-xl transition-colors group">
                  <span className="text-slate-700 font-medium group-hover:text-brand-600 transition-colors">Toggle STDIN/Test Cases</span>
                  <div className="flex gap-1.5 shadow-sm bg-white p-1 rounded-lg border border-slate-100">
                    <kbd className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-slate-600 font-mono text-xs font-bold shadow-sm">Ctrl</kbd>
                    <span className="text-slate-400 flex items-center">+</span>
                    <kbd className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-slate-600 font-mono text-xs font-bold shadow-sm">M</kbd>
                  </div>
                </div>
                <div className="flex justify-between items-center py-3 px-4 hover:bg-white/60 rounded-xl transition-colors group">
                  <span className="text-slate-700 font-medium group-hover:text-brand-600 transition-colors">Open Settings</span>
                  <div className="flex gap-1.5 shadow-sm bg-white p-1 rounded-lg border border-slate-100">
                    <kbd className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-slate-600 font-mono text-xs font-bold shadow-sm">Ctrl</kbd>
                    <span className="text-slate-400 flex items-center">+</span>
                    <kbd className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-slate-600 font-mono text-xs font-bold shadow-sm">,</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
