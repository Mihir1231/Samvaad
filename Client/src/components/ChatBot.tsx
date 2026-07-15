import React, { useState, useRef, useEffect } from "react";
import { API_BASE_URL } from "@/lib/api";

// --- SVG Icon Components ---
const Icon = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {children}
  </svg>
);

const MessageCircle = ({ className = '' }: { className?: string }) => (
  <Icon className={className}><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></Icon>
);
const X = ({ className = '' }: { className?: string }) => (
  <Icon className={className}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Icon>
);
const Send = ({ className = '' }: { className?: string }) => (
  <Icon className={className}><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></Icon>
);
const Minus = ({ className = '' }: { className?: string }) => (
  <Icon className={className}><path d="M5 12h14" /></Icon>
);
const Maximize2 = ({ className = '' }: { className?: string }) => (
  <Icon className={className}><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></Icon>
);
const Minimize2 = ({ className = '' }: { className?: string }) => (
  <Icon className={className}><path d="M4 14h6v6" /><path d="M20 10h-6V4" /><path d="M14 10l7-7" /><path d="M3 21l7-7" /></Icon>
);
const Mic = ({ className = '' }: { className?: string }) => (
  <Icon className={className}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></Icon>
);
const MicOff = ({ className = '' }: { className?: string }) => (
  <Icon className={className}><line x1="2" x2="22" y1="2" y2="22" /><path d="M18.5 10.5A4.5 4.5 0 0 0 12 6v-1a3 3 0 0 0-3 3v1" /><path d="M12 18.5a4.49 4.49 0 0 0 4.5-4.5v-2" /><line x1="12" x2="12" y1="19" y2="22" /><path d="M9.5 9.5A4.5 4.5 0 0 0 5 13v1" /></Icon>
);
const Volume2 = ({ className = '' }: { className?: string }) => (
  <Icon className={className}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></Icon>
);
const BotIcon = ({ className = '' }: { className?: string }) => (
    <Icon className={className}>
        <path d="M12 8V4H8" />
        <rect width="16" height="12" x="4" y="8" rx="2" />
        <path d="M2 14h2" />
        <path d="M20 14h2" />
        <path d="M15 13v2" />
        <path d="M9 13v2" />
    </Icon>
);
const UserIcon = ({ className = '' }: { className?: string }) => (
    <Icon className={className}>
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </Icon>
);


// --- Custom Styles and Animations ---
const ChatbotStyles = () => (
    <style>{`
        @keyframes fade-in-up {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .animation-fade-in-up {
            animation: fade-in-up 0.5s ease-out forwards;
        }

        @keyframes gemini-pulse {
            0%, 100% { transform: scaleY(0.4); opacity: 0.5; }
            50% { transform: scaleY(1); opacity: 1; }
        }
        .gemini-bar {
            animation: gemini-pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes launcher-pop-in {
            from { opacity: 0; transform: scale(0.6); }
            to { opacity: 1; transform: scale(1); }
        }
        .launcher-pop-in {
            animation: launcher-pop-in 0.4s ease-out forwards;
        }

        .launcher-track {
            display: grid;
            grid-template-columns: 0fr;
            transition: grid-template-columns 600ms cubic-bezier(0.65, 0, 0.35, 1);
        }
        .launcher-track.is-expanded {
            grid-template-columns: 1fr;
        }
        .launcher-track > div {
            overflow: hidden;
        }
        .launcher-letter {
            display: inline-block;
            opacity: 0;
            transform: translateY(4px);
            transition: opacity 260ms ease-out, transform 260ms ease-out;
            transition-delay: var(--letter-delay, 0ms);
        }
        .launcher-track.is-expanded .launcher-letter {
            opacity: 1;
            transform: translateY(0);
        }
    `}</style>
);


// --- Types ---
interface Option {
  text: string;
  payload: string;
}
interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  options?: Option[];
  sources?: string[];
}

// --- Supported Languages for TTS ---
const supportedLanguages: { [key: string]: string } = {
    'en-IN': 'English',
    'hi-IN': 'हिन्दी',
    'gu-IN': 'ગુજરાતી',
    'bn-IN': 'বাংলা',
    'mr-IN': 'मराठी',
    'ta-IN': 'தமிழ்',
    'te-IN': 'తెలుగు'
};

// --- Visitor Section: Predefined Q&A ---
const visitorQuestions: Option[] = [
  { text: "What are the college timings?", payload: "visitor_q1" },
  { text: "Which documents are required for admission?", payload: "visitor_q2" },
  { text: "What is the fee structure?", payload: "visitor_q3" },
  { text: "Are there any anti-ragging policies?", payload: "visitor_q4" },
  { text: "How is the campus placement?", payload: "visitor_q5" },
  { text: "Ask Other Query", payload: "ask_other_query" },
];

const predefinedVisitorAnswers: { [key: string]: string } = {
  visitor_q1: "The college operates from 9:00 AM to 5:00 PM, Monday to Saturday.",
  visitor_q2: "For admission, you'll need your 10th and 12th mark sheets, school leaving certificate, and passport-sized photographs.",
  visitor_q3: "The detailed fee structure for each course is available on our website's admission page. Please visit ldrp.ac.in/admissions.",
  visitor_q4: "Yes, LDRP has a zero-tolerance policy towards ragging. A dedicated anti-ragging committee is in place to handle any incidents.",
  visitor_q5: "We have a dedicated placement cell that works with top companies. Our placement record has been consistently excellent. More details are on our website.",
};

// --- Gemini Loading Indicator ---
const GeminiLoadingIndicator = () => (
    <div className="flex items-center space-x-2">
        <div className="w-1.5 h-6 bg-blue-500 rounded-full gemini-bar" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-1.5 h-6 bg-blue-400 rounded-full gemini-bar" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-1.5 h-6 bg-blue-300 rounded-full gemini-bar" style={{ animationDelay: '0.3s' }}></div>
        <p className="text-sm font-medium text-gray-500">Samvad is thinking...</p>
    </div>
);


const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [launcherPhase, setLauncherPhase] = useState<'icon' | 'expanded' | 'settled'>('icon');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Welcome to LDRP! To help me assist you, please select your role.",
      isUser: false,
      timestamp: new Date(),
      options: [
        { text: "I am a Student", payload: "role_student" },
        { text: "I am a Parent / Visitor", payload: "role_parent_visitor" }
      ]
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isInputDisabled, setIsInputDisabled] = useState(true);
  const [studentMode, setStudentMode] = useState(false);
  const [isAgentMode, setIsAgentMode] = useState(false);

  const [isListening, setIsListening] = useState(false);
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en-IN');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const [batch, setBatch] = useState("2022-26");
  const [branch, setBranch] = useState("computer_engineering");
  const [semester, setSemester] = useState("Semester 1");
  const [docType, setDocType] = useState("ExamForm");

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const expandTimer = setTimeout(() => setLauncherPhase('expanded'), 600);
    const settleTimer = setTimeout(() => setLauncherPhase('settled'), 3800);
    return () => { clearTimeout(expandTimer); clearTimeout(settleTimer); };
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const updateVoices = () => {
      if ('speechSynthesis' in window) setAvailableVoices(window.speechSynthesis.getVoices());
    };
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
      updateVoices();
    }
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.onresult = (event: any) => {
        setInputMessage(event.results[0][0].transcript);
        setIsListening(false);
      };
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
      setIsVoiceSupported(true);
    }
  }, []);
  
  const speakText = React.useCallback((text: string, lang: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    const voice = availableVoices.find(v => v.lang === lang);
    if (voice) utterance.voice = voice;
    utterance.onerror = (e) => console.error("Speech synthesis error:", e);
    window.speechSynthesis.speak(utterance);
  }, [availableVoices]);

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };
  
  const resetToMainMenu = () => {
    const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "How can I help you next? Please select your role or end the chat.",
        isUser: false,
        timestamp: new Date(),
        options: [
            { text: "I am a Student", payload: "role_student" },
            { text: "I am a Parent / Visitor", payload: "role_parent_visitor" },
            { text: "End Chat", payload: "end_chat" }
        ]
    };
    setMessages(prev => [...prev, botResponse]);
    setStudentMode(false);
    setIsAgentMode(false);
    setIsInputDisabled(true);
  };
  
  const resetToVisitorStart = () => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "You can select another question or ask a different query.",
        isUser: false,
        timestamp: new Date(),
        options: [...visitorQuestions, { text: "End Chat", payload: "end_chat" }]
      };
      setMessages(prev => [...prev, botResponse]);
  };

  const handleOptionClick = (option: Option) => {
    const userMessage: Message = { id: Date.now().toString(), text: option.text, isUser: true, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setIsInputDisabled(true);
    setIsAgentMode(false);

    setTimeout(() => {
      let botResponse: Message;
      if (option.payload === "role_parent_visitor") {
        botResponse = { id: (Date.now() + 1).toString(), text: "Welcome! Please select a question below, or ask your own.", isUser: false, timestamp: new Date(), options: visitorQuestions };
        setStudentMode(false);
        setMessages(prev => [...prev, botResponse]);
      } else if (option.payload === "role_student") {
        botResponse = { id: (Date.now() + 1).toString(), text: "Great! Please select your details below, then type your question.", isUser: false, timestamp: new Date() };
        setStudentMode(true);
        setIsInputDisabled(false);
        setMessages(prev => [...prev, botResponse]);
      } else if (predefinedVisitorAnswers[option.payload]) {
          const answerText = predefinedVisitorAnswers[option.payload];
          botResponse = { id: (Date.now() + 1).toString(), text: answerText, isUser: false, timestamp: new Date() };
          setMessages(prev => [...prev, botResponse]);
          setTimeout(() => resetToVisitorStart(), 1000);
      } else if (option.payload === "ask_other_query") {
          botResponse = { id: (Date.now() + 1).toString(), text: "The agent is now active. Please type your question below.", isUser: false, timestamp: new Date() };
          setIsAgentMode(true);
          setIsInputDisabled(false);
          setMessages(prev => [...prev, botResponse]);
      } else if (option.payload === "end_chat") {
        const endText = "Thank you! Have a great day.";
        botResponse = { id: (Date.now() + 1).toString(), text: endText, isUser: false, timestamp: new Date() };
        setIsInputDisabled(true);
        setMessages(prev => [...prev, botResponse]);
      } else {
        botResponse = { id: (Date.now() + 1).toString(), text: "I'm not sure how to handle that yet.", isUser: false, timestamp: new Date() };
        setMessages(prev => [...prev, botResponse]);
      }
      setIsLoading(false);
    }, 800);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    const userMessage: Message = { id: Date.now().toString(), text: inputMessage, isUser: true, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setIsInputDisabled(true);

    try {
        let endpoint = "";
        let payload: object = {};
        if (studentMode) {
            endpoint = `${API_BASE_URL}/student_query`;
            payload = { batch, branch, semester, doc_type: docType, question: userMessage.text };
        } else if (isAgentMode) {
            endpoint = `${API_BASE_URL}/rag_query`;
            payload = { question: userMessage.text };
        }

        if (endpoint) {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error(`Network response was not ok from ${endpoint}`);
            const data = await res.json();
            const answerText = data.answer || "Sorry, I couldn't find an answer.";
            
            const botMessage: Message = { id: (Date.now() + 1).toString(), text: answerText, isUser: false, timestamp: new Date(), sources: data.sources || [] };
            setMessages(prev => [...prev, botMessage]);

            if (studentMode) {
                setTimeout(() => {
                    setIsInputDisabled(false);
                    resetToMainMenu();
                }, 1000);
            } else if (isAgentMode) {
                setTimeout(() => {
                    setIsInputDisabled(true);
                    resetToVisitorStart();
                }, 1000);
            }
        }
    } catch (err) {
        console.error("Fetch error:", err);
        const errorText = "Sorry, I'm having trouble connecting to the server.";
        const errorMessage: Message = { id: (Date.now() + 1).toString(), text: `⚠ ${errorText}`, isUser: false, timestamp: new Date() };
        setMessages(prev => [...prev, errorMessage]);
    }
    setIsLoading(false);
    if (studentMode) setIsInputDisabled(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getContainerClasses = () => {
    let classes = 'z-50 transition-all duration-300 ease-in-out font-sans ';
    if (isMaximized) classes += 'fixed inset-0 w-full h-full';
    else {
        classes += 'fixed bottom-6 right-6 ';
        if (isMinimized) classes += 'w-80 h-14';
        else classes += 'w-[26rem] h-[40rem] max-w-[90vw] max-h-[80vh]';
    }
    return classes;
  };

  const getPlaceholderText = () => {
    if (isInputDisabled || isLoading) return "Please select an option";
    if (isAgentMode) return "Ask the agent anything...";
    if (studentMode) return "Type your question here...";
    return "Please select an option";
  };
  
    if (!isOpen) {
    const isExpanded = launcherPhase === 'expanded';
    const label = "Ask Samvaad";
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <ChatbotStyles />
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open Chat"
          className="launcher-pop-in flex items-center h-16 rounded-full bg-gradient-to-br from-blue-800 to-blue-900 shadow-lg hover:shadow-xl hover:shadow-blue-700/30 hover:scale-105 transition-[box-shadow,transform] duration-300"
        >
          <span className={`launcher-track ${isExpanded ? 'is-expanded' : ''}`}>
            <div>
              <span className="flex items-center pl-5 pr-1 text-white font-semibold whitespace-nowrap">
                {label.split('').map((char, i) => (
                  <span
                    key={i}
                    className="launcher-letter"
                    style={{ '--letter-delay': `${isExpanded ? 150 + i * 35 : (label.length - i) * 20}ms` } as React.CSSProperties}
                  >
                    {char === ' ' ? ' ' : char}
                  </span>
                ))}
              </span>
            </div>
          </span>
          <span className="flex items-center justify-center h-16 w-16 flex-shrink-0">
            <MessageCircle className="h-8 w-8 text-white" />
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className={getContainerClasses()}>
      <ChatbotStyles />
      <div className="w-full h-full bg-white rounded-xl shadow-2xl shadow-blue-500/10 border border-gray-200 flex flex-col overflow-hidden">
        <header className="flex flex-row items-center justify-between p-3 bg-gradient-to-br from-slate-900 to-blue-900 text-white rounded-t-xl cursor-pointer flex-shrink-0" onClick={() => isMinimized && setIsMinimized(false)}>
          <div className="flex items-center space-x-3">
            <MessageCircle className="h-6 w-6" />
            <h3 className="font-bold text-md">ASK Samvaad </h3>
          </div>
          <div className="flex items-center space-x-1">
            {isVoiceSupported && (
              <div className="relative">
                <select value={selectedLanguage} onChange={e => setSelectedLanguage(e.target.value)} className="bg-white/10 text-white text-xs rounded-md py-1 px-2 focus:outline-none focus:ring-2 focus:ring-white/50 appearance-none cursor-pointer" aria-label="Select language for voice output">
                    {Object.entries(supportedLanguages)
                        .filter(([code]) => availableVoices.some(v => v.lang === code))
                        .map(([code, name]) => (<option key={code} value={code} className="bg-gray-800 text-white">{name}</option>))}
                </select>
              </div>
            )}
            <button onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} className="p-2 rounded-full hover:bg-white/20 transition-colors" title="Minimize"><Minus className="h-4 w-4" /></button>
            <button onClick={(e) => { e.stopPropagation(); setIsMaximized(!isMaximized); }} className="p-2 rounded-full hover:bg-white/20 transition-colors" title={isMaximized ? "Restore" : "Maximize"}>{isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}</button>
            <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); stopSpeaking(); }} className="p-2 rounded-full hover:bg-white/20 transition-colors" title="Close"><X className="h-4 w-4" /></button>
          </div>
        </header>

        {!isMinimized && (
          <>
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50" ref={scrollAreaRef}>
              <div className="space-y-6">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex items-end gap-2 animation-fade-in-up ${msg.isUser ? "justify-end" : "justify-start"}`}>
                    {!msg.isUser && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"><BotIcon className="w-5 h-5 text-gray-600" /></div>}
                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm relative group ${msg.isUser ? "bg-blue-800 text-white rounded-br-none shadow-md" : "bg-white text-gray-800 rounded-bl-none shadow-sm border"}`}>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      {!msg.isUser && isVoiceSupported && (<button onClick={() => speakText(msg.text, selectedLanguage)} className="absolute -right-9 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity" title="Read aloud"><Volume2 className="h-4 w-4" /></button>)}
                    </div>
                     {msg.isUser && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"><UserIcon className="w-5 h-5 text-gray-600" /></div>}
                  </div>
                ))}
                
                {messages[messages.length - 1]?.options && !isLoading && (
                  <div className="flex flex-wrap gap-2 mt-3 justify-start animation-fade-in-up">
                    {messages[messages.length - 1].options!.map(option => (<button key={option.payload} className="text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-full px-4 py-1.5 transition-all hover:scale-105" onClick={() => handleOptionClick(option)}>{option.text}</button>))}
                  </div>
                )}

                {studentMode && !isInputDisabled && (
                  <div className="mt-4 space-y-3 bg-white p-4 rounded-lg border animation-fade-in-up">
                    <h4 className="font-semibold text-sm text-gray-800 mb-3">Please provide your details:</h4>
                    {[{label: "Batch", value: batch, setter: setBatch, options: ["2022-26", "2023-27"]}, {label: "Branch", value: branch, setter: setBranch, options: ["computer_engineering", "information_technology", "mechanical_engineering", "electrical_communication", "electrical_engineering", "civil_engineering"]}, {label: "Semester", value: semester, setter: setSemester, options: Array.from({length: 8}, (_, i) => `Semester ${i + 1}`)}, {label: "Document Type", value: docType, setter: setDocType, options: ["ExamForm", "FeesNotice", "ExamTimetable", "Circular", "EventInformation", "ClassTimeTable", "SeminarInformation", "GeneralNotice", "GeneralInformation"]}].map(item => (
                        <select key={item.label} value={item.value} onChange={e => item.setter(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-700 focus:border-blue-700">
                           {item.options.map(opt => <option key={opt} value={opt}>{opt.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                        </select>
                    ))}
                  </div>
                )}

                {isLoading && (
                   <div className="flex justify-start animation-fade-in-up">
                        <div className="flex items-end gap-2">
                             <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"><BotIcon className="w-5 h-5 text-gray-600" /></div>
                             <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm border">
                                <GeminiLoadingIndicator />
                             </div>
                        </div>
                   </div>
                )}
              </div>
            </div>
            
            <div className="p-3 border-t bg-white flex items-center space-x-2 flex-shrink-0">
              <div className="flex-1 relative">
                <input value={inputMessage} onChange={e => setInputMessage(e.target.value)} onKeyPress={handleKeyPress} placeholder={getPlaceholderText()} disabled={isInputDisabled || isLoading} className="w-full text-sm p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-700 focus:border-blue-700 disabled:bg-gray-100 transition-shadow" />
                {isVoiceSupported && !isInputDisabled && (
                  <button onClick={isListening ? stopListening : startListening} className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-500 hover:text-blue-700'}`} title={isListening ? "Stop listening" : "Start voice input"}>
                    {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </button>
                )}
              </div>
              <button onClick={handleSendMessage} disabled={isInputDisabled || isLoading || !inputMessage.trim()} className="p-3 w-12 h-12 rounded-lg bg-blue-800 hover:bg-blue-900 active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center transition-all">
                <Send className="h-5 w-5 text-white" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatBot;