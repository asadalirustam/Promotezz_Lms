import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';
import {
  MessageSquare,
  Send,
  Sparkles,
  Paperclip,
  Languages,
  CheckCircle,
  HelpCircle,
  FileText,
  Volume2,
  Trash
} from 'lucide-react';

const TeacherStudentChat = () => {
  const { user } = useSelector((state) => state.auth);
  const [rooms, setRooms] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [contacts, setContacts] = useState([]);
  
  // AI Insights caching states
  const [aiInsights, setAiInsights] = useState({
    aiSummary: '',
    aiActionItems: [],
    replySuggestions: []
  });
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [translationLanguage, setTranslationLanguage] = useState('English');
  const messagesEndRef = useRef(null);

  // Load Rooms and Contacts list
  const loadChatBase = async () => {
    try {
      const roomsRes = await api.get('/chat/rooms');
      setRooms(roomsRes.data.data);

      // Load possible users to open chats with
      const usersRes = await api.get('/users');
      // filter out myself
      const list = usersRes.data.data.filter(u => u._id !== user._id);
      setContacts(list);
    } catch (err) {
      console.error('Failed to load chat bootstrap', err);
    }
  };

  useEffect(() => {
    loadChatBase();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSelectRoom = async (room) => {
    try {
      setActiveRoom(room);
      setLoadingMessages(true);
      const res = await api.get(`/chat/rooms/${room._id}/messages`);
      setMessages(res.data.data);
      
      // Load room AI insights
      handleLoadAIInsights(room._id);
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleCreateRoom = async (recipientId) => {
    try {
      const res = await api.post('/chat/rooms', { recipientId });
      if (res.data.success) {
        await loadChatBase();
        handleSelectRoom(res.data.data);
      }
    } catch (err) {
      alert('Failed to initiate chat session');
    }
  };

  const handleSendMessage = async (e, textToSend = null) => {
    if (e) e.preventDefault();
    const finalMsg = textToSend || inputText;
    if (!finalMsg.trim() || !activeRoom) return;

    try {
      const res = await api.post('/chat/rooms/message', {
        roomId: activeRoom._id,
        text: finalMsg,
        translateToLanguage: '' // send raw first
      });

      if (res.data.success) {
        setMessages([...messages, res.data.data]);
        if (!textToSend) setInputText('');
        
        // Reload insights dynamically
        handleLoadAIInsights(activeRoom._id);
      }
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const handleTranslateMessage = async (msgId, textContent) => {
    try {
      // Prompt translation by updating message translate payload
      const res = await api.post('/chat/rooms/message', {
        roomId: activeRoom._id,
        text: textContent,
        translateToLanguage: translationLanguage
      });
      
      if (res.data.success) {
        // Update translation locally in list
        const updated = messages.map(m => {
          if (m._id === msgId || (m.text === textContent && !m.translatedText)) {
            return { ...m, translatedText: res.data.data.translatedText };
          }
          return m;
        });
        setMessages(updated);
      }
    } catch (err) {
      alert('Translation server error.');
    }
  };

  const handleLoadAIInsights = async (roomId) => {
    try {
      setLoadingInsights(true);
      const res = await api.get(`/chat/rooms/${roomId}/ai-insights`);
      if (res.data.success) {
        setAiInsights(res.data.data);
      }
    } catch (err) {
      console.error('Failed to generate AI chat summaries', err);
    } finally {
      setLoadingInsights(false);
    }
  };

  return (
    <div className="space-y-6 animate-soft">
      {/* Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-border-base bg-gradient-to-r from-white to-primary/5 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full flex items-center gap-1.5 w-fit">
            <MessageSquare className="w-3.5 h-3.5" />
            LMS Workspace Chat
          </span>
          <h1 className="text-2xl font-extrabold text-text-base leading-tight">AI Augmented Messages</h1>
          <p className="text-xs text-slate-500 max-w-xl">
            Communicate with course teachers and peers with built-in Google Gemini translations, conversation summaries, action items lists, and smart reply predictions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 bg-white rounded-3xl border border-border-base overflow-hidden" style={{ height: '580px' }}>
        {/* Left column: active rooms & contacts */}
        <div className="lg:col-span-1 border-r border-border-base flex flex-col h-full bg-slate-50/50">
          <div className="p-4 border-b border-border-base font-bold text-xs text-primary uppercase tracking-wide">
            Conversations
          </div>
          
          {/* Active Rooms */}
          <div className="flex-1 overflow-y-auto divide-y divide-border-base/40">
            {rooms.length > 0 ? (
              rooms.map((room) => {
                const partner = room.participants.find(p => p._id !== user._id);
                const isActive = activeRoom?._id === room._id;
                return (
                  <button
                    key={room._id}
                    onClick={() => handleSelectRoom(room)}
                    className={`w-full p-4 text-left flex items-start gap-3 hover:bg-slate-100 transition-all ${isActive ? 'bg-primary/5 border-l-4 border-primary' : ''}`}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                      {partner?.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-text-base truncate">{partner?.name}</p>
                      <p className="text-[9px] font-bold text-slate-400 capitalize">{partner?.role}</p>
                    </div>
                  </button>
                );
              })
            ) : (
              <p className="text-[10px] text-slate-500 text-center py-6">No active messages.</p>
            )}
          </div>

          {/* Create Room contact list */}
          <div className="p-4 border-t border-border-base bg-white">
            <label className="block text-[9px] font-extrabold uppercase text-slate-400 mb-2">New Chat</label>
            <select
              onChange={(e) => {
                if (e.target.value) handleCreateRoom(e.target.value);
              }}
              defaultValue=""
              className="w-full px-3 py-1.5 bg-bg-base border border-border-base rounded-xl text-[10px] outline-none text-slate-650 font-bold"
            >
              <option value="" disabled>Select faculty or student</option>
              {contacts.map(c => (
                <option key={c._id} value={c._id}>{c.name} ({c.role})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Center column: active messages chat board */}
        <div className="lg:col-span-2 flex flex-col h-full justify-between">
          {activeRoom ? (
            <>
              {/* Active Room Title */}
              <div className="p-4 border-b border-border-base flex items-center justify-between bg-white">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="font-bold text-xs text-text-base">
                    Chatting with {activeRoom.participants.find(p => p._id !== user._id)?.name}
                  </span>
                </div>
                
                {/* Translation settings */}
                <div className="flex items-center gap-1.5 text-[10px]">
                  <Languages className="w-3.5 h-3.5 text-primary" />
                  <select
                    value={translationLanguage}
                    onChange={(e) => setTranslationLanguage(e.target.value)}
                    className="bg-transparent font-bold text-primary outline-none cursor-pointer"
                  >
                    {['English', 'Urdu', 'Arabic', 'Spanish', 'French', 'Chinese'].map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Message List */}
              <div className="flex-1 p-4 overflow-y-auto bg-slate-50/20 space-y-4">
                {loadingMessages ? (
                  <div className="text-center py-12 text-slate-400 text-xs font-semibold">Loading messages history...</div>
                ) : messages.length > 0 ? (
                  messages.map((msg) => {
                    const isMine = msg.sender._id === user._id || msg.sender === user._id;
                    return (
                      <div key={msg._id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                        <div className={`p-3 rounded-2xl max-w-xs text-xs font-medium ${isMine ? 'bg-primary text-white rounded-br-none' : 'bg-slate-100 text-text-base rounded-bl-none'}`}>
                          {msg.text}
                          
                          {/* Translation row */}
                          {msg.translatedText && (
                            <div className="pt-2 mt-2 border-t border-white/20 text-[10px] text-white/90 italic">
                              Translation: {msg.translatedText}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[8px] text-slate-400">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {!isMine && !msg.translatedText && (
                            <button
                              onClick={() => handleTranslateMessage(msg._id, msg.text)}
                              className="text-[9px] text-primary font-bold hover:underline flex items-center gap-0.5"
                            >
                              <Languages className="w-2.5 h-2.5" />
                              <span>Translate</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 text-center py-12">No messages. Type below to say hi!</p>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* AI Suggested Replies */}
              {aiInsights?.replySuggestions && aiInsights.replySuggestions.length > 0 && (
                <div className="p-3 border-t border-border-base bg-slate-50/50 flex flex-wrap gap-2">
                  <span className="text-[9px] text-slate-400 uppercase font-extrabold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-secondary animate-pulse" />
                    Suggested:
                  </span>
                  {aiInsights.replySuggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(null, sug)}
                      className="px-2.5 py-1 bg-white hover:bg-primary/5 text-primary text-[10px] rounded-lg border border-primary/20 font-bold transition-all shadow-sm"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Form */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-border-base bg-white flex items-center gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 bg-bg-base border border-border-base rounded-xl text-xs outline-none focus:border-primary text-text-base"
                />
                <button
                  type="submit"
                  className="p-2 bg-primary hover:bg-primary-hover text-white rounded-xl transition-all shadow-md shadow-primary/10 shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-450 gap-2 p-6">
              <MessageSquare className="w-8 h-8 text-slate-300" />
              <p className="text-xs font-semibold">Select a conversation room to view logs.</p>
            </div>
          )}
        </div>

        {/* Right column: AI insights cache widget */}
        <div className="lg:col-span-1 border-l border-border-base flex flex-col h-full bg-slate-50/20 p-4 space-y-6 overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-text-base uppercase tracking-wider">AI Room Insights</span>
            {activeRoom && (
              <button
                onClick={() => handleLoadAIInsights(activeRoom._id)}
                disabled={loadingInsights}
                className="text-[9px] font-bold text-primary hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Summarize</span>
              </button>
            )}
          </div>

          {loadingInsights ? (
            <div className="text-xs text-slate-400 py-6 animate-pulse text-center">Re-evaluating room metrics...</div>
          ) : activeRoom ? (
            <div className="space-y-5">
              {/* Summary */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-primary uppercase">Conversation Summary</h4>
                <p className="text-[11px] text-slate-650 leading-relaxed font-medium bg-white p-3 rounded-xl border border-border-base">
                  {aiInsights?.aiSummary || 'Click Summarize to load discussion summary.'}
                </p>
              </div>

              {/* Action Items */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-secondary uppercase">Action Tasks Checklist</h4>
                {aiInsights?.aiActionItems && aiInsights.aiActionItems.length > 0 ? (
                  <ul className="space-y-2">
                    {aiInsights.aiActionItems.map((item, idx) => (
                      <li key={idx} className="text-xs text-slate-650 flex items-start gap-2 bg-white p-2.5 rounded-lg border border-border-base">
                        <CheckCircle className="w-3.5 h-3.5 text-secondary shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[10px] text-slate-450 italic pl-1">No action items detected yet.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-slate-400 text-center py-12">Select room to load AI insights.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherStudentChat;
