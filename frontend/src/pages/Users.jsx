import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '../services/api';
import { Users, Search, Plus, Edit, Trash2, X } from 'lucide-react';

const UserDirectory = () => {
  const { user: currentUser } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // If null, we are creating a new user
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    semester: 1,
    department: 'Artificial Intelligence'
  });
  const [submitError, setSubmitError] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load user directory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'student',
      semester: 1,
      department: 'Artificial Intelligence'
    });
    setSubmitError('');
    setShowModal(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Leave empty unless resetting password
      role: user.role,
      semester: user.semester || 1,
      department: user.department || 'Artificial Intelligence'
    });
    setSubmitError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    try {
      let res;
      if (editingUser) {
        // Edit User
        const payload = { ...formData };
        if (!payload.password) delete payload.password; // Don't send empty pw
        res = await api.put(`/users/${editingUser._id}`, payload);
      } else {
        // Create User
        if (!formData.password) {
          setSubmitError('Password is required for new accounts');
          return;
        }
        res = await api.post('/users', formData);
      }

      if (res.data.success) {
        setShowModal(false);
        fetchUsers();
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This will wipe their records.')) return;
    try {
      const res = await api.delete(`/users/${userId}`);
      if (res.data.success) {
        fetchUsers();
      }
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = selectedRole === 'ALL' || u.role === selectedRole.toLowerCase();

    return matchesSearch && matchesRole;
  });

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
          <h1 className="text-2xl font-bold text-white">User Directory</h1>
          <p className="text-sm text-slate-400">
            {currentUser?.role === 'admin' ? 'Manage Student, Faculty, HOD, and Admin profile configurations.' : 'View student and faculty indexes.'}
          </p>
        </div>
        {currentUser?.role === 'admin' && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-accent-600 to-indigo-600 hover:from-accent-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl cursor-pointer transition-all hover:scale-[1.01]"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Create User</span>
          </button>
        )}
      </div>

      {/* Filters row */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
            <Search className="w-4.5 h-4.5" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm outline-none focus:border-accent-500"
            placeholder="Search directory by name, email..."
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {['ALL', 'STUDENT', 'TEACHER', 'HOD', 'ADMIN'].map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                selectedRole === role
                  ? 'bg-accent-600 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider bg-slate-900/35">
                <th className="p-4 font-semibold">User Details</th>
                <th className="p-4 font-semibold">Role</th>
                <th className="p-4 font-semibold">Department</th>
                <th className="p-4 font-semibold">Semester</th>
                {currentUser?.role === 'admin' && <th className="p-4 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <tr key={u._id} className="text-slate-350 hover:bg-slate-900/10 transition-all">
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 text-xs font-bold text-accent-400 flex items-center justify-center shrink-0">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-white">{u.name}</h4>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        u.role === 'admin'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : u.role === 'hod'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : u.role === 'teacher'
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          : 'bg-accent-500/10 text-accent-400 border border-accent-500/20'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-xs">{u.department}</td>
                    <td className="p-4 text-xs">{u.role === 'student' ? `Semester ${u.semester}` : 'N/A'}</td>
                    {currentUser?.role === 'admin' && (
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 text-slate-400 hover:text-accent-400 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            disabled={u._id === currentUser._id}
                            onClick={() => handleDelete(u._id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-all disabled:opacity-30 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-sm text-slate-500">
                    No users found matching query filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">{editingUser ? 'Edit User Credentials' : 'Create User Account'}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {submitError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-2.5 rounded-lg text-xs">
                  {submitError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-accent-500 outline-none"
                    placeholder="e.g. Alex Mercer"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-accent-500 outline-none"
                    placeholder="alex@ailms.edu"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">
                  {editingUser ? 'New Password (leave empty to keep current)' : 'Password'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-accent-500 outline-none"
                  placeholder="••••••••"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">System Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-accent-500 outline-none"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="hod">HOD</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                
                {formData.role === 'student' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">Semester</label>
                    <input
                      type="number"
                      min="1"
                      max="8"
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-accent-500 outline-none"
                    />
                  </div>
                ) : (
                  <div className="opacity-30">
                    <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">Semester</label>
                    <input
                      disabled
                      type="text"
                      value="N/A"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:border-accent-500 outline-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
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
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDirectory;
