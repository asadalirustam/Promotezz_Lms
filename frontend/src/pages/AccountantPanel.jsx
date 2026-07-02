import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  DollarSign, Users, TrendingUp, TrendingDown, AlertCircle, CheckCircle,
  Award, Tag, Zap, Calendar, BarChart3, FileText, PlusCircle, Search,
  Download, Eye, Edit3, Trash2, ChevronDown, ChevronUp, X, Save,
  RefreshCw, Building2, CreditCard, Landmark, Smartphone, Banknote,
  BookOpen, Receipt, Briefcase, UserCheck, Filter, ChevronLeft, ChevronRight,
  BrainCircuit, Activity, PieChart, ArrowUpRight, ArrowDownRight
} from 'lucide-react';

// ─── Color Palette ────────────────────────────────────────────────────────────
const C = {
  primary: '#2563EB', secondary: '#7C3AED', accent: '#06B6D4',
  bg: '#F8FAFC', card: '#FFFFFF', border: '#E2E8F0',
  text: '#0F172A', muted: '#64748B', success: '#10B981',
  warning: '#F59E0B', danger: '#EF4444'
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => `PKR ${Number(n || 0).toLocaleString()}`;
const fmtNum = (n) => Number(n || 0).toLocaleString();
const badge = (status) => {
  const map = {
    paid: { bg: '#DCFCE7', color: '#16A34A', border: '#86EFAC' },
    unpaid: { bg: '#FEE2E2', color: '#DC2626', border: '#FCA5A5' },
    partial: { bg: '#FEF3C7', color: '#D97706', border: '#FCD34D' },
    overdue: { bg: '#FEE2E2', color: '#DC2626', border: '#FCA5A5' },
    pending: { bg: '#FEF3C7', color: '#D97706', border: '#FCD34D' },
    approved: { bg: '#DCFCE7', color: '#16A34A', border: '#86EFAC' },
    rejected: { bg: '#FEE2E2', color: '#DC2626', border: '#FCA5A5' },
    active: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
    expired: { bg: '#F1F5F9', color: '#64748B', border: '#CBD5E1' }
  };
  const s = map[status] || map.pending;
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full capitalize border"
      style={{ background: s.bg, color: s.color, borderColor: s.border }}>
      {status?.replace('_', ' ')}
    </span>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, color, sub, trend }) => (
  <div className="rounded-2xl p-5 flex flex-col gap-3" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 2px 12px rgba(37,99,235,0.06)' }}>
    <div className="flex items-center justify-between">
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.muted }}>{title}</p>
      <div className="p-2 rounded-xl" style={{ background: `${color}18` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
    </div>
    <p className="text-2xl font-extrabold" style={{ color: C.text }}>{value}</p>
    {sub && (
      <div className="flex items-center gap-1">
        {trend === 'up' ? <ArrowUpRight className="w-3 h-3" style={{ color: C.success }} /> :
          trend === 'down' ? <ArrowDownRight className="w-3 h-3" style={{ color: C.danger }} /> : null}
        <span className="text-[11px]" style={{ color: C.muted }}>{sub}</span>
      </div>
    )}
  </div>
);

// ─── Simple Bar Chart ─────────────────────────────────────────────────────────
const BarChartSimple = ({ data }) => {
  if (!data || data.length === 0) return <p className="text-center text-sm py-8" style={{ color: C.muted }}>No data available</p>;
  const max = Math.max(...data.map(d => d.revenue || 0), 1);
  return (
    <div className="flex items-end gap-2 h-40 px-2">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[9px] font-bold" style={{ color: C.primary }}>
            {d.revenue > 0 ? `${Math.round(d.revenue / 1000)}k` : ''}
          </span>
          <div className="w-full rounded-t-lg transition-all duration-700"
            style={{ height: `${Math.max(4, (d.revenue / max) * 120)}px`, background: `linear-gradient(to top, ${C.primary}, ${C.accent})` }} />
          <span className="text-[9px] font-semibold" style={{ color: C.muted }}>{d.name}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Modal Wrapper ────────────────────────────────────────────────────────────
const Modal = ({ open, onClose, title, children, maxW = '560px' }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="w-full rounded-2xl overflow-hidden" style={{ maxWidth: maxW, background: C.card, boxShadow: '0 24px 48px rgba(37,99,235,0.18)' }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${C.border}` }}>
          <h3 className="font-extrabold text-base" style={{ color: C.text }}>{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"><X className="w-4 h-4" style={{ color: C.muted }} /></button>
        </div>
        <div className="p-6 overflow-y-auto" style={{ maxHeight: '75vh' }}>{children}</div>
      </div>
    </div>
  );
};

// ─── Input Field ──────────────────────────────────────────────────────────────
const Field = ({ label, type = 'text', value, onChange, name, required, options, placeholder }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold" style={{ color: C.muted }}>{label}{required && <span style={{ color: C.danger }}> *</span>}</label>
    {type === 'select' ? (
      <select name={name} value={value} onChange={onChange} required={required}
        className="px-3 py-2 rounded-xl text-sm font-medium outline-none transition-all"
        style={{ border: `1px solid ${C.border}`, background: C.bg, color: C.text }}>
        <option value="">Select...</option>
        {options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    ) : type === 'textarea' ? (
      <textarea name={name} value={value} onChange={onChange} placeholder={placeholder} rows={3}
        className="px-3 py-2 rounded-xl text-sm outline-none resize-none transition-all"
        style={{ border: `1px solid ${C.border}`, background: C.bg, color: C.text }} />
    ) : (
      <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} required={required}
        className="px-3 py-2 rounded-xl text-sm font-medium outline-none transition-all"
        style={{ border: `1px solid ${C.border}`, background: C.bg, color: C.text }} />
    )}
  </div>
);

// ─── TAB: Dashboard ───────────────────────────────────────────────────────────
const DashboardTab = () => {
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [s, r, p] = await Promise.all([
          api.get('/accountant/stats'),
          api.get('/accountant/monthly-revenue'),
          api.get('/accountant/ai-prediction')
        ]);
        setStats(s.data.data);
        setRevenue(r.data.data);
        setPrediction(p.data.data);
      } catch { /* silent fail */ }
      setLoading(false);
    };
    fetchAll();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: `${C.primary}30`, borderTopColor: C.primary }} />
      <p className="text-sm font-semibold" style={{ color: C.muted }}>Loading finance data...</p>
    </div>
  );

  const statCards = [
    { title: 'Total Students', value: fmtNum(stats?.totalStudents), icon: Users, color: C.primary },
    { title: 'Paid Students', value: fmtNum(stats?.paidStudents), icon: CheckCircle, color: C.success, trend: 'up' },
    { title: 'Unpaid Students', value: fmtNum(stats?.unpaidStudents), icon: AlertCircle, color: C.danger, trend: 'down' },
    { title: 'Partial Paid', value: fmtNum(stats?.partialPaidStudents), icon: Activity, color: C.warning },
    { title: 'Total Revenue', value: fmt(stats?.totalRevenue), icon: DollarSign, color: C.success, trend: 'up', sub: 'Collected to date' },
    { title: 'Pending Revenue', value: fmt(stats?.pendingRevenue), icon: TrendingDown, color: C.danger, sub: 'Outstanding dues' },
    { title: 'Active Scholarships', value: fmtNum(stats?.scholarships), icon: Award, color: C.secondary },
    { title: 'Active Discounts', value: fmtNum(stats?.discounts), icon: Tag, color: C.accent },
    { title: 'Fines Collected', value: fmt(stats?.finesCollected), icon: Zap, color: C.warning },
    { title: 'Monthly Income', value: fmt(stats?.monthlyIncome), icon: BarChart3, color: C.primary, trend: 'up', sub: 'This month' },
    { title: "Today's Collection", value: fmt(stats?.todayCollection), icon: Calendar, color: C.success, sub: 'Today' },
    { title: 'Scholarship Total', value: fmt(stats?.scholarshipTotal), icon: Award, color: C.secondary }
  ];

  return (
    <div className="space-y-6">
      {/* Stat Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {statCards.map((c, i) => <StatCard key={i} {...c} />)}
      </div>

      {/* Revenue Chart */}
      <div className="rounded-2xl p-6" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-sm" style={{ color: C.text }}>Monthly Revenue — {new Date().getFullYear()}</h3>
          <BarChart3 className="w-4 h-4" style={{ color: C.primary }} />
        </div>
        <BarChartSimple data={revenue} />
      </div>

      {/* AI Prediction Panel */}
      {prediction && (
        <div className="rounded-2xl p-6" style={{ background: `linear-gradient(135deg, ${C.primary}08, ${C.secondary}08)`, border: `1px solid ${C.primary}20` }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl" style={{ background: `${C.primary}15` }}>
              <BrainCircuit className="w-4 h-4" style={{ color: C.primary }} />
            </div>
            <h3 className="font-extrabold text-sm" style={{ color: C.text }}>AI Finance Intelligence</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {[
              { label: 'Predicted Monthly', value: fmt(prediction.predictedMonthlyRevenue) },
              { label: 'Predicted Semester', value: fmt(prediction.predictedSemesterRevenue) },
              { label: 'Predicted Yearly', value: fmt(prediction.predictedYearlyRevenue) }
            ].map((p, i) => (
              <div key={i} className="rounded-xl p-4 text-center" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: C.muted }}>{p.label}</p>
                <p className="text-lg font-extrabold" style={{ color: C.primary }}>{p.value}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {[
              { label: 'Expected Collection', value: fmt(prediction.expectedCollection), icon: TrendingUp, color: C.success },
              { label: 'High Risk Accounts', value: fmtNum(prediction.highRiskAccounts), icon: AlertCircle, color: C.danger },
              { label: 'Total At Risk', value: fmtNum(prediction.totalAtRisk), icon: Activity, color: C.warning }
            ].map((p, i) => (
              <div key={i} className="rounded-xl p-4 flex items-center gap-3" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                <div className="p-2 rounded-lg" style={{ background: `${p.color}15` }}>
                  <p.icon className="w-4 h-4" style={{ color: p.color }} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>{p.label}</p>
                  <p className="text-base font-extrabold" style={{ color: C.text }}>{p.value}</p>
                </div>
              </div>
            ))}
          </div>
          {prediction.budgetOptimizationTip && (
            <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: `${C.warning}10`, border: `1px solid ${C.warning}30` }}>
              <Zap className="w-4 h-4 mt-0.5 shrink-0" style={{ color: C.warning }} />
              <p className="text-xs font-medium" style={{ color: C.text }}><span className="font-bold">AI Insight: </span>{prediction.budgetOptimizationTip}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── TAB: Fee Structures ──────────────────────────────────────────────────────
const FeeStructuresTab = () => {
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    name: '', department: 'All', semester: '', academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    tuitionFee: 0, semesterFee: 0, labFee: 0, libraryFee: 0, hostelFee: 0,
    transportFee: 0, examinationFee: 0, miscellaneousFee: 0, creditHourRate: 0, totalCredits: 0
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get('/fees/structures'); setStructures(r.data.data || []); } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditItem(null); setForm({ name: '', department: 'All', semester: '', academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`, tuitionFee: 0, semesterFee: 0, labFee: 0, libraryFee: 0, hostelFee: 0, transportFee: 0, examinationFee: 0, miscellaneousFee: 0, creditHourRate: 0, totalCredits: 0 }); setShowModal(true); };
  const openEdit = (s) => { setEditItem(s); setForm({ ...s }); setShowModal(true); };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: ['tuitionFee','semesterFee','labFee','libraryFee','hostelFee','transportFee','examinationFee','miscellaneousFee','creditHourRate','totalCredits'].includes(name) ? parseFloat(value) || 0 : value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      if (editItem) { await api.put(`/fees/structures/${editItem._id}`, form); setMsg('✅ Updated successfully'); }
      else { await api.post('/fees/structures', form); setMsg('✅ Created successfully'); }
      await load();
      setTimeout(() => { setShowModal(false); setMsg(''); }, 1200);
    } catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Error')); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this fee structure?')) return;
    try { await api.delete(`/fees/structures/${id}`); load(); } catch {}
  };

  const feeFields = [
    { name: 'tuitionFee', label: 'Tuition Fee' }, { name: 'semesterFee', label: 'Semester Fee' },
    { name: 'labFee', label: 'Lab Fee' }, { name: 'libraryFee', label: 'Library Fee' },
    { name: 'hostelFee', label: 'Hostel Fee' }, { name: 'transportFee', label: 'Transport Fee' },
    { name: 'examinationFee', label: 'Examination Fee' }, { name: 'miscellaneousFee', label: 'Miscellaneous' }
  ];

  const total = feeFields.reduce((sum, f) => sum + (parseFloat(form[f.name]) || 0), 0) + (form.creditHourRate * form.totalCredits);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-base" style={{ color: C.text }}>Fee Structures</h3>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
          style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})` }}>
          <PlusCircle className="w-4 h-4" /> New Structure
        </button>
      </div>

      {loading ? <div className="text-center py-8 text-sm" style={{ color: C.muted }}>Loading...</div> : (
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
          <table className="w-full text-sm">
            <thead style={{ background: C.bg }}>
              <tr>{['Name', 'Department', 'Semester', 'Academic Year', 'Total Fee', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {structures.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-sm" style={{ color: C.muted }}>No fee structures. Create one to get started.</td></tr>
              ) : structures.map((s) => (
                <tr key={s._id} className="hover:bg-slate-50 transition-colors" style={{ borderTop: `1px solid ${C.border}` }}>
                  <td className="px-4 py-3 font-semibold" style={{ color: C.text }}>{s.name}</td>
                  <td className="px-4 py-3" style={{ color: C.muted }}>{s.department}</td>
                  <td className="px-4 py-3" style={{ color: C.muted }}>{s.semester || 'All'}</td>
                  <td className="px-4 py-3" style={{ color: C.muted }}>{s.academicYear}</td>
                  <td className="px-4 py-3 font-bold" style={{ color: C.primary }}>{fmt(s.totalFee || (s.tuitionFee + s.semesterFee + s.labFee + s.libraryFee + s.hostelFee + s.transportFee + s.examinationFee + s.miscellaneousFee))}</td>
                  <td className="px-4 py-3">{s.isActive ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#DCFCE7', color: '#16A34A' }}>Active</span> : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#F1F5F9', color: '#64748B' }}>Inactive</span>}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-blue-50 transition-colors"><Edit3 className="w-3.5 h-3.5" style={{ color: C.primary }} /></button>
                      <button onClick={() => handleDelete(s._id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5" style={{ color: C.danger }} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Fee Structure' : 'New Fee Structure'} maxW="640px">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Structure Name" name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Semester 1 - AI Dept" />
            <Field label="Department" name="department" value={form.department} onChange={handleChange} type="select"
              options={['All','Artificial Intelligence','Computer Science','Software Engineering','Data Science'].map(d => ({ value: d, label: d }))} />
            <Field label="Semester" name="semester" type="number" value={form.semester} onChange={handleChange} placeholder="1–8 (blank for all)" />
            <Field label="Academic Year" name="academicYear" value={form.academicYear} onChange={handleChange} required />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider pt-2" style={{ color: C.muted }}>Fee Components (PKR)</p>
          <div className="grid grid-cols-2 gap-3">
            {feeFields.map(f => (
              <Field key={f.name} label={f.label} name={f.name} type="number" value={form[f.name]} onChange={handleChange} />
            ))}
            <Field label="Credit Hour Rate" name="creditHourRate" type="number" value={form.creditHourRate} onChange={handleChange} />
            <Field label="Total Credits" name="totalCredits" type="number" value={form.totalCredits} onChange={handleChange} />
          </div>
          <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: `${C.primary}08`, border: `1px solid ${C.primary}20` }}>
            <span className="text-sm font-bold" style={{ color: C.text }}>Total Fee Payable</span>
            <span className="text-lg font-extrabold" style={{ color: C.primary }}>{fmt(total)}</span>
          </div>
          {msg && <p className="text-sm text-center font-medium" style={{ color: msg.startsWith('✅') ? C.success : C.danger }}>{msg}</p>}
          <button type="submit" disabled={saving} className="w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:opacity-90 flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})` }}>
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : (editItem ? 'Update Structure' : 'Create Structure')}
          </button>
        </form>
      </Modal>
    </div>
  );
};

// ─── TAB: Challan & Payments ──────────────────────────────────────────────────
const ChallanPaymentsTab = () => {
  const [challans, setChallans] = useState([]);
  const [students, setStudents] = useState([]);
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [form, setForm] = useState({ studentId: '', feeStructureId: '', dueDate: '', academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`, discountAmount: 0, scholarshipAmount: 0, fineAmount: 0, notes: '' });
  const [payForm, setPayForm] = useState({ amount: '', paymentMethod: 'cash', transactionId: '', bankName: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 15;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit });
      if (filterStatus) params.append('status', filterStatus);
      const [c, s, st] = await Promise.all([
        api.get(`/fees/challans?${params}`),
        api.get('/users/contacts'),
        api.get('/fees/structures')
      ]);
      setChallans(c.data.data || []);
      setTotal(c.data.total || 0);
      const allUsers = s.data.data || [];
      setStudents(allUsers.filter(u => u.role === 'student'));
      setStructures(st.data.data || []);
    } catch {}
    setLoading(false);
  }, [page, filterStatus]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: ['discountAmount','scholarshipAmount','fineAmount'].includes(name) ? parseFloat(value) || 0 : value }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault(); setSaving(true); setMsg('');
    try {
      const sel = structures.find(s => s._id === form.feeStructureId);
      const totalAmount = sel ? (sel.tuitionFee + sel.semesterFee + sel.labFee + sel.libraryFee + sel.hostelFee + sel.transportFee + sel.examinationFee + sel.miscellaneousFee + sel.creditHourRate * sel.totalCredits) : 0;
      await api.post('/fees/challans/generate', { ...form, totalAmount });
      setMsg('✅ Challan generated!'); await loadData();
      setTimeout(() => { setShowModal(false); setMsg(''); }, 1200);
    } catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Error')); }
    setSaving(false);
  };

  const handleCollect = async (e) => {
    e.preventDefault(); setSaving(true); setMsg('');
    try {
      await api.post('/fees/payments/collect', { challanId: selectedChallan._id, ...payForm, amount: parseFloat(payForm.amount) });
      setMsg('✅ Payment collected!'); await loadData();
      setTimeout(() => { setShowPayModal(false); setMsg(''); setSelectedChallan(null); }, 1200);
    } catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Error')); }
    setSaving(false);
  };

  const filtered = challans.filter(c =>
    !search || c.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.challanNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const paymentMethodOpts = [
    { value: 'cash', label: '💵 Cash' }, { value: 'bank_transfer', label: '🏦 Bank Transfer' },
    { value: 'jazzcash', label: '📱 JazzCash' }, { value: 'easypaisa', label: '📱 EasyPaisa' },
    { value: 'card', label: '💳 Card' }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-extrabold text-base" style={{ color: C.text }}>Fee Challans & Payments</h3>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
            <Search className="w-3.5 h-3.5" style={{ color: C.muted }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student, challan..." className="bg-transparent text-sm outline-none w-44" style={{ color: C.text }} />
          </div>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl text-sm outline-none" style={{ border: `1px solid ${C.border}`, background: C.bg, color: C.text }}>
            <option value="">All Status</option>
            {['unpaid','partial','paid','overdue'].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})` }}>
            <PlusCircle className="w-4 h-4" /> Generate Challan
          </button>
        </div>
      </div>

      {loading ? <div className="text-center py-8 text-sm" style={{ color: C.muted }}>Loading challans...</div> : (
        <>
          <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
            <table className="w-full text-sm">
              <thead style={{ background: C.bg }}>
                <tr>{['Challan No.', 'Student', 'Dept / Sem', 'Net Payable', 'Paid', 'Balance', 'Due Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-3 py-3 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap" style={{ color: C.muted }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-12 text-sm" style={{ color: C.muted }}>No challans found. Generate one.</td></tr>
                ) : filtered.map(c => {
                  const balance = (c.netPayable || 0) - (c.paidAmount || 0);
                  return (
                    <tr key={c._id} className="hover:bg-slate-50 transition-colors" style={{ borderTop: `1px solid ${C.border}` }}>
                      <td className="px-3 py-3 font-mono text-xs font-bold" style={{ color: C.primary }}>{c.challanNumber}</td>
                      <td className="px-3 py-3">
                        <p className="font-semibold text-xs" style={{ color: C.text }}>{c.student?.name}</p>
                        <p className="text-[10px]" style={{ color: C.muted }}>{c.student?.email}</p>
                      </td>
                      <td className="px-3 py-3 text-xs" style={{ color: C.muted }}>{c.department} / Sem {c.semester}</td>
                      <td className="px-3 py-3 font-bold text-xs" style={{ color: C.text }}>{fmt(c.netPayable)}</td>
                      <td className="px-3 py-3 font-bold text-xs" style={{ color: C.success }}>{fmt(c.paidAmount)}</td>
                      <td className="px-3 py-3 font-bold text-xs" style={{ color: balance > 0 ? C.danger : C.success }}>{fmt(Math.max(0, balance))}</td>
                      <td className="px-3 py-3 text-xs" style={{ color: C.muted }}>{new Date(c.dueDate).toLocaleDateString('en-PK')}</td>
                      <td className="px-3 py-3">{badge(c.status)}</td>
                      <td className="px-3 py-3">
                        {c.status !== 'paid' && (
                          <button onClick={() => { setSelectedChallan(c); setPayForm({ amount: Math.max(0, balance), paymentMethod: 'cash', transactionId: '', bankName: '', notes: '' }); setShowPayModal(true); }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-white"
                            style={{ background: C.success }}>
                            <DollarSign className="w-3 h-3" /> Collect
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: C.muted }}>Showing {filtered.length} of {total} challans</p>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="p-2 rounded-lg disabled:opacity-40 hover:bg-slate-100 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm font-bold px-3" style={{ color: C.text }}>Page {page}</span>
              <button disabled={page * limit >= total} onClick={() => setPage(p => p + 1)}
                className="p-2 rounded-lg disabled:opacity-40 hover:bg-slate-100 transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </>
      )}

      {/* Generate Challan Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Generate Fee Challan" maxW="580px">
        <form onSubmit={handleGenerate} className="space-y-4">
          <Field label="Student" name="studentId" value={form.studentId} onChange={handleChange} type="select" required
            options={students.map(s => ({ value: s._id, label: `${s.name} — ${s.email}` }))} />
          <Field label="Fee Structure" name="feeStructureId" value={form.feeStructureId} onChange={handleChange} type="select"
            options={structures.map(s => ({ value: s._id, label: `${s.name} (${s.department})` }))} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Due Date" name="dueDate" type="date" value={form.dueDate} onChange={handleChange} required />
            <Field label="Academic Year" name="academicYear" value={form.academicYear} onChange={handleChange} required />
            <Field label="Discount (PKR)" name="discountAmount" type="number" value={form.discountAmount} onChange={handleChange} />
            <Field label="Scholarship (PKR)" name="scholarshipAmount" type="number" value={form.scholarshipAmount} onChange={handleChange} />
            <Field label="Fine (PKR)" name="fineAmount" type="number" value={form.fineAmount} onChange={handleChange} />
          </div>
          <Field label="Notes" name="notes" type="textarea" value={form.notes} onChange={handleChange} placeholder="Any notes..." />
          {msg && <p className="text-sm text-center font-medium" style={{ color: msg.startsWith('✅') ? C.success : C.danger }}>{msg}</p>}
          <button type="submit" disabled={saving} className="w-full py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})` }}>
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {saving ? 'Generating...' : 'Generate Challan'}
          </button>
        </form>
      </Modal>

      {/* Collect Payment Modal */}
      <Modal open={showPayModal} onClose={() => { setShowPayModal(false); setSelectedChallan(null); }} title="Collect Payment">
        {selectedChallan && (
          <div className="space-y-4">
            <div className="rounded-xl p-4" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
              <p className="text-xs font-bold" style={{ color: C.muted }}>Challan: {selectedChallan.challanNumber}</p>
              <p className="text-sm font-extrabold mt-1" style={{ color: C.text }}>{selectedChallan.student?.name}</p>
              <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: C.muted }}>
                <span>Net: <strong style={{ color: C.text }}>{fmt(selectedChallan.netPayable)}</strong></span>
                <span>Paid: <strong style={{ color: C.success }}>{fmt(selectedChallan.paidAmount)}</strong></span>
                <span>Balance: <strong style={{ color: C.danger }}>{fmt(Math.max(0, selectedChallan.netPayable - selectedChallan.paidAmount))}</strong></span>
              </div>
            </div>
            <form onSubmit={handleCollect} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Amount (PKR)" name="amount" type="number" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} required />
                <Field label="Payment Method" name="paymentMethod" value={payForm.paymentMethod} onChange={e => setPayForm(f => ({ ...f, paymentMethod: e.target.value }))} type="select" required options={paymentMethodOpts} />
                <Field label="Transaction ID" name="transactionId" value={payForm.transactionId} onChange={e => setPayForm(f => ({ ...f, transactionId: e.target.value }))} placeholder="Optional" />
                <Field label="Bank Name" name="bankName" value={payForm.bankName} onChange={e => setPayForm(f => ({ ...f, bankName: e.target.value }))} placeholder="If bank transfer" />
              </div>
              <Field label="Notes" name="notes" type="textarea" value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} />
              {msg && <p className="text-sm text-center font-medium" style={{ color: msg.startsWith('✅') ? C.success : C.danger }}>{msg}</p>}
              <button type="submit" disabled={saving} className="w-full py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${C.success}, #059669)` }}>
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {saving ? 'Processing...' : 'Confirm Payment'}
              </button>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ─── TAB: Scholarships & Discounts ────────────────────────────────────────────
const ScholarshipsTab = () => {
  const [scholarships, setScholarships] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSchModal, setShowSchModal] = useState(false);
  const [showDiscModal, setShowDiscModal] = useState(false);
  const [schForm, setSchForm] = useState({ student: '', type: 'merit', title: '', amount: 0, percentage: 0, academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`, description: '' });
  const [discForm, setDiscForm] = useState({ student: '', type: 'sibling', title: '', amount: 0, percentage: 0, applicableFrom: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [tab2, setTab2] = useState('scholarships');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sc, dc, st] = await Promise.all([
        api.get('/scholarships'), api.get('/scholarships/discounts'),
        api.get('/users/contacts')
      ]);
      setScholarships(sc.data.data || []);
      setDiscounts(dc.data.data || []);
      const allUsers = st.data.data || [];
      setStudents(allUsers.filter(u => u.role === 'student'));
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id) => {
    try { await api.patch(`/scholarships/${id}/approve`); load(); } catch {}
  };
  const handleReject = async (id) => {
    const reason = window.prompt('Rejection reason:');
    if (reason === null) return;
    try { await api.patch(`/scholarships/${id}/reject`, { reason }); load(); } catch {}
  };
  const handleDeleteSch = async (id) => {
    if (!window.confirm('Delete scholarship?')) return;
    try { await api.delete(`/scholarships/${id}`); load(); } catch {}
  };

  const handleSaveSch = async (e) => {
    e.preventDefault(); setSaving(true); setMsg('');
    try {
      await api.post('/scholarships', schForm);
      setMsg('✅ Scholarship added!'); load();
      setTimeout(() => { setShowSchModal(false); setMsg(''); }, 1200);
    } catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Error')); }
    setSaving(false);
  };

  const handleSaveDisc = async (e) => {
    e.preventDefault(); setSaving(true); setMsg('');
    try {
      await api.post('/scholarships/discounts', discForm);
      setMsg('✅ Discount added!'); load();
      setTimeout(() => { setShowDiscModal(false); setMsg(''); }, 1200);
    } catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Error')); }
    setSaving(false);
  };

  const schTypes = [{ value: 'merit', label: 'Merit' }, { value: 'need_based', label: 'Need Based' }, { value: 'sports', label: 'Sports' }, { value: 'departmental', label: 'Departmental' }, { value: 'government', label: 'Government' }, { value: 'other', label: 'Other' }];
  const discTypes = [{ value: 'sibling', label: 'Sibling' }, { value: 'employee_child', label: 'Employee Child' }, { value: 'special', label: 'Special' }, { value: 'promotional', label: 'Promotional' }, { value: 'other', label: 'Other' }];
  const studentOpts = students.map(s => ({ value: s._id, label: `${s.name} — ${s.email}` }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {['scholarships', 'discounts'].map(t => (
            <button key={t} onClick={() => setTab2(t)}
              className="px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all"
              style={tab2 === t ? { background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`, color: 'white' } : { background: C.bg, color: C.muted, border: `1px solid ${C.border}` }}>
              {t}
            </button>
          ))}
        </div>
        <button onClick={() => tab2 === 'scholarships' ? setShowSchModal(true) : setShowDiscModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
          style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})` }}>
          <PlusCircle className="w-4 h-4" /> Add {tab2 === 'scholarships' ? 'Scholarship' : 'Discount'}
        </button>
      </div>

      {loading ? <div className="text-center py-8 text-sm" style={{ color: C.muted }}>Loading...</div> : (
        tab2 === 'scholarships' ? (
          <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
            <table className="w-full text-sm">
              <thead style={{ background: C.bg }}>
                <tr>{['Student', 'Type', 'Title', 'Amount', 'Academic Year', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {scholarships.length === 0 ? <tr><td colSpan={7} className="text-center py-12 text-sm" style={{ color: C.muted }}>No scholarships found.</td></tr>
                  : scholarships.map(s => (
                    <tr key={s._id} className="hover:bg-slate-50 transition-colors" style={{ borderTop: `1px solid ${C.border}` }}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-xs" style={{ color: C.text }}>{s.student?.name || 'N/A'}</p>
                        <p className="text-[10px]" style={{ color: C.muted }}>{s.student?.department}</p>
                      </td>
                      <td className="px-4 py-3 text-xs capitalize" style={{ color: C.muted }}>{s.type?.replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-xs font-semibold" style={{ color: C.text }}>{s.title}</td>
                      <td className="px-4 py-3 text-xs font-bold" style={{ color: C.success }}>{fmt(s.amount)}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: C.muted }}>{s.academicYear}</td>
                      <td className="px-4 py-3">{badge(s.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {s.status === 'pending' && (
                            <>
                              <button onClick={() => handleApprove(s._id)} className="px-2 py-1 rounded-lg text-[10px] font-bold text-white" style={{ background: C.success }}>Approve</button>
                              <button onClick={() => handleReject(s._id)} className="px-2 py-1 rounded-lg text-[10px] font-bold text-white" style={{ background: C.danger }}>Reject</button>
                            </>
                          )}
                          <button onClick={() => handleDeleteSch(s._id)} className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 className="w-3 h-3" style={{ color: C.danger }} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
            <table className="w-full text-sm">
              <thead style={{ background: C.bg }}>
                <tr>{['Student', 'Type', 'Title', 'Amount / %', 'Valid From', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {discounts.length === 0 ? <tr><td colSpan={7} className="text-center py-12 text-sm" style={{ color: C.muted }}>No discounts found.</td></tr>
                  : discounts.map(d => (
                    <tr key={d._id} className="hover:bg-slate-50 transition-colors" style={{ borderTop: `1px solid ${C.border}` }}>
                      <td className="px-4 py-3 text-xs font-semibold" style={{ color: C.text }}>{d.student?.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-xs capitalize" style={{ color: C.muted }}>{d.type?.replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: C.text }}>{d.title}</td>
                      <td className="px-4 py-3 text-xs font-bold" style={{ color: C.warning }}>{d.amount > 0 ? fmt(d.amount) : `${d.percentage}%`}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: C.muted }}>{d.applicableFrom ? new Date(d.applicableFrom).toLocaleDateString() : 'N/A'}</td>
                      <td className="px-4 py-3">
                        {d.isActive ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#DCFCE7', color: '#16A34A' }}>Active</span>
                          : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#F1F5F9', color: '#64748B' }}>Inactive</span>}
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={async () => { if (!window.confirm('Delete?')) return; await api.delete(`/scholarships/discounts/${d._id}`); load(); }}
                          className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 className="w-3 h-3" style={{ color: C.danger }} /></button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )
      )}

      <Modal open={showSchModal} onClose={() => setShowSchModal(false)} title="Add Scholarship">
        <form onSubmit={handleSaveSch} className="space-y-4">
          <Field label="Student" name="student" value={schForm.student} onChange={e => setSchForm(f => ({ ...f, student: e.target.value }))} type="select" required options={studentOpts} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Type" name="type" value={schForm.type} onChange={e => setSchForm(f => ({ ...f, type: e.target.value }))} type="select" options={schTypes} />
            <Field label="Academic Year" name="academicYear" value={schForm.academicYear} onChange={e => setSchForm(f => ({ ...f, academicYear: e.target.value }))} required />
            <Field label="Scholarship Title" name="title" value={schForm.title} onChange={e => setSchForm(f => ({ ...f, title: e.target.value }))} required placeholder="e.g. Merit Top 10%" />
            <Field label="Amount (PKR)" name="amount" type="number" value={schForm.amount} onChange={e => setSchForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} />
            <Field label="Percentage (%)" name="percentage" type="number" value={schForm.percentage} onChange={e => setSchForm(f => ({ ...f, percentage: parseFloat(e.target.value) || 0 }))} />
          </div>
          <Field label="Description" name="description" type="textarea" value={schForm.description} onChange={e => setSchForm(f => ({ ...f, description: e.target.value }))} />
          {msg && <p className="text-sm text-center font-medium" style={{ color: msg.startsWith('✅') ? C.success : C.danger }}>{msg}</p>}
          <button type="submit" disabled={saving} className="w-full py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})` }}>
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Scholarship
          </button>
        </form>
      </Modal>

      <Modal open={showDiscModal} onClose={() => setShowDiscModal(false)} title="Add Discount">
        <form onSubmit={handleSaveDisc} className="space-y-4">
          <Field label="Student" name="student" value={discForm.student} onChange={e => setDiscForm(f => ({ ...f, student: e.target.value }))} type="select" required options={studentOpts} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Type" name="type" value={discForm.type} onChange={e => setDiscForm(f => ({ ...f, type: e.target.value }))} type="select" options={discTypes} />
            <Field label="Title" name="title" value={discForm.title} onChange={e => setDiscForm(f => ({ ...f, title: e.target.value }))} required placeholder="e.g. Sibling 10%" />
            <Field label="Amount (PKR)" name="amount" type="number" value={discForm.amount} onChange={e => setDiscForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} />
            <Field label="Percentage (%)" name="percentage" type="number" value={discForm.percentage} onChange={e => setDiscForm(f => ({ ...f, percentage: parseFloat(e.target.value) || 0 }))} />
            <Field label="Valid From" name="applicableFrom" type="date" value={discForm.applicableFrom} onChange={e => setDiscForm(f => ({ ...f, applicableFrom: e.target.value }))} required />
          </div>
          {msg && <p className="text-sm text-center font-medium" style={{ color: msg.startsWith('✅') ? C.success : C.danger }}>{msg}</p>}
          <button type="submit" disabled={saving} className="w-full py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})` }}>
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Discount
          </button>
        </form>
      </Modal>
    </div>
  );
};

// ─── TAB: Expenses ────────────────────────────────────────────────────────────
const ExpensesTab = () => {
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'maintenance', amount: 0, description: '', date: new Date().toISOString().split('T')[0], vendor: '', invoiceNumber: '', paymentMethod: 'cash', department: 'General' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/hr/expenses');
      setExpenses(r.data.data || []);
      setSummary(r.data.summary || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.name === 'amount' ? parseFloat(e.target.value) || 0 : e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setMsg('');
    try {
      await api.post('/hr/expenses', form);
      setMsg('✅ Expense recorded!'); load();
      setTimeout(() => { setShowModal(false); setMsg(''); }, 1200);
    } catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Error')); }
    setSaving(false);
  };

  const cats = ['salary','maintenance','electricity','internet','equipment','stationery','transport','miscellaneous'];
  const catEmojis = { salary: '💰', maintenance: '🔧', electricity: '⚡', internet: '🌐', equipment: '🖥️', stationery: '📝', transport: '🚗', miscellaneous: '📦' };
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-base" style={{ color: C.text }}>Expense Management</h3>
          <p className="text-xs mt-0.5" style={{ color: C.muted }}>Total: <strong style={{ color: C.danger }}>{fmt(totalExpenses)}</strong></p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
          style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})` }}>
          <PlusCircle className="w-4 h-4" /> Record Expense
        </button>
      </div>

      {/* Category Summary */}
      {summary.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {summary.map(s => (
            <div key={s._id} className="rounded-xl p-3" style={{ background: C.card, border: `1px solid ${C.border}` }}>
              <p className="text-lg">{catEmojis[s._id] || '📦'}</p>
              <p className="text-xs font-bold capitalize mt-1" style={{ color: C.text }}>{s._id}</p>
              <p className="text-sm font-extrabold" style={{ color: C.danger }}>{fmt(s.total)}</p>
              <p className="text-[10px]" style={{ color: C.muted }}>{s.count} records</p>
            </div>
          ))}
        </div>
      )}

      {loading ? <div className="text-center py-8 text-sm" style={{ color: C.muted }}>Loading...</div> : (
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
          <table className="w-full text-sm">
            <thead style={{ background: C.bg }}>
              <tr>{['Title', 'Category', 'Amount', 'Date', 'Vendor', 'Invoice', 'Payment', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? <tr><td colSpan={8} className="text-center py-12 text-sm" style={{ color: C.muted }}>No expenses recorded.</td></tr>
                : expenses.map(e => (
                  <tr key={e._id} className="hover:bg-slate-50 transition-colors" style={{ borderTop: `1px solid ${C.border}` }}>
                    <td className="px-4 py-3 font-semibold text-xs" style={{ color: C.text }}>{e.title}</td>
                    <td className="px-4 py-3 text-xs capitalize" style={{ color: C.muted }}>{catEmojis[e.category]} {e.category}</td>
                    <td className="px-4 py-3 text-xs font-bold" style={{ color: C.danger }}>{fmt(e.amount)}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: C.muted }}>{new Date(e.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: C.muted }}>{e.vendor || '—'}</td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: C.muted }}>{e.invoiceNumber || '—'}</td>
                    <td className="px-4 py-3 text-xs capitalize" style={{ color: C.muted }}>{e.paymentMethod?.replace('_', ' ')}</td>
                    <td className="px-4 py-3">
                      <button onClick={async () => { if (!window.confirm('Delete?')) return; await api.delete(`/hr/expenses/${e._id}`); load(); }}
                        className="p-1.5 rounded-lg hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" style={{ color: C.danger }} /></button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Record Expense">
        <form onSubmit={handleSave} className="space-y-4">
          <Field label="Title" name="title" value={form.title} onChange={handleChange} required placeholder="e.g. Internet Bill" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Category" name="category" value={form.category} onChange={handleChange} type="select" options={cats.map(c => ({ value: c, label: `${catEmojis[c]} ${c.charAt(0).toUpperCase() + c.slice(1)}` }))} />
            <Field label="Amount (PKR)" name="amount" type="number" value={form.amount} onChange={handleChange} required />
            <Field label="Date" name="date" type="date" value={form.date} onChange={handleChange} required />
            <Field label="Payment Method" name="paymentMethod" value={form.paymentMethod} onChange={handleChange} type="select"
              options={[{ value: 'cash', label: 'Cash' }, { value: 'bank_transfer', label: 'Bank Transfer' }, { value: 'cheque', label: 'Cheque' }, { value: 'online', label: 'Online' }]} />
            <Field label="Vendor" name="vendor" value={form.vendor} onChange={handleChange} placeholder="Optional" />
            <Field label="Invoice No." name="invoiceNumber" value={form.invoiceNumber} onChange={handleChange} placeholder="Optional" />
          </div>
          <Field label="Description" name="description" type="textarea" value={form.description} onChange={handleChange} />
          {msg && <p className="text-sm text-center font-medium" style={{ color: msg.startsWith('✅') ? C.success : C.danger }}>{msg}</p>}
          <button type="submit" disabled={saving} className="w-full py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})` }}>
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Expense
          </button>
        </form>
      </Modal>
    </div>
  );
};

// ─── TAB: Salary Management ───────────────────────────────────────────────────
const SalaryTab = () => {
  const [salaries, setSalaries] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    employeeId: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(),
    basicSalary: 0, bonus: 0, overtimeHours: 0, taxRate: 0, paymentMethod: 'bank_transfer', bankAccount: '',
    allowances: [], deductions: [], notes: ''
  });
  const [allowanceInput, setAllowanceInput] = useState({ title: '', amount: 0 });
  const [deductionInput, setDeductionInput] = useState({ title: '', amount: 0 });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, e] = await Promise.all([api.get('/hr/salaries'), api.get('/users/contacts')]);
      setSalaries(s.data.data || []);
      const allUsers = e.data.data || [];
      setEmployees(allUsers.filter(u => u.role === 'teacher'));
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setMsg('');
    try {
      await api.post('/hr/salaries/generate', form);
      setMsg('✅ Salary slip generated!'); load();
      setTimeout(() => { setShowModal(false); setMsg(''); }, 1500);
    } catch (err) { setMsg('❌ ' + (err.response?.data?.message || 'Error')); }
    setSaving(false);
  };
  const handlePaySalary = async (id) => {
    if (!window.confirm('Mark this salary as paid?')) return;
    try {
      await api.put(`/hr/salaries/${id}`, { status: 'paid' });
      load();
    } catch {}
  };


  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-base" style={{ color: C.text }}>Salary Management</h3>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white"
          style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})` }}>
          <PlusCircle className="w-4 h-4" /> Generate Salary Slip
        </button>
      </div>

      {loading ? <div className="text-center py-8 text-sm" style={{ color: C.muted }}>Loading...</div> : (
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
          <table className="w-full text-sm">
            <thead style={{ background: C.bg }}>
              <tr>{['Slip No.', 'Employee', 'Month/Year', 'Basic', 'Gross', 'Net', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {salaries.length === 0 ? <tr><td colSpan={8} className="text-center py-12 text-sm" style={{ color: C.muted }}>No salary slips generated.</td></tr>
                : salaries.map(s => (
                  <tr key={s._id} className="hover:bg-slate-50 transition-colors" style={{ borderTop: `1px solid ${C.border}` }}>
                    <td className="px-4 py-3 font-mono text-[10px] font-bold" style={{ color: C.primary }}>{s.slipNumber}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-xs" style={{ color: C.text }}>{s.employee?.name}</p>
                      <p className="text-[10px] capitalize" style={{ color: C.muted }}>{s.employee?.role}</p>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: C.muted }}>{monthNames[s.month - 1]} {s.year}</td>
                    <td className="px-4 py-3 text-xs font-bold" style={{ color: C.text }}>{fmt(s.basicSalary)}</td>
                    <td className="px-4 py-3 text-xs font-bold" style={{ color: C.warning }}>{fmt(s.grossSalary)}</td>
                    <td className="px-4 py-3 text-xs font-bold" style={{ color: C.success }}>{fmt(s.netSalary)}</td>
                    <td className="px-4 py-3">{badge(s.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/hr/salaries/${s._id}/slip`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white w-fit"
                          style={{ background: C.primary }}>
                          <Download className="w-3 h-3" /> PDF
                        </a>
                        {s.status === 'pending' && (
                          <button onClick={() => handlePaySalary(s._id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white hover:opacity-90 transition-all cursor-pointer"
                            style={{ background: C.success }}>
                            Mark Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Generate Salary Slip" maxW="620px">
        <form onSubmit={handleSave} className="space-y-4">
          <Field label="Employee" name="employeeId" value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))} type="select" required
            options={employees.map(e => ({ value: e._id, label: `${e.name} — ${e.role}` }))} />
          <div className="grid grid-cols-3 gap-3">
            <Field label="Month" name="month" value={form.month} onChange={e => setForm(f => ({ ...f, month: parseInt(e.target.value) }))} type="select"
              options={monthNames.map((m, i) => ({ value: i + 1, label: m }))} />
            <Field label="Year" name="year" type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: parseInt(e.target.value) }))} />
            <Field label="Basic Salary (PKR)" name="basicSalary" type="number" value={form.basicSalary} onChange={e => setForm(f => ({ ...f, basicSalary: parseFloat(e.target.value) || 0 }))} required />
            <Field label="Bonus (PKR)" name="bonus" type="number" value={form.bonus} onChange={e => setForm(f => ({ ...f, bonus: parseFloat(e.target.value) || 0 }))} />
            <Field label="Overtime Hours" name="overtimeHours" type="number" value={form.overtimeHours} onChange={e => setForm(f => ({ ...f, overtimeHours: parseFloat(e.target.value) || 0 }))} />
            <Field label="Tax Rate (%)" name="taxRate" type="number" value={form.taxRate} onChange={e => setForm(f => ({ ...f, taxRate: parseFloat(e.target.value) || 0 }))} />
          </div>

          {/* Allowances */}
          <div>
            <p className="text-xs font-bold mb-2" style={{ color: C.muted }}>Allowances</p>
            <div className="flex gap-2 mb-2">
              <input placeholder="Title" value={allowanceInput.title} onChange={e => setAllowanceInput(a => ({ ...a, title: e.target.value }))}
                className="flex-1 px-3 py-2 rounded-xl text-xs outline-none" style={{ border: `1px solid ${C.border}`, background: C.bg }} />
              <input type="number" placeholder="PKR" value={allowanceInput.amount} onChange={e => setAllowanceInput(a => ({ ...a, amount: parseFloat(e.target.value) || 0 }))}
                className="w-24 px-3 py-2 rounded-xl text-xs outline-none" style={{ border: `1px solid ${C.border}`, background: C.bg }} />
              <button type="button" onClick={() => { if (allowanceInput.title) { setForm(f => ({ ...f, allowances: [...f.allowances, { ...allowanceInput }] })); setAllowanceInput({ title: '', amount: 0 }); } }}
                className="px-3 py-2 rounded-xl text-xs font-bold text-white" style={{ background: C.success }}>Add</button>
            </div>
            {form.allowances.map((a, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-lg mb-1" style={{ background: '#DCFCE7' }}>
                <span className="text-xs font-medium" style={{ color: '#166534' }}>{a.title}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold" style={{ color: '#166534' }}>+{fmt(a.amount)}</span>
                  <button type="button" onClick={() => setForm(f => ({ ...f, allowances: f.allowances.filter((_, ii) => ii !== i) }))}>
                    <X className="w-3 h-3" style={{ color: '#166534' }} /></button>
                </div>
              </div>
            ))}
          </div>

          {/* Deductions */}
          <div>
            <p className="text-xs font-bold mb-2" style={{ color: C.muted }}>Deductions</p>
            <div className="flex gap-2 mb-2">
              <input placeholder="Title" value={deductionInput.title} onChange={e => setDeductionInput(d => ({ ...d, title: e.target.value }))}
                className="flex-1 px-3 py-2 rounded-xl text-xs outline-none" style={{ border: `1px solid ${C.border}`, background: C.bg }} />
              <input type="number" placeholder="PKR" value={deductionInput.amount} onChange={e => setDeductionInput(d => ({ ...d, amount: parseFloat(e.target.value) || 0 }))}
                className="w-24 px-3 py-2 rounded-xl text-xs outline-none" style={{ border: `1px solid ${C.border}`, background: C.bg }} />
              <button type="button" onClick={() => { if (deductionInput.title) { setForm(f => ({ ...f, deductions: [...f.deductions, { ...deductionInput }] })); setDeductionInput({ title: '', amount: 0 }); } }}
                className="px-3 py-2 rounded-xl text-xs font-bold text-white" style={{ background: C.danger }}>Add</button>
            </div>
            {form.deductions.map((d, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-lg mb-1" style={{ background: '#FEE2E2' }}>
                <span className="text-xs font-medium" style={{ color: '#991B1B' }}>{d.title}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold" style={{ color: '#991B1B' }}>-{fmt(d.amount)}</span>
                  <button type="button" onClick={() => setForm(f => ({ ...f, deductions: f.deductions.filter((_, ii) => ii !== i) }))}>
                    <X className="w-3 h-3" style={{ color: '#991B1B' }} /></button>
                </div>
              </div>
            ))}
          </div>

          <Field label="Payment Method" name="paymentMethod" value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))} type="select"
            options={[{ value: 'bank_transfer', label: 'Bank Transfer' }, { value: 'cash', label: 'Cash' }, { value: 'cheque', label: 'Cheque' }]} />

          {msg && <p className="text-sm text-center font-medium" style={{ color: msg.startsWith('✅') ? C.success : C.danger }}>{msg}</p>}
          <button type="submit" disabled={saving} className="w-full py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 hover:opacity-90"
            style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})` }}>
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
            {saving ? 'Generating...' : 'Generate Salary Slip'}
          </button>
        </form>
      </Modal>
    </div>
  );
};

// ─── TAB: Payments History ────────────────────────────────────────────────────
const PaymentsHistoryTab = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { const r = await api.get('/fees/payments?limit=50'); setPayments(r.data.data || []); } catch {}
      setLoading(false);
    })();
  }, []);

  const methodIcon = { cash: '💵', bank_transfer: '🏦', jazzcash: '📱', easypaisa: '📱', card: '💳' };

  const filtered = payments.filter(p =>
    !search || p.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.receiptNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-extrabold text-base" style={{ color: C.text }}>Payment History & Receipts</h3>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
          <Search className="w-3.5 h-3.5" style={{ color: C.muted }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="bg-transparent text-sm outline-none w-36" style={{ color: C.text }} />
        </div>
      </div>

      {loading ? <div className="text-center py-8 text-sm" style={{ color: C.muted }}>Loading...</div> : (
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
          <table className="w-full text-sm">
            <thead style={{ background: C.bg }}>
              <tr>{['Receipt No.', 'Student', 'Amount', 'Method', 'Date', 'Balance', 'Collected By', 'Receipt'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={8} className="text-center py-12 text-sm" style={{ color: C.muted }}>No payments found.</td></tr>
                : filtered.map(p => (
                  <tr key={p._id} className="hover:bg-slate-50 transition-colors" style={{ borderTop: `1px solid ${C.border}` }}>
                    <td className="px-4 py-3 font-mono text-[10px] font-bold" style={{ color: C.primary }}>{p.receiptNumber}</td>
                    <td className="px-4 py-3 text-xs font-semibold" style={{ color: C.text }}>{p.student?.name}</td>
                    <td className="px-4 py-3 text-xs font-bold" style={{ color: C.success }}>{fmt(p.amount)}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: C.muted }}>{methodIcon[p.paymentMethod]} {p.paymentMethod?.replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: C.muted }}>{new Date(p.paidDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-xs font-bold" style={{ color: p.remainingBalance > 0 ? C.danger : C.success }}>{fmt(p.remainingBalance)}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: C.muted }}>{p.collectedBy?.name}</td>
                    <td className="px-4 py-3">
                      <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/fees/payments/${p._id}/receipt`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold text-white w-fit"
                        style={{ background: C.secondary }}>
                        <Download className="w-3 h-3" /> PDF
                      </a>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── MAIN PANEL ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'fee_structures', label: 'Fee Structures', icon: FileText },
  { id: 'challans', label: 'Challans & Payments', icon: Receipt },
  { id: 'scholarships', label: 'Scholarships & Discounts', icon: Award },
  { id: 'expenses', label: 'Expenses', icon: Briefcase },
  { id: 'salary', label: 'Salary', icon: UserCheck },
  { id: 'history', label: 'Payment History', icon: CreditCard }
];

const AccountantPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="space-y-0" style={{ background: C.bg, minHeight: '100vh' }}>
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 rounded-2xl" style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})` }}>
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold" style={{ color: C.text }}>Accountant Finance Panel</h1>
            <p className="text-xs" style={{ color: C.muted }}>University Finance Management System — AI Department LMS</p>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="px-6 pb-4">
        <div className="flex items-center gap-1 p-1 rounded-2xl overflow-x-auto" style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(37,99,235,0.06)' }}>
          {TABS.map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0"
                style={active ? { background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`, color: 'white', boxShadow: `0 4px 12px ${C.primary}30` } : { color: C.muted }}>
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-6 pb-8">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'fee_structures' && <FeeStructuresTab />}
        {activeTab === 'challans' && <ChallanPaymentsTab />}
        {activeTab === 'scholarships' && <ScholarshipsTab />}
        {activeTab === 'expenses' && <ExpensesTab />}
        {activeTab === 'salary' && <SalaryTab />}
        {activeTab === 'history' && <PaymentsHistoryTab />}
      </div>
    </div>
  );
};

export default AccountantPanel;
