import React, { useState, useEffect, useRef } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { Mic, MicOff, Sparkles, Volume2 } from 'lucide-react';

const DashboardLayout = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  
  // Voice Assistant states
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [assistantMsg, setAssistantMsg] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check speech recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setAssistantMsg('Listening for commands...');
        setTranscript('');
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onerror = (e) => {
        console.error('Speech recognition error', e);
        setIsListening(false);
        setAssistantMsg('Voice error occurred.');
      };

      rec.onresult = (event) => {
        const text = event.results[0][0].transcript.toLowerCase().trim();
        setTranscript(text);
        handleVoiceCommand(text);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const handleVoiceCommand = (command) => {
    let reply = '';
    let targetPath = '';

    if (command.includes('dashboard') || command.includes('home')) {
      reply = 'Opening Dashboard';
      targetPath = '/dashboard';
    } else if (command.includes('course') || command.includes('subject')) {
      reply = 'Opening My Courses';
      targetPath = '/courses';
    } else if (command.includes('career') || command.includes('advisor')) {
      reply = 'Opening Career Advisor';
      targetPath = '/career-advisor';
    } else if (command.includes('planner') || command.includes('study')) {
      reply = 'Opening Study Planner';
      targetPath = '/study-planner';
    } else if (command.includes('navigation') || command.includes('map') || command.includes('campus')) {
      reply = 'Opening Campus Navigation';
      targetPath = '/campus-navigation';
    } else if (command.includes('chat') || command.includes('message') || command.includes('teacher')) {
      reply = 'Opening Chat';
      targetPath = '/chat';
    } else if (command.includes('notice') || command.includes('notification')) {
      reply = 'Opening Notices';
      targetPath = '/notices';
    } else if (command.includes('digital id') || command.includes('id card') || command.includes('student id')) {
      reply = 'Opening Digital ID';
      targetPath = '/digital-id';
    } else if (command.includes('prep') || command.includes('exam prep') || command.includes('practice')) {
      reply = 'Opening Exam Prep Center';
      targetPath = '/exam-prep';
    } else if (command.includes('predictor') || command.includes('forecast') || command.includes('gpa')) {
      reply = 'Opening Semester Predictor';
      targetPath = '/semester-predictor';
    } else {
      reply = `Sorry, command "${command}" not recognized. Try "Open Dashboard" or "Open Chat".`;
    }

    setAssistantMsg(reply);
    speakUtterance(reply);

    if (targetPath) {
      setTimeout(() => {
        navigate(targetPath);
        setAssistantMsg('');
      }, 1000);
    }
  };

  const speakUtterance = (text) => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not fully supported in this browser. Please use Chrome/Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden relative" style={{ background: '#F8FAFC', color: '#0F172A' }}>
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Pane */}
      <div className="flex flex-col flex-1 h-full min-w-0 relative">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-8 relative" style={{ background: '#F8FAFC' }}>
          <Outlet />
        </main>
      </div>

      {/* Voice Assistant Floating MIC Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
        {/* Tooltip Overlay */}
        {(assistantMsg || transcript) && (
          <div className="pointer-events-auto bg-slate-900 border border-slate-800 text-white p-3.5 rounded-2xl shadow-xl max-w-xs text-xs space-y-1 animate-scale flex flex-col">
            <span className="text-[9px] font-bold text-primary uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-secondary animate-pulse" />
              AI Voice Assistant
            </span>
            {transcript && <p className="text-slate-400 font-medium">Hear: "{transcript}"</p>}
            <p className="font-bold text-white leading-normal flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-success shrink-0" />
              {assistantMsg}
            </p>
          </div>
        )}

        <button
          onClick={toggleListening}
          className={`pointer-events-auto p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer ${
            isListening
              ? 'bg-danger text-white animate-pulse shadow-danger/25'
              : 'bg-primary text-white shadow-primary/25 hover:bg-primary-hover'
          }`}
          title="Talk to AI Voice Assistant"
        >
          {isListening ? <Mic className="w-5.5 h-5.5" /> : <MicOff className="w-5.5 h-5.5" />}
        </button>
      </div>
    </div>
  );
};

export default DashboardLayout;
