import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  FolderOpen,
  Search,
  Download,
  ExternalLink,
  FileText,
  Cpu,
  Code,
  Video,
  FileSpreadsheet
} from 'lucide-react';

const Resources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');

  const fetchResources = async () => {
    try {
      setLoading(true);
      const res = await api.get('/resources');
      if (res.data.success) {
        setResources(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load resources', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'PDF':
      case 'Research Paper':
      case 'Lecture Notes':
        return <FileText className="w-5 h-5 text-accent-400" />;
      case 'AI Dataset':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
      case 'GitHub Repo':
        return <Code className="w-5 h-5 text-purple-400" />;
      case 'YouTube Link':
        return <Video className="w-5 h-5 text-rose-450" />;
      default:
        return <FolderOpen className="w-5 h-5 text-slate-400" />;
    }
  };

  const filteredResources = resources.filter((res) => {
    const matchesSearch =
      res.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (res.description && res.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (res.course?.name && res.course.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = selectedType === 'ALL' || res.type === selectedType;

    return matchesSearch && matchesType;
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
      <div>
        <h1 className="text-2xl font-bold text-white">Department Resource Library</h1>
        <p className="text-sm text-slate-400">Discover research papers, datasets, notebooks, and reference materials shared by department faculty.</p>
      </div>

      {/* Filters & Search Row */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
            <Search className="w-4.5 h-4.5" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm outline-none focus:border-accent-500"
            placeholder="Search resources, topics, courses..."
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 overflow-x-auto w-full md:w-auto">
          {['ALL', 'PDF', 'Research Paper', 'Lecture Notes', 'AI Dataset', 'GitHub Repo', 'YouTube Link'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                selectedType === type
                  ? 'bg-accent-600 text-white'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      {filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredResources.map((res) => (
            <div key={res._id} className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all glow-card-accent">
              <div className="space-y-4">
                {/* Meta */}
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-slate-900 rounded-lg shrink-0">
                    {getIcon(res.type)}
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 border border-slate-750 text-slate-400">
                    {res.type}
                  </span>
                </div>

                {/* Info */}
                <div>
                  <h3 className="font-bold text-sm text-white line-clamp-1 leading-snug">{res.title}</h3>
                  <p className="text-[10px] text-accent-400 font-semibold mt-1 uppercase tracking-wide">
                    Course: {res.course?.name || 'Global'}
                  </p>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">{res.description || 'No description shared.'}</p>
                </div>
              </div>

              {/* Action row */}
              <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">Shared by {res.uploadedBy?.name || 'Faculty'}</span>
                <div>
                  {res.url.startsWith('/uploads/') ? (
                    <a
                      href={`http://localhost:5000${res.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-accent-400 hover:text-accent-300 font-semibold transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  ) : (
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-all"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500 text-center py-12">No resource library items found matching your filters.</p>
      )}
    </div>
  );
};

export default Resources;
