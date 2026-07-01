import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';
import {
  MessageSquare, Send, Sparkles, Languages, CheckCircle,
  RefreshCw, Search, Plus, X, BrainCircuit, Users, ChevronDown
} from 'lucide-react';

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  primary: '#2563EB', secondary: '#7C3AED', accent: '#06B6D4',
  bg: '#F8FAFC', card: '#FFFFFF', border: '#E2E8F0',
  text: '#0F172A', muted: '#64748B', success: '#10B981',
  warning: '#F59E0B', danger: '#EF4444'
};

// ─── Role Badge ───────────────────────────────────────────────────────────────
const rolePill = (role) => {
  const map = {
    student: { bg: '#DCFCE7', color: '#16A34A' },
    teacher: { bg: '#DBEAFE', color: '#1D4ED8' },
    admin:   { bg: '#FEE2E2', color: '#DC2626' },
    hod:     { bg: '#FEF3C7', color: '#D97706' },
    accountant: { bg: '#FFF7ED', color: '#EA580C' },
    examination_incharge: { bg: '#F5F3FF', color: '#7C3AED' }
  };
  const s = map[role] || map.teacher;
  return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize"
      style={{ background: s.bg, color: s.color }}>{role?.replace('_', ' ')}</span>
  );
};

const TeacherStudentChat = () => {
  const { user } = useSelector((state) => state.auth);

  // Room list + contacts
  const [rooms, setRooms]       = useState([]);
  const [contacts, setContacts] = useState([]);

  // Active conversation
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages]     = useState([]);
  const [inputText, setInputText]   = useState('');

  // Search & filter
  const [contactSearch, setContactSearch] = useState('');
  const [showNewChat, setShowNewChat]     = useState(false);

  // AI Insights
  const [aiInsights, setAiInsights]       = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Loading states
  const [loadingRooms, setLoadingRooms]       = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending]                 = useState(false);

  // Translation
  const [translationLanguage, setTranslationLanguage] = useState('Urdu');

  // Poll interval ref
  const pollRef       = useRef(null);
  const messagesEndRef = useRef(null);
  const activeRoomRef  = useRef(null);
  activeRoomRef.current = activeRoom;

  // ─── Load rooms ─────────────────────────────────────────────────────────────
  const loadRooms = useCallback(async () => {
    try {
      const res = await api.get('/chat/rooms');
      setRooms(res.data.data || []);
    } catch {}
  }, []);

  // ─── Load contacts (uses new /contacts endpoint — no 403) ───────────────────
  const loadContacts = useCallback(async () => {
    try {
      const res = await api.get('/users/contacts');
      setContacts(res.data.data || []);
    } catch {}
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoadingRooms(true);
      await Promise.all([loadRooms(), loadContacts()]);
      setLoadingRooms(false);
    };
    init();
  }, [loadRooms, loadContacts]);

  // ─── Poll messages every 4s while a room is active ──────────────────────────
  const fetchMessages = useCallback(async (roomId) => {
    try {
      const res = await api.get(`/chat/rooms/${roomId}/messages`);
      setMessages(res.data.data || []);
    } catch {}
  }, []);

  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (activeRoom) {
      pollRef.current = setInterval(() => {
        fetchMessages(activeRoom._id);
      }, 4000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeRoom, fetchMessages]);

  // ─── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Select room ────────────────────────────────────────────────────────────
  const handleSelectRoom = async (room) => {
    setActiveRoom(room);
    setAiInsights(null);
    setLoadingMessages(true);
    try {
      const res = await api.get(`/chat/rooms/${room._id}/messages`);
      setMessages(res.data.data || []);
    } catch {}
    setLoadingMessages(false);
  };

  // ─── Create room ─────────────────────────────────────────────────────────────
  const handleCreateRoom = async (recipientId) => {
    if (!recipientId) return;
    try {
      const res = await api.post('/chat/rooms', { recipientId });
      if (res.data.success) {
        await loadRooms();
        setShowNewChat(false);
        setContactSearch('');
        handleSelectRoom(res.data.data);
      }
    } catch (err) {
      console.error('Failed to create room', err);
    }
  };

  // ─── Send message ─────────────────────────────────────────────────────────────
  const handleSendMessage = async (e, suggestedText = null) => {
    if (e) e.preventDefault();
    const text = suggestedText || inputText;
    if (!text.trim() || !activeRoom || sending) return;

    setSending(true);
    if (!suggestedText) setInputText('');

    try {
      await api.post('/chat/rooms/message', {
        roomId: activeRoom._id,
        text: text.trim(),
        translateToLanguage: ''
      });
      // Immediately refresh full messages (with proper populated sender)
      await fetchMessages(activeRoom._id);
    } catch (err) {
      console.error('Failed to send message', err);
    }
    setSending(false);
  };

  // ─── Translate message ────────────────────────────────────────────────────────
  const handleTranslate = async (msg) => {
    if (!translationLanguage || !activeRoom) return;
    try {
      const res = await api.post('/chat/rooms/message', {
        roomId: activeRoom._id,
        text: msg.text,
        translateToLanguage: translationLanguage
      });
      if (res.data.success) {
        setMessages(prev => prev.map(m =>
          m._id === msg._id ? { ...m, translatedText: res.data.data.translatedText } : m
        ));
      }
    } catch {}
  };

  // ─── AI Insights ──────────────────────────────────────────────────────────────
  const handleLoadAIInsights = async () => {
    if (!activeRoom) return;
    setLoadingInsights(true);
    try {
      const res = await api.get(`/chat/rooms/${activeRoom._id}/ai-insights`);
      if (res.data.success) setAiInsights(res.data.data);
    } catch {}
    setLoadingInsights(false);
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────────
  const getPartner = (room) => room?.participants?.find(p => p._id !== user?._id);
  const getSenderId = (msg) => typeof msg.sender === 'object' ? msg.sender?._id : msg.sender;
  const isMine = (msg) => getSenderId(msg) === user?._id;

  const filteredContacts = contacts.filter(c =>
    !contactSearch || c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.role.toLowerCase().includes(contactSearch.toLowerCase())
  );

  // ─── Room search ──────────────────────────────────────────────────────────────
  const [roomSearch, setRoomSearch] = useState('');
  const filteredRooms = rooms.filter(room => {
    const partner = getPartner(room);
    return !roomSearch || partner?.name?.toLowerCase().includes(roomSearch.toLowerCase());
  });

  return (
    <div className="flex flex-col" style={{ background: C.bg, height: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div className="px-6 py-4 shrink-0" style={{ borderBottom: `1px solid ${C.border}`, background: C.card }}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})` }}>
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold" style={{ color: C.text }}>Workspace Chat</h1>
            <p className="text-xs" style={{ color: C.muted }}>Real-time messaging with AI insights & translations</p>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* ─── LEFT SIDEBAR: Conversations ─────────────────────────────────── */}
        <div className="w-72 flex flex-col shrink-0" style={{ background: C.card, borderRight: `1px solid ${C.border}` }}>
          {/* Sidebar header + search */}
          <div className="p-3 space-y-2" style={{ borderBottom: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: C.muted }}>Conversations</span>
              <button onClick={() => { setShowNewChat(!showNewChat); setContactSearch(''); }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})` }}>
                {showNewChat ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                {showNewChat ? 'Cancel' : 'New Chat'}
              </button>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
              <Search className="w-3 h-3" style={{ color: C.muted }} />
              <input
                value={roomSearch} onChange={e => setRoomSearch(e.target.value)}
                placeholder="Search chats..."
                className="bg-transparent text-xs outline-none flex-1" style={{ color: C.text }}
              />
            </div>
          </div>

          {/* New Chat contact picker */}
          {showNewChat && (
            <div className="p-3 space-y-2" style={{ borderBottom: `1px solid ${C.border}`, background: '#EFF6FF' }}>
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <Search className="w-3 h-3" style={{ color: C.muted }} />
                <input
                  value={contactSearch} onChange={e => setContactSearch(e.target.value)}
                  placeholder="Search people..." autoFocus
                  className="bg-transparent text-xs outline-none flex-1" style={{ color: C.text }}
                />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {filteredContacts.length === 0 ? (
                  <p className="text-[10px] text-center py-3" style={{ color: C.muted }}>No contacts found</p>
                ) : filteredContacts.map(c => (
                  <button key={c._id} onClick={() => handleCreateRoom(c._id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-blue-50 transition-colors"
                    style={{ border: `1px solid transparent` }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold text-white shrink-0"
                      style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})` }}>
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: C.text }}>{c.name}</p>
                      {rolePill(c.role)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Room list */}
          <div className="flex-1 overflow-y-auto">
            {loadingRooms ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-4 h-4 animate-spin" style={{ color: C.primary }} />
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 px-4">
                <Users className="w-8 h-8" style={{ color: C.border }} />
                <p className="text-xs text-center" style={{ color: C.muted }}>
                  {rooms.length === 0 ? 'No conversations yet. Start a new chat!' : 'No matching conversations.'}
                </p>
              </div>
            ) : filteredRooms.map(room => {
              const partner = getPartner(room);
              const isSelected = activeRoom?._id === room._id;
              return (
                <button key={room._id} onClick={() => handleSelectRoom(room)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all"
                  style={{
                    borderBottom: `1px solid ${C.border}`,
                    background: isSelected ? '#EFF6FF' : 'transparent',
                    borderLeft: isSelected ? `3px solid ${C.primary}` : '3px solid transparent'
                  }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold text-white shrink-0"
                    style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})` }}>
                    {partner?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate" style={{ color: isSelected ? C.primary : C.text }}>
                      {partner?.name || 'Unknown'}
                    </p>
                    <div className="mt-0.5">{rolePill(partner?.role)}</div>
                  </div>
                  {isSelected && <div className="w-2 h-2 rounded-full shrink-0" style={{ background: C.success }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── CENTER: Chat Board ───────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeRoom ? (
            <>
              {/* Chat header */}
              <div className="flex items-center justify-between px-5 py-3.5 shrink-0"
                style={{ background: C.card, borderBottom: `1px solid ${C.border}` }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold text-white"
                    style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})` }}>
                    {getPartner(activeRoom)?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-extrabold" style={{ color: C.text }}>
                      {getPartner(activeRoom)?.name}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.success }} />
                      {rolePill(getPartner(activeRoom)?.role)}
                    </div>
                  </div>
                </div>
                {/* Translation selector */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
                    style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                    <Languages className="w-3.5 h-3.5" style={{ color: C.primary }} />
                    <select value={translationLanguage} onChange={e => setTranslationLanguage(e.target.value)}
                      className="bg-transparent text-xs font-bold outline-none" style={{ color: C.primary }}>
                      {['Urdu', 'English', 'Arabic', 'Spanish', 'French', 'Chinese', 'Hindi'].map(l =>
                        <option key={l} value={l}>{l}</option>
                      )}
                    </select>
                    <ChevronDown className="w-3 h-3" style={{ color: C.muted }} />
                  </div>
                  <button onClick={handleLoadAIInsights} disabled={loadingInsights}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                    style={{ background: `linear-gradient(135deg, ${C.secondary}, ${C.accent})` }}>
                    {loadingInsights ? <RefreshCw className="w-3 h-3 animate-spin" /> : <BrainCircuit className="w-3 h-3" />}
                    AI Insights
                  </button>
                </div>
              </div>

              {/* AI Insights panel */}
              {aiInsights && (
                <div className="px-5 py-3 shrink-0" style={{ background: `${C.secondary}08`, borderBottom: `1px solid ${C.secondary}20` }}>
                  <div className="flex items-start gap-3">
                    <BrainCircuit className="w-4 h-4 shrink-0 mt-0.5" style={{ color: C.secondary }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold mb-1" style={{ color: C.text }}>{aiInsights.aiSummary}</p>
                      {aiInsights.aiActionItems?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {aiInsights.aiActionItems.map((item, i) => (
                            <span key={i} className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                              style={{ background: `${C.secondary}15`, color: C.secondary }}>
                              <CheckCircle className="w-2.5 h-2.5" />{item}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={() => setAiInsights(null)} className="shrink-0"><X className="w-3.5 h-3.5" style={{ color: C.muted }} /></button>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ background: C.bg }}>
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-32 gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" style={{ color: C.primary }} />
                    <span className="text-xs" style={{ color: C.muted }}>Loading messages...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 gap-2">
                    <MessageSquare className="w-8 h-8" style={{ color: C.border }} />
                    <p className="text-xs" style={{ color: C.muted }}>No messages yet. Say hi! 👋</p>
                  </div>
                ) : messages.map(msg => {
                  const mine = isMine(msg);
                  const senderName = typeof msg.sender === 'object' ? msg.sender?.name : 'User';
                  return (
                    <div key={msg._id} className={`flex ${mine ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                      {!mine && (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold text-white shrink-0"
                          style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.secondary})` }}>
                          {senderName?.charAt(0)?.toUpperCase()}
                        </div>
                      )}
                      <div className={`flex flex-col ${mine ? 'items-end' : 'items-start'} max-w-sm`}>
                        {!mine && <p className="text-[9px] font-bold mb-1 px-1" style={{ color: C.muted }}>{senderName}</p>}
                        <div className="px-4 py-2.5 rounded-2xl text-xs font-medium leading-relaxed"
                          style={mine
                            ? { background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`, color: 'white', borderBottomRightRadius: '4px', boxShadow: `0 4px 12px ${C.primary}30` }
                            : { background: C.card, color: C.text, borderBottomLeftRadius: '4px', border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }
                          }>
                          {msg.text}
                          {msg.translatedText && (
                            <div className="mt-2 pt-2 text-[10px] italic opacity-80"
                              style={{ borderTop: mine ? '1px solid rgba(255,255,255,0.25)' : `1px solid ${C.border}` }}>
                              🌐 {msg.translatedText}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 px-1">
                          <span className="text-[9px]" style={{ color: C.muted }}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {!mine && !msg.translatedText && (
                            <button onClick={() => handleTranslate(msg)}
                              className="flex items-center gap-0.5 text-[9px] font-bold hover:underline"
                              style={{ color: C.primary }}>
                              <Languages className="w-2.5 h-2.5" /> Translate to {translationLanguage}
                            </button>
                          )}
                        </div>
                      </div>
                      {mine && (
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold text-white shrink-0"
                          style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})` }}>
                          {user?.name?.charAt(0)?.toUpperCase()}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* AI Suggested Replies */}
              {aiInsights?.replySuggestions?.length > 0 && (
                <div className="px-5 py-2.5 shrink-0 flex flex-wrap gap-2 items-center"
                  style={{ background: C.card, borderTop: `1px solid ${C.border}` }}>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1" style={{ color: C.muted }}>
                    <Sparkles className="w-3 h-3" style={{ color: C.secondary }} /> Suggested:
                  </span>
                  {aiInsights.replySuggestions.map((sug, i) => (
                    <button key={i} onClick={() => handleSendMessage(null, sug)}
                      className="px-3 py-1 rounded-lg text-[10px] font-bold transition-all hover:shadow-md"
                      style={{ background: `${C.primary}10`, color: C.primary, border: `1px solid ${C.primary}25` }}>
                      {sug}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <form onSubmit={handleSendMessage}
                className="px-5 py-3.5 shrink-0 flex items-center gap-3"
                style={{ background: C.card, borderTop: `1px solid ${C.border}` }}>
                <input
                  value={inputText} onChange={e => setInputText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 rounded-2xl text-sm outline-none transition-all"
                  style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                />
                <button type="submit" disabled={sending || !inputText.trim()}
                  className="p-2.5 rounded-2xl text-white flex items-center justify-center transition-all disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`, boxShadow: `0 4px 12px ${C.primary}30` }}>
                  {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </>
          ) : (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
              <div className="p-5 rounded-3xl" style={{ background: `${C.primary}10` }}>
                <MessageSquare className="w-12 h-12" style={{ color: C.primary }} />
              </div>
              <div className="text-center">
                <h3 className="text-base font-extrabold mb-1" style={{ color: C.text }}>Start a Conversation</h3>
                <p className="text-sm max-w-xs" style={{ color: C.muted }}>
                  Select a conversation from the left, or click <strong>New Chat</strong> to message someone.
                </p>
              </div>
              <button onClick={() => setShowNewChat(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})` }}>
                <Plus className="w-4 h-4" /> New Chat
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherStudentChat;
