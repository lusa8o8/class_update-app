import { useAuth } from './_app';
import { Shield, LogOut, Plus, BookOpen, Users, Clock, Calendar, ChevronRight, CheckCircle2, Circle, FileText, List, AlertCircle, Save, X, MessageSquare, Repeat, LayoutDashboard, Send, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Course {
  id: number;
  name: string;
  code: string;
  description: string;
  student_count: number;
  created_at: string;
}

interface Update {
  id: number;
  course_id: number;
  session_number: number;
  title: string;
  date: string;
  status: 'upcoming' | 'completed';
}

interface UpdateContent {
  summary: string;
  key_points: string[];
  files: { name: string; url: string }[];
  assessment_reminder: string;
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [updates, setUpdates] = useState<Update[]>([]);
  
  const [isCreatingCourse, setIsCreatingCourse] = useState(false);
  const [isCreatingUpdate, setIsCreatingUpdate] = useState(false);
  const [editingContentUpdate, setEditingContentUpdate] = useState<Update | null>(null);
  
  const [feedback, setFeedback] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'courses' | 'feedback'>('courses');

  const [isBulkCreating, setIsBulkCreating] = useState(false);
  const [bulkWeeks, setBulkWeeks] = useState(4);
  const [bulkDays, setBulkDays] = useState<number[]>([]);
  const [bulkStartDate, setBulkStartDate] = useState('');
  
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDesc, setNewDesc] = useState('');
  
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateNum, setUpdateNum] = useState(1);
  const [updateDate, setUpdateDate] = useState('');

  // Content Editor State
  const [summary, setSummary] = useState('');
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [files, setFiles] = useState<{ name: string; url: string }[]>([]);
  const [assessmentReminder, setAssessmentReminder] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchFeedback();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchUpdates(selectedCourse.id);
    }
  }, [selectedCourse]);

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/courses');
      const data = await res.json();
      if (res.ok) setCourses(data);
    } catch (err) {
      console.error('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedback = async () => {
    try {
      const res = await fetch('/api/feedback');
      const data = await res.json();
      if (res.ok) setFeedback(data);
    } catch (err) {
      console.error('Failed to fetch feedback');
    }
  };

  const fetchUpdates = async (courseId: number) => {
    try {
      const res = await fetch(`/api/sessions?courseId=${courseId}`);
      const data = await res.json();
      if (res.ok) setUpdates(data);
    } catch (err) {
      console.error('Failed to fetch updates');
    }
  };

  const fetchUpdateContent = async (sessionId: number) => {
    try {
      const res = await fetch(`/api/session-content?sessionId=${sessionId}`);
      const data = await res.json();
      if (res.ok && data) {
        setSummary(data.summary || '');
        setKeyPoints(JSON.parse(data.key_points || '[]'));
        setFiles(JSON.parse(data.files || '[]'));
        setAssessmentReminder(data.assessment_reminder || '');
      } else {
        setSummary('');
        setKeyPoints([]);
        setFiles([]);
        setAssessmentReminder('');
      }
    } catch (err) {
      console.error('Failed to fetch update content');
    }
  };

  const handleBulkCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || bulkDays.length === 0) return;

    try {
      const res = await fetch('/api/updates/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: selectedCourse.id,
          start_date: bulkStartDate,
          num_weeks: bulkWeeks,
          days_of_week: bulkDays,
          start_session_num: updates.length + 1
        }),
      });
      if (res.ok) {
        setIsBulkCreating(false);
        fetchUpdates(selectedCourse.id);
        setBulkDays([]);
      }
    } catch (err) {
      console.error('Bulk creation failed');
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, code: newCode, description: newDesc }),
      });
      const data = await res.json();
      if (res.ok) {
        setCourses([data, ...courses]);
        setIsCreatingCourse(false);
        setNewName('');
        setNewCode('');
        setNewDesc('');
        fetchCourses();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to create course');
    }
  };

  const handleCreateUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    setError('');
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          course_id: selectedCourse.id, 
          session_number: updateNum, 
          title: updateTitle, 
          date: updateDate 
        }),
      });
      if (res.ok) {
        setIsCreatingUpdate(false);
        setUpdateTitle('');
        setUpdateNum(updates.length + 2);
        setUpdateDate('');
        fetchUpdates(selectedCourse.id);
      } else {
        const data = await res.json();
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to create update');
    }
  };

  const handleSaveContent = async () => {
    if (!editingContentUpdate) return;
    try {
      const res = await fetch('/api/session-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: editingContentUpdate.id,
          summary,
          key_points: keyPoints,
          files,
          assessment_reminder: assessmentReminder
        }),
      });
      if (res.ok) {
        setEditingContentUpdate(null);
      }
    } catch (err) {
      console.error('Failed to save content');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    // Simulate upload
    setTimeout(() => {
      setFiles([...files, { name: file.name, url: '#' }]);
      setIsUploading(false);
    }, 1000);
  };

  const toggleUpdateStatus = async (update: Update) => {
    const newStatus = update.status === 'upcoming' ? 'completed' : 'upcoming';
    try {
      const res = await fetch('/api/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: update.id, status: newStatus }),
      });
      if (res.ok) {
        setUpdates(updates.map(u => u.id === update.id ? { ...u, status: newStatus } : u));
      }
    } catch (err) {
      console.error('Failed to update status');
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <nav className="bg-white border-b border-zinc-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white">
              <Shield size={18} />
            </div>
            <span className="font-semibold text-zinc-900 tracking-tight">Admin Portal</span>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => setActiveTab('courses')}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${activeTab === 'courses' ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
              <LayoutDashboard size={18} /> Courses
            </button>
            <button 
              onClick={() => setActiveTab('feedback')}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${activeTab === 'feedback' ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}
            >
              <MessageSquare size={18} /> Feedback
              {feedback.length > 0 && (
                <span className="bg-zinc-900 text-white text-[10px] px-1.5 py-0.5 rounded-full">{feedback.length}</span>
              )}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-500 hidden sm:inline">{user.email}</span>
          <button onClick={logout} className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto p-6 sm:p-8">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
              {activeTab === 'feedback' ? 'Student Feedback' : (selectedCourse ? selectedCourse.name : 'Course Management')}
            </h1>
            <p className="text-zinc-500 mt-1 text-sm">
              {activeTab === 'feedback' 
                ? 'Review suggestions and feature requests from your students.'
                : (selectedCourse 
                  ? `Managing updates for ${selectedCourse.code}` 
                  : 'Create and manage academic courses and student enrollments.')}
            </p>
          </div>
          <div className="flex gap-3">
            {activeTab === 'courses' && selectedCourse && (
              <>
                <button 
                  onClick={() => setIsBulkCreating(true)}
                  className="flex items-center gap-2 bg-white border border-zinc-200 text-zinc-600 px-4 py-2.5 rounded-xl font-medium hover:bg-zinc-50 transition-all"
                >
                  <Repeat size={18} /> Bulk Add
                </button>
                <button 
                  onClick={() => setIsCreatingUpdate(true)}
                  className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-zinc-800 transition-all"
                >
                  <Plus size={18} /> Add Update
                </button>
              </>
            )}
            {activeTab === 'courses' && !selectedCourse && (
              <button 
                onClick={() => setIsCreatingCourse(true)}
                className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-zinc-800 transition-all"
              >
                <Plus size={18} /> Create Course
              </button>
            )}
            {selectedCourse && (
              <button 
                onClick={() => setSelectedCourse(null)}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Back to Courses
              </button>
            )}
          </div>
        </header>

        <AnimatePresence>
          {isBulkCreating && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-md"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-3xl shadow-2xl border border-zinc-200 w-full max-w-md overflow-hidden"
              >
                <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-zinc-900">Bulk Add Updates</h2>
                  <button onClick={() => setIsBulkCreating(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                    <XCircle size={20} />
                  </button>
                </div>
                
                <form onSubmit={handleBulkCreate} className="p-6 space-y-6">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Start Date</label>
                    <input 
                      required
                      type="date" 
                      value={bulkStartDate}
                      onChange={e => setBulkStartDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Duration (Weeks)</label>
                    <input 
                      required
                      type="number" 
                      min="1"
                      max="12"
                      value={bulkWeeks}
                      onChange={e => setBulkWeeks(parseInt(e.target.value))}
                      className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Days of Week</label>
                    <div className="grid grid-cols-4 gap-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            if (bulkDays.includes(i)) {
                              setBulkDays(bulkDays.filter(d => d !== i));
                            } else {
                              setBulkDays([...bulkDays, i]);
                            }
                          }}
                          className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                            bulkDays.includes(i) 
                              ? 'bg-zinc-900 text-white border-zinc-900' 
                              : 'bg-white text-zinc-400 border-zinc-200 hover:border-zinc-300'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <button 
                    type="submit"
                    className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20"
                  >
                    Generate Updates
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isCreatingCourse && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-md p-8">
                <h2 className="text-xl font-bold text-zinc-900 mb-6">New Course</h2>
                <form onSubmit={handleCreateCourse} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Course Name</label>
                    <input 
                      type="text" 
                      required
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                      placeholder="e.g. Advanced Mathematics"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Course Code</label>
                    <input 
                      type="text" 
                      required
                      value={newCode}
                      onChange={e => setNewCode(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                      placeholder="e.g. MATH401"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Description</label>
                    <textarea 
                      value={newDesc}
                      onChange={e => setNewDesc(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all h-24 resize-none"
                      placeholder="Brief course overview..."
                    />
                  </div>
                  {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => setIsCreatingCourse(false)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 bg-zinc-900 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-zinc-800 transition-colors"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {isCreatingUpdate && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-zinc-200 w-full max-w-md p-8">
                <h2 className="text-xl font-bold text-zinc-900 mb-6">Add Update</h2>
                <form onSubmit={handleCreateUpdate} className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-1">
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">#</label>
                      <input 
                        type="number" 
                        required
                        value={updateNum}
                        onChange={e => setUpdateNum(parseInt(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Update Title</label>
                      <input 
                        type="text" 
                        required
                        value={updateTitle}
                        onChange={e => setUpdateTitle(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                        placeholder="e.g. Introduction to Derivatives"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Date</label>
                    <input 
                      type="datetime-local" 
                      required
                      value={updateDate}
                      onChange={e => setUpdateDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                    />
                  </div>
                  {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
                  <div className="flex gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => setIsCreatingUpdate(false)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 bg-zinc-900 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-zinc-800 transition-colors"
                    >
                      Add Update
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {editingContentUpdate && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-md"
            >
              <div className="bg-white rounded-3xl shadow-2xl border border-zinc-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
                  <div>
                    <h2 className="text-xl font-bold text-zinc-900">Update Content</h2>
                    <p className="text-sm text-zinc-500">Update {editingContentUpdate.session_number}: {editingContentUpdate.title}</p>
                  </div>
                  <button onClick={() => setEditingContentUpdate(null)} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="p-8 overflow-y-auto space-y-8">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <FileText size={14} /> Summary
                    </label>
                    <textarea 
                      value={summary}
                      onChange={e => setSummary(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all h-32 resize-none text-sm leading-relaxed"
                      placeholder="Provide a detailed summary of what was covered in this class..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <List size={14} /> Key Points
                    </label>
                    <div className="space-y-2">
                      {keyPoints.map((point, i) => (
                        <div key={i} className="flex gap-2">
                          <input 
                            value={point}
                            onChange={e => {
                              const newPoints = [...keyPoints];
                              newPoints[i] = e.target.value;
                              setKeyPoints(newPoints);
                            }}
                            className="flex-1 px-4 py-2 rounded-xl border border-zinc-200 text-sm"
                            placeholder={`Point ${i + 1}`}
                          />
                          <button 
                            onClick={() => setKeyPoints(keyPoints.filter((_, idx) => idx !== i))}
                            className="p-2 text-zinc-400 hover:text-red-500"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => setKeyPoints([...keyPoints, ''])}
                        className="text-xs font-bold text-zinc-900 hover:underline flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Point
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <AlertCircle size={14} /> Assessment Reminder
                    </label>
                    <input 
                      value={assessmentReminder}
                      onChange={e => setAssessmentReminder(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all text-sm"
                      placeholder="e.g. Quiz on Friday covering these topics"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Save size={14} /> Files / Resources
                    </label>
                    <div className="space-y-4">
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-300 border-dashed rounded-2xl cursor-pointer bg-zinc-50 hover:bg-zinc-100 transition-all">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Plus className="w-8 h-8 mb-3 text-zinc-400" />
                            <p className="mb-2 text-sm text-zinc-500 font-semibold">
                              {isUploading ? 'Uploading...' : 'Click to upload PDF or resource'}
                            </p>
                            <p className="text-xs text-zinc-400">PDF, DOCX, or ZIP (MAX. 10MB)</p>
                          </div>
                          <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.docx,.zip" />
                        </label>
                      </div>

                      <div className="space-y-2">
                        {files.map((file, i) => (
                          <div key={i} className="flex gap-2">
                            <input 
                              value={file.name}
                              onChange={e => {
                                const newFiles = [...files];
                                newFiles[i].name = e.target.value;
                                setFiles(newFiles);
                              }}
                              className="flex-1 px-4 py-2 rounded-xl border border-zinc-200 text-sm"
                              placeholder="File Name"
                            />
                            <input 
                              value={file.url}
                              onChange={e => {
                                const newFiles = [...files];
                                newFiles[i].url = e.target.value;
                                setFiles(newFiles);
                              }}
                              className="flex-1 px-4 py-2 rounded-xl border border-zinc-200 text-sm"
                              placeholder="URL"
                            />
                            <button 
                              onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                              className="p-2 text-zinc-400 hover:text-red-500"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 flex gap-3">
                  <button 
                    onClick={() => setEditingContentUpdate(null)}
                    className="flex-1 px-4 py-3 rounded-2xl border border-zinc-200 font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
                  >
                    Discard Changes
                  </button>
                  <button 
                    onClick={handleSaveContent}
                    className="flex-1 bg-zinc-900 text-white px-4 py-3 rounded-2xl font-medium hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save size={18} /> Save Content
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {activeTab === 'feedback' ? (
          <div className="grid grid-cols-1 gap-4">
            {feedback.length === 0 ? (
              <div className="bg-white border border-dashed border-zinc-200 rounded-3xl p-12 text-center">
                <MessageSquare className="mx-auto text-zinc-200 mb-4" size={48} />
                <p className="text-zinc-400">No feedback received yet.</p>
              </div>
            ) : (
              feedback.map(item => (
                <div key={item.id} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        item.type === 'suggestion' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                      }`}>
                        {item.type}
                      </div>
                      <span className="text-sm font-medium text-zinc-900">{item.student_email}</span>
                      {item.student_phone && (
                        <a 
                          href={`https://wa.me/${item.student_phone.replace(/\D/g, '')}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full transition-colors"
                        >
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                          {item.student_phone}
                        </a>
                      )}
                    </div>
                    <span className="text-xs text-zinc-400">{new Date(item.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-zinc-600 text-sm leading-relaxed">{item.content}</p>
                </div>
              ))
            )}
          </div>
        ) : !selectedCourse ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="bg-white h-48 rounded-2xl border border-zinc-200 animate-pulse" />
              ))
            ) : courses.length === 0 ? (
              <div className="col-span-full bg-white border border-dashed border-zinc-300 rounded-2xl p-12 text-center">
                <BookOpen className="mx-auto text-zinc-300 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-zinc-900">No courses yet</h3>
                <p className="text-zinc-500 mt-1">Start by creating your first academic course.</p>
              </div>
            ) : (
              courses.map(course => (
                <motion.div 
                  layout
                  key={course.id} 
                  onClick={() => {
                    setSelectedCourse(course);
                    setUpdateNum(1); // Reset update num for next creation
                  }}
                  className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md transition-all group cursor-pointer active:scale-[0.98]"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-zinc-100 text-zinc-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                      {course.code}
                    </div>
                    <ChevronRight size={18} className="text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                  </div>
                  <h3 className="font-bold text-zinc-900 text-lg mb-2 group-hover:text-zinc-700 transition-colors">{course.name}</h3>
                  <p className="text-zinc-500 text-sm line-clamp-2 mb-6 h-10">{course.description || 'No description provided.'}</p>
                  
                  <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-zinc-600">
                      <Users size={16} />
                      <span className="text-sm font-medium">{course.student_count || 0} Students</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-400 text-xs">
                      <Calendar size={14} />
                      Manage Updates
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {updates.length === 0 ? (
              <div className="bg-white border border-dashed border-zinc-300 rounded-2xl p-12 text-center">
                <Calendar className="mx-auto text-zinc-300 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-zinc-900">No updates scheduled</h3>
                <p className="text-zinc-500 mt-1">Add your first class update for this course.</p>
              </div>
            ) : (
              updates.map(update => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={update.id}
                  className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between group"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-900 font-bold text-lg">
                      {update.session_number}
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-900">{update.title}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-zinc-400 flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(update.date).toLocaleString()}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          update.status === 'completed' 
                            ? 'bg-emerald-50 text-emerald-600' 
                            : 'bg-amber-50 text-amber-600'
                        }`}>
                          {update.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        setEditingContentUpdate(update);
                        fetchUpdateContent(update.id);
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-all"
                    >
                      <FileText size={16} /> Content
                    </button>
                    <button 
                      onClick={() => toggleUpdateStatus(update)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        update.status === 'completed'
                          ? 'text-zinc-400 hover:text-zinc-600'
                          : 'bg-zinc-900 text-white hover:bg-zinc-800'
                      }`}
                    >
                      {update.status === 'completed' ? (
                        <><Circle size={16} /> Mark as Upcoming</>
                      ) : (
                        <><CheckCircle2 size={16} /> Mark Completed</>
                      )}
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
