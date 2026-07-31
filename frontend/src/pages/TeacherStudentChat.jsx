import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';
import {
  MessageSquare, Send, Sparkles, Languages, CheckCircle,
  RefreshCw, Search, Plus, X, BrainCircuit, Users, ChevronDown, ArrowLeft
} from 'lucide-react';

// ─── Theme Colors Helper ────────────────────────────────────────────────────────
const getThemeColors = (darkMode) => ({
  primary: '#2563EB',
  secondary: '#7C3AED',
  accent: '#06B6D4',
  bg: darkMode ? '#0F172A' : '#F8FAFC',
  card: darkMode ? '#1E293B' : '#FFFFFF',
  border: darkMode ? '#334155' : '#E2E8F0',
  text: darkMode ? '#F8FAFC' : '#0F172A',
  muted: darkMode ? '#94A3B8' : '#64748B',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  activeBg: darkMode ? 'rgba(37, 99, 235, 0.2)' : '#EFF6FF',
  hoverBg: darkMode ? 'rgba(51, 65, 85, 0.5)' : '#F1F5F9'
});

// ─── Role Badge Component ───────────────────────────────────────────────────────
const rolePill = (role, darkMode) => {
  const map = {
    student: {
      bg: darkMode ? '#064E3B' : '#DCFCE7',
      color: darkMode ? '#34D399' : '#16A34A'
    },
    teacher: {
      bg: darkMode ? '#1E3A8A' : '#DBEAFE',
      color: darkMode ? '#60A5FA' : '#1D4ED8'
    },
    admin: {
      bg: darkMode ? '#7F1D1D' : '#FEE2E2',
      color: darkMode ? '#F87171' : '#DC2626'
    },
    hod: {
      bg: darkMode ? '#78350F' : '#FEF3C7',
      color: darkMode ? '#FBBF24' : '#D97706'
    },
    accountant: {
      bg: darkMode ? '#7C2D12' : '#FFF7ED',
      color: darkMode ? '#FB923C' : '#EA580C'
    },
    examination_incharge: {
      bg: darkMode ? '#4C1D95' : '#F5F3FF',
      color: darkMode ? '#A78BFA' : '#7C3AED'
    }
  };
  const s = map[role] || map.teacher;
  return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full capitalize shrink-0"
      style={{ background: s.bg, color: s.color }}>
      {role?.replace('_', ' ')}
    </span>
  );
};

const TeacherStudentChat = () => {
  const { user } = useSelector((state) => state.auth);
  const { darkMode } = useTheme();
  const C = getThemeColors(darkMode);

  // Mobile View Navigation state: 'list' (conversation list) or 'chat' (active chat view)
  const [mobileView, setMobileView] = useState('list');

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
  const [aiInsights, setAiInsights]           = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Loading states
  const [loadingRooms, setLoadingRooms]       = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending]                 = useState(false);

  // Translation
  const [translationLanguage, setTranslationLanguage] = useState('Urdu');

  // Poll interval & scroll refs
  const pollRef        = useRef(null);
  const messagesEndRef = useRef(null);

  // ─── Load rooms ─────────────────────────────────────────────────────────────
  const loadRooms = useCallback(async () => {
    try {
      const res = await api.get('/chat/rooms');
      setRooms(res.data.data || []);
    } catch {}
  }, []);

  // ─── Load contacts ──────────────────────────────────────────────────────────
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

  // ─── Poll messages every 4s while a room is active (paused when tab hidden) ─
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
        if (!document.hidden) {
          fetchMessages(activeRoom._id);
        }
      }, 4000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [activeRoom, fetchMessages]);

  // ─── Auto-scroll to latest message ──────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Select room ────────────────────────────────────────────────────────────
  const handleSelectRoom = async (room) => {
    setActiveRoom(room);
    setMobileView('chat');
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

  // ─── Send message with Optimistic Update ─────────────────────────────────────
  const handleSendMessage = async (e, suggestedText = null) => {
    if (e) e.preventDefault();
    const text = suggestedText || inputText;
    if (!text.trim() || !activeRoom || sending) return;

    const tempId = 'temp-' + Date.now();
    const optimisticMsg = {
      _id: tempId,
      roomId: activeRoom._id,
      text: text.trim(),
      sender: user,
      createdAt: new Date().toISOString(),
      isOptimistic: true
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    if (!suggestedText) setInputText('');
    setSending(true);

    try {
      await api.post('/chat/rooms/message', {
        roomId: activeRoom._id,
        text: text.trim(),
        translateToLanguage: ''
      });
      await fetchMessages(activeRoom._id);
    } catch (err) {
      console.error('Failed to send message', err);
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    } finally {
      setSending(false);
    }
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
    <div
      className="flex flex-col h-[calc(100vh-6.5rem)] md:h-[calc(100vh-7rem)] w-full rounded-2xl overflow-hidden shadow-xs border transition-all duration-300"
      style={{ background: C.bg, borderColor: C.border }}
    >
      {/* Workspace Header */}
      <div
        className="px-4 sm:px-6 py-3.5 shrink-0 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${C.border}`, background: C.card }}
      >
        <div className="flex items-center gap-3">
          <div
            className="p-2 sm:p-2.5 rounded-xl shadow-xs shrink-0"
            style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})` }}
          >
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold" style={{ color: C.text }}>Workspace Chat</h1>
            <p className="text-[11px] sm:text-xs" style={{ color: C.muted }}>Real-time messaging with AI insights & translations</p>
          </div>
        </div>

        {/* Mobile Status Switcher */}
        {activeRoom && (
          <button
            onClick={() => setMobileView(mobileView === 'chat' ? 'list' : 'chat')}
            className="md:hidden text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
            style={{ background: C.activeBg, color: C.primary, border: `1px solid ${C.primary}30` }}
          >
            {mobileView === 'chat' ? 'Chats List' : 'Open Active Chat'}
          </button>
        )}
      </div>

      {/* Main Responsive Grid Layout */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* ─── LEFT SIDEBAR: Conversations List ───────────────────────────── */}
        <div
          className={`
            w-full md:w-72 lg:w-80 flex flex-col shrink-0 transition-all duration-300
            ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}
          `}
          style={{ background: C.card, borderRight: `1px solid ${C.border}` }}
        >
          {/* Sidebar header + search */}
          <div className="p-3 space-y-2 shrink-0" style={{ borderBottom: `1px solid ${C.border}` }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: C.muted }}>Conversations</span>
              <button
                onClick={() => { setShowNewChat(!showNewChat); setContactSearch(''); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-transform active:scale-95 cursor-pointer shadow-xs"
                style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})` }}
              >
                {showNewChat ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {showNewChat ? 'Cancel' : 'New Chat'}
              </button>
            </div>
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: C.bg, border: `1px solid ${C.border}` }}
            >
              <Search className="w-3.5 h-3.5 shrink-0" style={{ color: C.muted }} />
              <input
                value={roomSearch}
                onChange={e => setRoomSearch(e.target.value)}
                placeholder="Search chats..."
                className="bg-transparent text-xs outline-none flex-1"
                style={{ color: C.text }}
              />
            </div>
          </div>

          {/* New Chat contact picker */}
          {showNewChat && (
            <div className="p-3 space-y-2 shrink-0" style={{ borderBottom: `1px solid ${C.border}`, background: C.activeBg }}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <Search className="w-3.5 h-3.5 shrink-0" style={{ color: C.muted }} />
                <input
                  value={contactSearch}
                  onChange={e => setContactSearch(e.target.value)}
                  placeholder="Search people by name..."
                  autoFocus
                  className="bg-transparent text-xs outline-none flex-1"
                  style={{ color: C.text }}
                />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                {filteredContacts.length === 0 ? (
                  <p className="text-[11px] text-center py-3" style={{ color: C.muted }}>No contacts found</p>
                ) : filteredContacts.map(c => (
                  <button
                    key={c._id}
                    onClick={() => handleCreateRoom(c._id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer"
                    style={{ background: 'transparent' }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold text-white shrink-0 shadow-xs"
                      style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})` }}
                    >
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate" style={{ color: C.text }}>{c.name}</p>
                      {rolePill(c.role, darkMode)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Room list */}
          <div className="flex-1 overflow-y-auto">
            {loadingRooms ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-5 h-5 animate-spin" style={{ color: C.primary }} />
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 px-4">
                <Users className="w-9 h-9 opacity-40" style={{ color: C.muted }} />
                <p className="text-xs text-center" style={{ color: C.muted }}>
                  {rooms.length === 0 ? 'No conversations yet. Tap "New Chat"!' : 'No matching conversations.'}
                </p>
              </div>
            ) : filteredRooms.map(room => {
              const partner = getPartner(room);
              const isSelected = activeRoom?._id === room._id;
              return (
                <button
                  key={room._id}
                  onClick={() => handleSelectRoom(room)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all cursor-pointer"
                  style={{
                    borderBottom: `1px solid ${C.border}`,
                    background: isSelected ? C.activeBg : 'transparent',
                    borderLeft: isSelected ? `4px solid ${C.primary}` : '4px solid transparent'
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold text-white shrink-0 shadow-xs"
                    style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})` }}
                  >
                    {partner?.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate" style={{ color: isSelected ? C.primary : C.text }}>
                      {partner?.name || 'Unknown'}
                    </p>
                    <div className="mt-0.5">{rolePill(partner?.role, darkMode)}</div>
                  </div>
                  {isSelected && <div className="w-2 h-2 rounded-full shrink-0" style={{ background: C.success }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── CENTER: Active Chat Board ───────────────────────────────────── */}
        <div
          className={`
            flex-1 flex flex-col overflow-hidden transition-all duration-300
            ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}
          `}
          style={{ background: C.bg }}
        >
          {activeRoom ? (
            <>
              {/* Chat room header */}
              <div
                className="flex items-center justify-between px-3 sm:px-5 py-3 shrink-0 gap-2"
                style={{ background: C.card, borderBottom: `1px solid ${C.border}` }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setMobileView('list')}
                    className="md:hidden p-2 rounded-xl transition-colors shrink-0 cursor-pointer"
                    style={{ background: C.bg, color: C.text }}
                    title="Back to conversations"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold text-white shrink-0 shadow-xs"
                    style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})` }}
                  >
                    {getPartner(activeRoom)?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-extrabold truncate" style={{ color: C.text }}>
                      {getPartner(activeRoom)?.name}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: C.success }} />
                      {rolePill(getPartner(activeRoom)?.role, darkMode)}
                    </div>
                  </div>
                </div>

                {/* Translation & AI Insights controls */}
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {/* Language Selector */}
                  <div
                    className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl"
                    style={{ background: C.bg, border: `1px solid ${C.border}` }}
                  >
                    <Languages className="w-3.5 h-3.5 shrink-0" style={{ color: C.primary }} />
                    <select
                      value={translationLanguage}
                      onChange={e => setTranslationLanguage(e.target.value)}
                      className="bg-transparent text-[11px] sm:text-xs font-bold outline-none cursor-pointer max-w-[65px] sm:max-w-none"
                      style={{ color: C.primary }}
                    >
                      {['Urdu', 'English', 'Arabic', 'Spanish', 'French', 'Chinese', 'Hindi'].map(l =>
                        <option key={l} value={l}>{l}</option>
                      )}
                    </select>
                    <ChevronDown className="w-3 h-3 shrink-0" style={{ color: C.muted }} />
                  </div>

                  {/* AI Insights Button */}
                  <button
                    onClick={handleLoadAIInsights}
                    disabled={loadingInsights}
                    className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95 cursor-pointer shadow-xs"
                    style={{ background: `linear-gradient(135deg, ${C.secondary}, ${C.accent})` }}
                  >
                    {loadingInsights ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <BrainCircuit className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">AI Insights</span>
                  </button>
                </div>
              </div>

              {/* AI Insights panel */}
              {aiInsights && (
                <div
                  className="px-4 sm:px-5 py-3 shrink-0 transition-all duration-300"
                  style={{ background: `${C.secondary}12`, borderBottom: `1px solid ${C.secondary}25` }}
                >
                  <div className="flex items-start gap-3">
                    <BrainCircuit className="w-4 h-4 shrink-0 mt-0.5" style={{ color: C.secondary }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold mb-1" style={{ color: C.text }}>{aiInsights.aiSummary}</p>
                      {aiInsights.aiActionItems?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {aiInsights.aiActionItems.map((item, i) => (
                            <span
                              key={i}
                              className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                              style={{ background: `${C.secondary}20`, color: C.secondary }}
                            >
                              <CheckCircle className="w-2.5 h-2.5" />{item}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={() => setAiInsights(null)} className="shrink-0 p-1 cursor-pointer">
                      <X className="w-3.5 h-3.5" style={{ color: C.muted }} />
                    </button>
                  </div>
                </div>
              )}

              {/* Messages viewport */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3.5" style={{ background: C.bg }}>
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-32 gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" style={{ color: C.primary }} />
                    <span className="text-xs" style={{ color: C.muted }}>Loading messages...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 gap-2">
                    <MessageSquare className="w-8 h-8 opacity-30" style={{ color: C.muted }} />
                    <p className="text-xs" style={{ color: C.muted }}>No messages yet. Say hi! 👋</p>
                  </div>
                ) : messages.map(msg => {
                  const mine = isMine(msg);
                  const senderName = typeof msg.sender === 'object' ? msg.sender?.name : 'User';
                  return (
                    <div key={msg._id} className={`flex ${mine ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                      {!mine && (
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold text-white shrink-0 shadow-xs"
                          style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.secondary})` }}
                        >
                          {senderName?.charAt(0)?.toUpperCase()}
                        </div>
                      )}
                      <div className={`flex flex-col ${mine ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-md md:max-w-lg`}>
                        {!mine && <p className="text-[9px] font-bold mb-1 px-1" style={{ color: C.muted }}>{senderName}</p>}
                        <div
                          className="px-3.5 sm:px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed break-words"
                          style={mine
                            ? { background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`, color: 'white', borderBottomRightRadius: '4px', boxShadow: `0 4px 12px ${C.primary}30` }
                            : { background: C.card, color: C.text, borderBottomLeftRadius: '4px', border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }
                          }
                        >
                          {msg.text}
                          {msg.translatedText && (
                            <div
                              className="mt-2 pt-2 text-[10px] sm:text-xs italic opacity-85"
                              style={{ borderTop: mine ? '1px solid rgba(255,255,255,0.25)' : `1px solid ${C.border}` }}
                            >
                              🌐 {msg.translatedText}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 px-1">
                          <span className="text-[9px]" style={{ color: C.muted }}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {!mine && !msg.translatedText && (
                            <button
                              onClick={() => handleTranslate(msg)}
                              className="flex items-center gap-0.5 text-[9px] font-bold hover:underline cursor-pointer"
                              style={{ color: C.primary }}
                            >
                              <Languages className="w-2.5 h-2.5" /> Translate to {translationLanguage}
                            </button>
                          )}
                        </div>
                      </div>
                      {mine && (
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold text-white shrink-0 shadow-xs"
                          style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})` }}
                        >
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
                <div
                  className="px-3 sm:px-5 py-2.5 shrink-0 flex flex-wrap gap-2 items-center"
                  style={{ background: C.card, borderTop: `1px solid ${C.border}` }}
                >
                  <span className="text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-1" style={{ color: C.muted }}>
                    <Sparkles className="w-3 h-3" style={{ color: C.secondary }} /> Suggested:
                  </span>
                  {aiInsights.replySuggestions.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(null, sug)}
                      className="px-2.5 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition-all hover:shadow-xs cursor-pointer"
                      style={{ background: `${C.primary}15`, color: C.primary, border: `1px solid ${C.primary}30` }}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Form */}
              <form
                onSubmit={handleSendMessage}
                className="px-3 sm:px-5 py-3 shrink-0 flex items-center gap-2 sm:gap-3"
                style={{ background: C.card, borderTop: `1px solid ${C.border}` }}
              >
                <input
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3.5 sm:px-4 py-2.5 rounded-2xl text-xs sm:text-sm outline-none transition-all"
                  style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                />
                <button
                  type="submit"
                  disabled={sending || !inputText.trim()}
                  className="p-2.5 sm:p-3 rounded-2xl text-white flex items-center justify-center transition-all disabled:opacity-50 active:scale-95 cursor-pointer shrink-0"
                  style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`, boxShadow: `0 4px 12px ${C.primary}30` }}
                >
                  {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </>
          ) : (
            /* Empty state when no chat active */
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
              <div className="p-5 rounded-3xl" style={{ background: `${C.primary}15` }}>
                <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12" style={{ color: C.primary }} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold mb-1" style={{ color: C.text }}>Start a Conversation</h3>
                <p className="text-xs sm:text-sm max-w-xs" style={{ color: C.muted }}>
                  Select a conversation from the left, or click <strong>New Chat</strong> to message someone.
                </p>
              </div>
              <button
                onClick={() => { setShowNewChat(true); setMobileView('list'); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-xs transition-transform active:scale-95 cursor-pointer"
                style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})` }}
              >
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
