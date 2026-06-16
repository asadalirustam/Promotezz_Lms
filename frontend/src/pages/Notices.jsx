import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';
import { Bell, Pin, Trash2, Plus, X, Calendar, User } from 'lucide-react';

const Notices = () => {
  const { user } = useSelector((state) => state.auth);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [newNotice, setNewNotice] = useState({ title: '', content: '', pinned: false });
  const [submitError, setSubmitError] = useState('');

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notices');
      if (res.data.success) {
        setNotices(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch notices', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!newNotice.title || !newNotice.content) {
      setSubmitError('Please fill in all required fields');
      return;
    }

    try {
      const res = await api.post('/notices', newNotice);
      if (res.data.success) {
        setShowModal(false);
        setNewNotice({ title: '', content: '', pinned: false });
        fetchNotices();
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to post notice');
    }
  };

  const handleDeleteNotice = async (noticeId) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    try {
      const res = await api.delete(`/notices/${noticeId}`);
      if (res.data.success) {
        fetchNotices();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete notice');
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Department Notice Board</h1>
          <p className="text-sm text-slate-400">View critical updates, event listings, and alerts from administrative desks.</p>
        </div>
        {user?.role !== 'student' && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-accent-600 to-indigo-600 hover:from-accent-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl cursor-pointer transition-all shadow-md shadow-accent-500/5 hover:scale-[1.01]"
          >
            <Plus className="w-4 h-4" />
            <span>Create Notice</span>
          </button>
        )}
      </div>

      {/* Notices Grid */}
      {notices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {notices.map((notice) => (
            <div
              key={notice._id}
              className={`glass-panel p-6 rounded-2xl border transition-all ${
                notice.pinned
                  ? 'border-accent-500/30 bg-gradient-to-tr from-slate-900/60 to-accent-950/10'
                  : 'border-slate-800 hover:border-slate-700'
              } flex flex-col justify-between`}
            >
              <div className="space-y-4">
                {/* Notice Header Metadata */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{new Date(notice.createdAt).toLocaleDateString()}</span>
                    <span>&bull;</span>
                    <span className="capitalize">{notice.author?.role} Post</span>
                  </div>
                  {notice.pinned && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-accent-400 uppercase tracking-wider bg-accent-500/10 px-2.5 py-0.5 rounded border border-accent-500/20">
                      <Pin className="w-3 h-3 fill-accent-400" />
                      Pinned
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <h3 className="font-bold text-lg text-white leading-snug">{notice.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{notice.content}</p>
                </div>
              </div>

              {/* Notice Footer Author / Actions */}
              <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-slate-900 rounded text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">{notice.author?.name || 'Academic Desk'}</span>
                </div>
                {(user?.role === 'admin' || user?.role === 'hod' || (user?.role === 'teacher' && notice.author?._id === user._id)) && (
                  <button
                    onClick={() => handleDeleteNotice(notice._id)}
                    className="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500 text-center py-12">The notice board is currently clear.</p>
      )}

      {/* CREATE NOTICE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Create Announcement</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateNotice} className="p-6 space-y-4">
              {submitError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-2.5 rounded-lg text-xs">
                  {submitError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">Notice Title</label>
                <input
                  type="text"
                  required
                  value={newNotice.title}
                  onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-accent-500 outline-none"
                  placeholder="e.g. End Semester Exam Timetable"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">Notice Content</label>
                <textarea
                  required
                  value={newNotice.content}
                  onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-accent-500 outline-none h-32"
                  placeholder="Write announcement body..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pin-notice"
                  checked={newNotice.pinned}
                  onChange={(e) => setNewNotice({ ...newNotice, pinned: e.target.checked })}
                  className="w-4.5 h-4.5 accent-accent-500 bg-slate-950 border-slate-850 rounded"
                />
                <label htmlFor="pin-notice" className="text-xs font-semibold text-slate-400 cursor-pointer select-none">
                  Pin this notice to the top of the board
                </label>
              </div>

              {/* Submit Action */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800/60">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-350 font-semibold text-sm rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-accent-600 to-indigo-600 hover:from-accent-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl cursor-pointer"
                >
                  Post Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notices;
