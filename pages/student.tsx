import { useAuth } from './_app';
import { GraduationCap, LogOut, BookOpen, CheckCircle, Search, Clock, Calendar, ChevronRight, CheckCircle2, Circle, XCircle, FileText, AlertCircle, MessageSquarePlus, Send } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Course {
  id: number;
  name: string;
  code: string;
  description: string;
  enrolled_at?: string;
  total_updates?: number;
  completed_updates?: number;
  caught_up_updates?: number;
}

interface Update {
  id: number;
  course_id: number;
  session_number: number;
  title: string;
  date: string;
  status: 'upcoming' | 'completed';
  attendance_status?: 'attended' | 'missed' | null;
  caught_up?: boolean;
  caught_up_at?: string;
}

interface UpdateContent {
  summary: string;
  key_points: string[];
  files: { name: string; url: string }[];
  assessment_reminder: string;
}

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [viewingUpdate, setViewingUpdate] = useState<Update | null>(null);
  const [updateContent, setUpdateContent] = useState<UpdateContent | null>(null);

  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'suggestion' | 'request'>('suggestion');
  const [feedbackContent, setFeedbackContent] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedCourse) {
      fetchUpdates(selectedCourse.id);
    }
  }, [selectedCourse]);

  const fetchData = async () => {
    try {
      const [allRes, myRes] = await Promise.all([
        fetch('/api/courses'),
        fetch('/api/my-courses')
      ]);

      const allData = await allRes.json();
      const myData = await myRes.json();

      if (allRes.ok) setAvailableCourses(allData);
      if (myRes.ok) setMyCourses(myData);
    } catch (err) {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
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
        setUpdateContent({
          summary: data.summary,
          key_points: Array.isArray(data.key_points) ? data.key_points : JSON.parse(data.key_points || '[]'),
          files: Array.isArray(data.files) ? data.files : JSON.parse(data.files || '[]'),
          assessment_reminder: data.assessment_reminder
        });
      } else {
        setUpdateContent(null);
      }
    } catch (err) {
      console.error('Failed to fetch update content');
    }
  };

  const handleEnroll = async (courseId: number) => {
    setEnrollingId(courseId);
    try {
      const res = await fetch('/api/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });
      if (res.ok) {
        await fetchData();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      alert('Failed to enroll');
    } finally {
      setEnrollingId(null);
    }
  };



  const markCaughtUp = async (sessionId: number) => {
    try {
      const res = await fetch('/api/caught-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) {
        setUpdates(updates.map(u => u.id === sessionId ? { ...u, caught_up: true, caught_up_at: new Date().toISOString() } : u));
        if (viewingUpdate?.id === sessionId) {
          setViewingUpdate({ ...viewingUpdate, caught_up: true, caught_up_at: new Date().toISOString() });
        }
        fetchData(); // Refresh progress metrics
      }
    } catch (err) {
      console.error('Failed to mark caught up');
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackContent.trim()) return;

    setIsSubmittingFeedback(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: feedbackType, content: feedbackContent }),
      });
      if (res.ok) {
        setFeedbackSuccess(true);
        setFeedbackContent('');
        setTimeout(() => {
          setIsFeedbackModalOpen(false);
          setFeedbackSuccess(false);
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to submit feedback');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const isEnrolled = (courseId: number) => {
    return myCourses.some(c => c.id === courseId);
  };

  const filteredCourses = availableCourses.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      <nav className="bg-white border-b border-zinc-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white">
            <GraduationCap size={18} />
          </div>
          <span className="font-semibold text-zinc-900 tracking-tight">Student Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsFeedbackModalOpen(true)}
            className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors bg-zinc-100 px-3 py-1.5 rounded-lg"
          >
            <MessageSquarePlus size={16} /> Feedback
          </button>
          <span className="text-sm text-zinc-500 hidden sm:inline">{user.email}</span>
          <button onClick={logout} className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 sm:p-8">
        <header className="mb-12 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">
              {selectedCourse ? selectedCourse.name : 'My Academic Journey'}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-zinc-500">
              {user.institution && (
                <span className="flex items-center gap-1.5 font-medium text-zinc-700">
                  <GraduationCap size={14} className="text-zinc-400" />
                  {user.institution}
                </span>
              )}
              {user.school && (
                <span className="flex items-center gap-1.5">
                  <span className="w-1 h-1 bg-zinc-300 rounded-full hidden sm:block" />
                  {user.school}
                </span>
              )}
              {!selectedCourse && (
                <span className="flex items-center gap-1.5">
                  <span className="w-1 h-1 bg-zinc-300 rounded-full hidden sm:block" />
                  Explore available courses and track your current enrollments.
                </span>
              )}
              {selectedCourse && (
                <span className="flex items-center gap-1.5">
                  <span className="w-1 h-1 bg-zinc-300 rounded-full hidden sm:block" />
                  Viewing updates for {selectedCourse.code}
                </span>
              )}
            </div>
          </div>
          {selectedCourse && (
            <button
              onClick={() => setSelectedCourse(null)}
              className="px-4 py-2.5 rounded-xl border border-zinc-200 font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              Back to Dashboard
            </button>
          )}
        </header>

        <AnimatePresence>
          {isFeedbackModalOpen && (
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
                  <h2 className="text-xl font-bold text-zinc-900">Share Your Thoughts</h2>
                  <button onClick={() => setIsFeedbackModalOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                    <XCircle size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmitFeedback} className="p-6 space-y-4">
                  {feedbackSuccess ? (
                    <div className="py-8 text-center space-y-3">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle size={24} />
                      </div>
                      <h3 className="font-bold text-zinc-900">Feedback Received!</h3>
                      <p className="text-sm text-zinc-500">Thank you for helping us improve.</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Feedback Type</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setFeedbackType('suggestion')}
                            className={`py-2 px-4 rounded-xl text-sm font-medium border transition-all ${feedbackType === 'suggestion'
                              ? 'bg-zinc-900 text-white border-zinc-900'
                              : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
                              }`}
                          >
                            Suggestion
                          </button>
                          <button
                            type="button"
                            onClick={() => setFeedbackType('request')}
                            className={`py-2 px-4 rounded-xl text-sm font-medium border transition-all ${feedbackType === 'request'
                              ? 'bg-zinc-900 text-white border-zinc-900'
                              : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
                              }`}
                          >
                            Feature Request
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 block">Your Message</label>
                        <textarea
                          required
                          value={feedbackContent}
                          onChange={e => setFeedbackContent(e.target.value)}
                          placeholder="What can we do better?"
                          rows={4}
                          className="w-full px-4 py-3 rounded-2xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all text-sm resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingFeedback}
                        className="w-full bg-zinc-900 text-white py-3 rounded-2xl font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isSubmittingFeedback ? 'Sending...' : (
                          <>
                            <Send size={18} /> Submit Feedback
                          </>
                        )}
                      </button>
                    </>
                  )}
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {viewingUpdate && (
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
                    <p className="text-sm text-zinc-500">Update {viewingUpdate.session_number}: {viewingUpdate.title}</p>
                  </div>
                  <button onClick={() => setViewingUpdate(null)} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
                    <XCircle size={20} />
                  </button>
                </div>

                <div className="p-8 overflow-y-auto space-y-8">
                  {updateContent ? (
                    <>
                      {updateContent.summary && (
                        <div>
                          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Summary</h3>
                          <p className="text-zinc-700 leading-relaxed text-sm whitespace-pre-wrap">{updateContent.summary}</p>
                        </div>
                      )}

                      {updateContent.key_points.length > 0 && (
                        <div>
                          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Key Takeaways</h3>
                          <ul className="space-y-2">
                            {updateContent.key_points.map((point, i) => (
                              <li key={i} className="flex items-start gap-3 text-sm text-zinc-600">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-zinc-900 flex-shrink-0" />
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {updateContent.assessment_reminder && (
                        <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
                          <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
                          <div>
                            <h4 className="text-sm font-bold text-amber-900">Assessment Reminder</h4>
                            <p className="text-sm text-amber-700 mt-0.5">{updateContent.assessment_reminder}</p>
                          </div>
                        </div>
                      )}

                      {updateContent.files.length > 0 && (
                        <div>
                          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Resources</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {updateContent.files.map((file, i) => (
                              <a
                                key={i}
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 rounded-xl border border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50 transition-all group"
                              >
                                <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-500 group-hover:text-zinc-900">
                                  <FileText size={16} />
                                </div>
                                <span className="text-sm font-medium text-zinc-600 truncate">{file.name}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <Clock className="mx-auto text-zinc-200 mb-4" size={48} />
                      <p className="text-zinc-400">No content has been uploaded for this update yet.</p>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setViewingUpdate(null)}
                    className="flex-1 px-4 py-3 rounded-2xl border border-zinc-200 font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
                  >
                    Close
                  </button>
                  {viewingUpdate.caught_up ? (
                    <div className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-emerald-50 text-emerald-600 font-bold">
                      <CheckCircle2 size={20} /> Caught Up
                    </div>
                  ) : (
                    <button
                      onClick={() => markCaughtUp(viewingUpdate.id)}
                      className="flex-1 bg-zinc-900 text-white px-4 py-3 rounded-2xl font-bold hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-zinc-900/20 active:scale-95"
                    >
                      Mark as Caught Up
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!selectedCourse ? (
          <>
            <section className="mb-16">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                  <CheckCircle className="text-emerald-500" size={20} />
                  Enrolled Courses
                </h2>
                <span className="bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full text-xs font-bold">
                  {myCourses.length} ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                  Array(2).fill(0).map((_, i) => (
                    <div key={i} className="bg-white h-40 rounded-2xl border border-zinc-200 animate-pulse" />
                  ))
                ) : myCourses.length === 0 ? (
                  <div className="col-span-full bg-white border border-dashed border-zinc-200 rounded-2xl p-12 text-center">
                    <p className="text-zinc-400 font-medium">You haven't enrolled in any courses yet.</p>
                  </div>
                ) : (
                  myCourses.map(course => (
                    <motion.div
                      layout
                      key={course.id}
                      onClick={() => setSelectedCourse(course)}
                      className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm relative overflow-hidden group cursor-pointer hover:border-zinc-300 transition-all active:scale-[0.98]"
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full flex items-start justify-end p-3 text-emerald-500">
                        <ChevronRight size={16} />
                      </div>
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">{course.code}</div>
                      <h3 className="font-bold text-zinc-900 text-lg mb-4">{course.name}</h3>

                      {/* Progress Bar */}
                      {course.total_updates !== undefined && course.total_updates > 0 && (
                        <div className="mb-6">
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Course Progress</span>
                            <span className="text-xs font-bold text-zinc-900">
                              {course.caught_up_updates} of {course.total_updates} caught up
                            </span>
                          </div>
                          <div className="h-2 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/50">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(course.caught_up_updates! / course.total_updates!) * 100}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="h-full bg-zinc-900 rounded-full"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-2 text-zinc-400 text-xs">
                          <Calendar size={14} />
                          View Timetable
                        </div>
                        <div className="text-[10px] text-zinc-300">
                          Enrolled {new Date(course.enrolled_at!).toLocaleDateString()}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </section>

            <section>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                  <BookOpen className="text-zinc-900" size={20} />
                  Available Courses
                </h2>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                  Array(3).fill(0).map((_, i) => (
                    <div key={i} className="bg-white h-56 rounded-2xl border border-zinc-200 animate-pulse" />
                  ))
                ) : filteredCourses.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <p className="text-zinc-400">No courses found matching your search.</p>
                  </div>
                ) : (
                  filteredCourses.map(course => (
                    <motion.div
                      layout
                      key={course.id}
                      className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm flex flex-col hover:border-zinc-300 transition-colors"
                    >
                      <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">{course.code}</div>
                      <h3 className="font-bold text-zinc-900 text-lg mb-2">{course.name}</h3>
                      <p className="text-zinc-500 text-sm line-clamp-2 mb-6 flex-grow">{course.description || 'No description available.'}</p>

                      {isEnrolled(course.id) ? (
                        <div className="w-full py-2.5 rounded-xl bg-zinc-50 text-zinc-400 font-medium text-center text-sm flex items-center justify-center gap-2">
                          <CheckCircle size={16} /> Already Enrolled
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEnroll(course.id)}
                          disabled={enrollingId === course.id}
                          className="w-full py-2.5 rounded-xl bg-zinc-900 text-white font-medium text-sm hover:bg-zinc-800 transition-colors disabled:opacity-50 active:scale-95"
                        >
                          {enrollingId === course.id ? 'Enrolling...' : 'Enroll Now'}
                        </button>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </section>
          </>
        ) : (
          <div className="space-y-4">
            {updates.length === 0 ? (
              <div className="bg-white border border-dashed border-zinc-300 rounded-2xl p-12 text-center">
                <Calendar className="mx-auto text-zinc-300 mb-4" size={48} />
                <h3 className="text-lg font-semibold text-zinc-900">No updates scheduled</h3>
                <p className="text-zinc-500 mt-1">Check back later for class updates.</p>
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
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-zinc-900">{update.title}</h3>
                        {update.caught_up && (
                          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                            <CheckCircle2 size={10} /> CAUGHT UP
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-zinc-400 flex items-center gap-1">
                          <Calendar size={12} />
                          {new Date(update.date).toLocaleString()}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${update.status === 'completed'
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
                        setViewingUpdate(update);
                        fetchUpdateContent(update.id);
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 text-zinc-900 text-sm font-medium hover:bg-zinc-200 transition-all"
                    >
                      <FileText size={16} /> View Update
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
