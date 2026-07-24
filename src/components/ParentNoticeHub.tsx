import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Send, Award, QrCode, Phone, Users, Shield, CheckCircle2, 
  AlertCircle, Search, Filter, Printer, RefreshCw, Smartphone, Check, Sparkles, 
  Share2, FileText, Calendar, Clock, Star, Trophy, Heart, Zap, UserCheck, Eye, Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { School, Student, ParentBroadcastNotice, CharacterBadge } from '../types';

interface ParentNoticeHubProps {
  school: School;
  students: Student[];
  userRole: string;
  userName: string;
  isOffline?: boolean;
}

const BADGE_CONFIGS: Record<CharacterBadge['badgeType'], { label: string; icon: any; color: string; bg: string; border: string; description: string }> = {
  'Punctuality': {
    label: 'Star Punctual',
    icon: Clock,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800',
    description: 'Consistently arrives before morning assembly'
  },
  'Academic Excellence': {
    label: 'Academic Scholar',
    icon: Star,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-200 dark:border-blue-800',
    description: 'Outstanding mastery in core & elective subjects'
  },
  'Leadership': {
    label: 'Class Leader',
    icon: Shield,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    border: 'border-purple-200 dark:border-purple-800',
    description: 'Exemplary responsibility and prefect duties'
  },
  'Sportsmanship': {
    label: 'GES Sports Star',
    icon: Trophy,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800',
    description: 'Team spirit & excellence in inter-house sports'
  },
  'Peer Mentor': {
    label: 'Peer Helper',
    icon: Heart,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/40',
    border: 'border-rose-200 dark:border-rose-800',
    description: 'Assists fellow classmates with learning & guidance'
  },
  'Creative Innovator': {
    label: 'Creative Mind',
    icon: Zap,
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    border: 'border-indigo-200 dark:border-indigo-800',
    description: 'Outstanding projects in BDT, Science & Arts'
  },
  'Model Citizen': {
    label: 'Model Student',
    icon: UserCheck,
    color: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-50 dark:bg-teal-950/40',
    border: 'border-teal-200 dark:border-teal-800',
    description: 'Strict adherence to school rules & GES discipline'
  }
};

export const ParentNoticeHub: React.FC<ParentNoticeHubProps> = ({
  school,
  students,
  userRole,
  userName,
  isOffline = false
}) => {
  const [activeTab, setActiveTab] = useState<'broadcast' | 'badges' | 'portal_slip'>('broadcast');

  // Broadcast state
  const [broadcastAudience, setBroadcastAudience] = useState<ParentBroadcastNotice['targetAudience']>('All Parents');
  const [selectedClass, setSelectedClass] = useState<string>('JHS 1');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastChannel, setBroadcastChannel] = useState<'SMS Broadcast' | 'WhatsApp Notice' | 'Portal Notice Board'>('SMS Broadcast');
  const [isSending, setIsSending] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Broadcast history state
  const [broadcasts, setBroadcasts] = useState<ParentBroadcastNotice[]>([
    {
      id: 'notif-001',
      schoolId: school.id,
      title: 'End of Term 2 Fee Payment & Reopening Notice',
      message: `Dear Parent, Term 2 at ${school.name} ends on ${school.vacationDate || '2026-08-10'}. Next Term begins on ${school.nextTermBegins || school.reopeningDate || '2026-09-08'}. Kindly settle all outstanding fees. Thank you!`,
      targetAudience: 'All Parents',
      channel: 'SMS Broadcast',
      sentBy: userName || 'School Admin',
      timestamp: new Date().toISOString(),
      recipientsCount: students.length || 120,
      status: 'Delivered'
    },
    {
      id: 'notif-002',
      schoolId: school.id,
      title: 'Terminal Report Cards & PTA Meeting',
      message: `Greetings! Terminal Report Cards for ${school.academicTerm || 'First'} Term (${school.academicYear || '2026/2027'}) are ready for collection at the school office. General PTA Meeting holds this Friday at 10:00 AM.`,
      targetAudience: 'All Parents',
      channel: 'WhatsApp Notice',
      sentBy: userName || 'Head Teacher',
      timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
      recipientsCount: students.length || 120,
      status: 'Delivered'
    }
  ]);

  // Character Badges State
  const [badges, setBadges] = useState<CharacterBadge[]>([
    {
      id: 'bdg-1',
      studentId: students[0]?.id || 'st-1',
      schoolId: school.id,
      badgeType: 'Punctuality',
      awardedBy: 'Head Teacher',
      date: new Date().toISOString().split('T')[0],
      reason: 'First student to arrive for 3 consecutive weeks',
      academicYear: school.academicYear || '2026/2027',
      academicTerm: school.academicTerm || 'First'
    },
    {
      id: 'bdg-2',
      studentId: students[0]?.id || 'st-1',
      schoolId: school.id,
      badgeType: 'Academic Excellence',
      awardedBy: 'Class Facilitator',
      date: new Date().toISOString().split('T')[0],
      reason: 'Top score in Mathematics & Integrated Science assessment',
      academicYear: school.academicYear || '2026/2027',
      academicTerm: school.academicTerm || 'First'
    }
  ]);

  const [badgeStudentId, setBadgeStudentId] = useState<string>(students[0]?.id || '');
  const [badgeType, setBadgeType] = useState<CharacterBadge['badgeType']>('Punctuality');
  const [badgeReason, setBadgeReason] = useState<string>('');
  const [badgeSearchQuery, setBadgeSearchQuery] = useState<string>('');
  const [badgeClassFilter, setBadgeClassFilter] = useState<string>('All');
  const [badgeSuccess, setBadgeSuccess] = useState<string>('');

  // Parent Slip State
  const [slipStudentId, setSlipStudentId] = useState<string>(students[0]?.id || '');
  const [slipSearch, setSlipSearch] = useState<string>('');

  useEffect(() => {
    if (students.length > 0 && !badgeStudentId) {
      setBadgeStudentId(students[0].id);
      setSlipStudentId(students[0].id);
    }
  }, [students]);

  // Compute recipient list based on audience
  const getTargetStudents = () => {
    if (broadcastAudience === 'All Parents') return students;
    if (broadcastAudience === 'Class-Specific') return students.filter(s => s.classLevel === selectedClass);
    if (broadcastAudience === 'Debtors Only') return students.filter(s => (s.feeTotal - s.feePaid) > 0);
    if (broadcastAudience === 'JHS Candidates') return students.filter(s => s.classLevel.startsWith('JHS'));
    return students;
  };

  const targetStudents = getTargetStudents();
  const validPhoneCount = targetStudents.filter(s => s.guardianPhone && s.guardianPhone.trim().length >= 9).length;

  // Preset Template loader
  const applyPresetTemplate = (type: 'fees' | 'report' | 'pta' | 'reopening' | 'bece') => {
    const sysTerm = school.academicTerm || 'First';
    const sysYr = school.academicYear || '2026/2027';
    const nextTermDate = school.nextTermBegins || school.reopeningDate || '2026-09-08';

    if (type === 'fees') {
      setBroadcastTitle('Fee Payment Notice');
      setBroadcastMessage(`Dear Parent/Guardian, This is a gentle reminder from ${school.name} regarding outstanding fees for {StudentName} ({Class}). Kindly settle all balance via MoMo or at the cash office. Thank you.`);
    } else if (type === 'report') {
      setBroadcastTitle('Terminal Report Cards Ready');
      setBroadcastMessage(`Dear Parent, Terminal Report Cards for ${sysTerm} Term (${sysYr}) are now available. Next Term Begins on ${nextTermDate}. Please log into the parent portal or visit the school office.`);
    } else if (type === 'pta') {
      setBroadcastTitle('General PTA Meeting Notice');
      setBroadcastMessage(`Notice to all Parents/Guardians of ${school.name}: General PTA Meeting holds on Friday at 10:00 AM at the School Assembly Hall. Attendance is strictly required.`);
    } else if (type === 'reopening') {
      setBroadcastTitle('School Reopening Notice');
      setBroadcastMessage(`Notice from ${school.name}: The school officially reopens for Next Term on ${nextTermDate} at 7:30 AM. Ensure your child reports in full uniform with required learning materials.`);
    } else if (type === 'bece') {
      setBroadcastTitle('BECE Mock Examination Notice');
      setBroadcastMessage(`Dear Parents of JHS Candidates at ${school.name}: BECE Mock Results & Registration Verification Slips are ready. Kindly review candidate bio-data with the Headteacher.`);
    }
  };

  const handleSendBroadcast = () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
    setIsSending(true);
    setBroadcastSuccess('');

    setTimeout(() => {
      const newNotice: ParentBroadcastNotice = {
        id: 'notif-' + Date.now(),
        schoolId: school.id,
        title: broadcastTitle,
        message: broadcastMessage,
        targetAudience: broadcastAudience,
        targetClass: broadcastAudience === 'Class-Specific' ? selectedClass : undefined,
        channel: broadcastChannel,
        sentBy: userName || 'School Admin',
        timestamp: new Date().toISOString(),
        recipientsCount: validPhoneCount || targetStudents.length,
        status: 'Delivered'
      };

      setBroadcasts([newNotice, ...broadcasts]);
      setIsSending(false);
      setBroadcastSuccess(`Broadcast successfully dispatched to ${validPhoneCount} parent phone numbers via ${broadcastChannel}!`);
      setBroadcastTitle('');
      setBroadcastMessage('');
      setTimeout(() => setBroadcastSuccess(''), 5000);
    }, 1200);
  };

  const handleAwardBadge = () => {
    if (!badgeStudentId) return;
    const student = students.find(s => s.id === badgeStudentId);
    if (!student) return;

    const newBadge: CharacterBadge = {
      id: 'bdg-' + Date.now(),
      studentId: student.id,
      schoolId: school.id,
      badgeType: badgeType,
      awardedBy: userName || 'Class Facilitator',
      date: new Date().toISOString().split('T')[0],
      reason: badgeReason.trim() || BADGE_CONFIGS[badgeType].description,
      academicYear: school.academicYear || '2026/2027',
      academicTerm: school.academicTerm || 'First'
    };

    setBadges([newBadge, ...badges]);
    setBadgeReason('');
    setBadgeSuccess(`Successfully awarded "${BADGE_CONFIGS[badgeType].label}" badge to ${student.fullName}!`);
    setTimeout(() => setBadgeSuccess(''), 4000);
  };

  const selectedSlipStudent = students.find(s => s.id === slipStudentId) || students[0];
  const studentBadges = badges.filter(b => b.studentId === selectedSlipStudent?.id);

  // Filtered badges list for badge wall
  const filteredBadgesList = badges.filter(b => {
    const student = students.find(s => s.id === b.studentId);
    if (!student) return false;
    const matchesSearch = student.fullName.toLowerCase().includes(badgeSearchQuery.toLowerCase()) || 
                          student.admissionNo.toLowerCase().includes(badgeSearchQuery.toLowerCase());
    const matchesClass = badgeClassFilter === 'All' || student.classLevel === badgeClassFilter;
    return matchesSearch && matchesClass;
  });

  const uniqueClasses = Array.from(new Set(students.map(s => s.classLevel))).sort();

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Parent-Teacher Bridge & Student Recognition Hub</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Parent Broadcast & Character Badges
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Dispatch instant SMS & WhatsApp notices to parents, award GES conduct & character badges, and issue printable Parent Access Slips.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition shadow-lg cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Access Slip</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 border-t border-slate-800 pt-4">
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'broadcast'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>SMS & Parent Broadcasts</span>
          </button>

          <button
            onClick={() => setActiveTab('badges')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'badges'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Student Character Badges ({badges.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('portal_slip')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'portal_slip'
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Parent Portal Access Slips</span>
          </button>
        </div>
      </div>

      {/* TAB 1: SMS & PARENT BROADCAST */}
      {activeTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Dispatch Panel */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Create Parent Broadcast</h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Send bulk SMS or WhatsApp notices to student guardians</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3 py-1 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
                <Users className="w-3.5 h-3.5" />
                <span>{validPhoneCount} Parent Contacts Ready</span>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Quick Template Presets
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyPresetTemplate('fees')}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-[11px] font-semibold hover:bg-amber-100 transition cursor-pointer"
                >
                  💳 Fee Payment Reminder
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetTemplate('report')}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-[11px] font-semibold hover:bg-blue-100 transition cursor-pointer"
                >
                  📄 Terminal Report Card
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetTemplate('reopening')}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold hover:bg-emerald-100 transition cursor-pointer"
                >
                  🏫 Next Term Reopening
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetTemplate('pta')}
                  className="px-2.5 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-[11px] font-semibold hover:bg-purple-100 transition cursor-pointer"
                >
                  🤝 PTA Meeting
                </button>
                <button
                  type="button"
                  onClick={() => applyPresetTemplate('bece')}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px] font-semibold hover:bg-rose-100 transition cursor-pointer"
                >
                  🎓 BECE Candidate Alert
                </button>
              </div>
            </div>

            {/* Target Audience & Channel */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Target Audience
                </label>
                <select
                  value={broadcastAudience}
                  onChange={(e) => setBroadcastAudience(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="All Parents">All Parents ({students.length})</option>
                  <option value="Class-Specific">Class Specific</option>
                  <option value="Debtors Only">Outstanding Fee Debtors</option>
                  <option value="JHS Candidates">JHS Candidates Only</option>
                </select>
              </div>

              {broadcastAudience === 'Class-Specific' && (
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    Select Class
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {uniqueClasses.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className={broadcastAudience === 'Class-Specific' ? '' : 'sm:col-span-2'}>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Dispatch Channel
                </label>
                <div className="flex items-center gap-2">
                  {(['SMS Broadcast', 'WhatsApp Notice', 'Portal Notice Board'] as const).map(channel => (
                    <button
                      key={channel}
                      type="button"
                      onClick={() => setBroadcastChannel(channel)}
                      className={`flex-1 py-2 px-2 rounded-xl text-[11px] font-semibold border transition cursor-pointer text-center ${
                        broadcastChannel === channel
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {channel === 'SMS Broadcast' && '📱 SMS'}
                      {channel === 'WhatsApp Notice' && '💬 WhatsApp'}
                      {channel === 'Portal Notice Board' && '📢 Portal'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Title & Message */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Notice Title / Subject
              </label>
              <input
                type="text"
                placeholder="e.g. End of Term Report Card Availability"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Message Content ({broadcastMessage.length} chars | {Math.ceil(broadcastMessage.length / 160) || 1} SMS unit)
                </label>
                <span className="text-[10px] text-slate-400">Available tags: {'{StudentName}'}, {'{Class}'}</span>
              </div>
              <textarea
                rows={4}
                placeholder="Type your notice message here..."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Alert / Status */}
            {broadcastSuccess && (
              <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl p-3 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{broadcastSuccess}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-500" />
                <span>Sender ID: <b>{school.slug ? school.slug.toUpperCase().slice(0, 11) : 'GES-BASIC'}</b></span>
              </div>

              <button
                type="button"
                onClick={handleSendBroadcast}
                disabled={isSending || !broadcastTitle || !broadcastMessage}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition shadow-md cursor-pointer"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Dispatching Broadcast...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Dispatch Broadcast to {targetStudents.length} Guardians</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Broadcast History & Logs */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Broadcast History Log</h3>
                </div>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-semibold text-slate-600 dark:text-slate-400">
                  {broadcasts.length} Sent
                </span>
              </div>

              <div className="space-y-3 mt-3 max-h-[460px] overflow-y-auto pr-1">
                {broadcasts.map((b, idx) => (
                  <div 
                    key={b.id}
                    className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-1.5 relative group"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{b.title}</span>
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                        {b.status}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed font-sans">
                      "{b.message}"
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                      <span>{b.targetAudience} ({b.recipientsCount} guardians)</span>
                      <span>{new Date(b.timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span>GES SMS Gateway Status:</span>
              <span className="font-semibold text-emerald-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Active (Ghana SMS)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CHARACTER BADGES */}
      {activeTab === 'badges' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Award Badge Panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-amber-600 dark:text-amber-400">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Award Student Character Badge</h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Recognize student discipline, academic excellence & leadership</p>
              </div>
            </div>

            {/* Select Student */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Select Student
              </label>
              <select
                value={badgeStudentId}
                onChange={(e) => setBadgeStudentId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.classLevel} - {s.admissionNo})
                  </option>
                ))}
              </select>
            </div>

            {/* Badge Category Selection */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Select Character Badge Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(Object.keys(BADGE_CONFIGS) as CharacterBadge['badgeType'][]).map(key => {
                  const cfg = BADGE_CONFIGS[key];
                  const Icon = cfg.icon;
                  const isSelected = badgeType === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setBadgeType(key)}
                      className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 cursor-pointer ${
                        isSelected
                          ? `${cfg.bg} ${cfg.border} ring-1 ring-amber-500`
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${cfg.color} flex-shrink-0`} />
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{cfg.label}</div>
                        <div className="text-[9px] text-slate-500 dark:text-slate-400 line-clamp-1">{cfg.description}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Citation / Reason */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Citation / Recommendation Note
              </label>
              <textarea
                rows={3}
                placeholder="Specific commendation reason (e.g. Exhibited exemplary leadership during school cleanup)"
                value={badgeReason}
                onChange={(e) => setBadgeReason(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {badgeSuccess && (
              <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl p-3 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{badgeSuccess}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleAwardBadge}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>Confer Badge & Send Praise Note</span>
            </button>
          </div>

          {/* Badges Wall & Recognition Feed */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">GES Character Badge Roll of Honor</h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Recognized students appearing on terminal reports & parent slips</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search student..."
                    value={badgeSearchQuery}
                    onChange={(e) => setBadgeSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 w-36 sm:w-44"
                  />
                </div>

                <select
                  value={badgeClassFilter}
                  onChange={(e) => setBadgeClassFilter(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
                >
                  <option value="All">All Classes</option>
                  {uniqueClasses.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Badges Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredBadgesList.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-400 space-y-2">
                  <Award className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                  <p className="text-xs">No character badges awarded yet for this filter.</p>
                </div>
              ) : (
                filteredBadgesList.map(b => {
                  const student = students.find(s => s.id === b.studentId);
                  const cfg = BADGE_CONFIGS[b.badgeType] || BADGE_CONFIGS['Punctuality'];
                  const Icon = cfg.icon;

                  return (
                    <div 
                      key={b.id}
                      className={`p-3.5 rounded-2xl border ${cfg.bg} ${cfg.border} space-y-2 relative transition hover:shadow-md`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-xl bg-white dark:bg-slate-900 border ${cfg.border} shadow-sm`}>
                            <Icon className={`w-5 h-5 ${cfg.color}`} />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {student?.fullName || 'Student'}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                              {student?.classLevel} • {student?.admissionNo}
                            </div>
                          </div>
                        </div>

                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${cfg.border} bg-white dark:bg-slate-900 ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-700 dark:text-slate-300 italic font-serif bg-white/60 dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                        "{b.reason}"
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1">
                        <span>By: {b.awardedBy}</span>
                        <span>{b.date} ({b.academicTerm} Term)</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PARENT PORTAL ACCESS SLIP */}
      {activeTab === 'portal_slip' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Selector Panel */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <QrCode className="w-5 h-5 text-indigo-500" />
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Parent Slip Generator</h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Generate printable verification slip & parent access portal card</p>
              </div>
            </div>

            {/* Select Student */}
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Select Student
              </label>
              <select
                value={slipStudentId}
                onChange={(e) => setSlipStudentId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.classLevel} - {s.admissionNo})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="font-bold text-slate-900 dark:text-slate-100">Parent Portal Direct Link</div>
              <div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 break-all p-2 bg-white dark:bg-slate-900 rounded-lg border">
                https://school.ges.gov.gh/portal/{selectedSlipStudent?.admissionNo?.toLowerCase() || 'std-101'}
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`https://school.ges.gov.gh/portal/${selectedSlipStudent?.admissionNo?.toLowerCase() || 'std-101'}`);
                  alert('Parent Portal link copied to clipboard!');
                }}
                className="w-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Parent Portal Link</span>
              </button>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Parent Access Slip</span>
            </button>
          </div>

          {/* Slip Preview Card */}
          <div className="lg:col-span-2">
            {selectedSlipStudent ? (
              <div className="bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-2xl p-6 shadow-lg space-y-6 print:border-black print:p-4 print:text-black print:bg-white text-slate-900 dark:text-slate-100 font-sans">
                {/* Header */}
                <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-4 text-center space-y-1">
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">GHANA EDUCATION SERVICE</div>
                  <h2 className="text-xl font-extrabold tracking-tight uppercase">{school.name}</h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{school.district} District • {school.region} Region • EMIS: {school.emisCode || 'GH-2026-009'}</p>
                  <div className="inline-block mt-2 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Official Parent Access & Student Status Slip
                  </div>
                </div>

                {/* Student Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Student Name</div>
                    <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{selectedSlipStudent.fullName}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Admission No.</div>
                    <div className="font-mono font-bold">{selectedSlipStudent.admissionNo}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Class Level</div>
                    <div className="font-semibold">{selectedSlipStudent.classLevel}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Guardian Contact</div>
                    <div className="font-medium">{selectedSlipStudent.guardianPhone || 'N/A'} ({selectedSlipStudent.guardianName || 'Parent'})</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Current Term</div>
                    <div className="font-semibold">{school.academicTerm || 'First'} Term ({school.academicYear || '2026/2027'})</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Fee Status</div>
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">
                      GH¢ {selectedSlipStudent.feePaid} paid / GH¢ {selectedSlipStudent.feeTotal}
                    </div>
                  </div>
                </div>

                {/* Key Academic Dates */}
                <div className="grid grid-cols-2 gap-4 text-xs bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-xl border border-indigo-200/60 dark:border-indigo-800/60">
                  <div>
                    <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Vacation Date</div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      {school.vacationDate ? new Date(school.vacationDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '2026-08-10'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Next Term Begins</div>
                    <div className="font-bold text-indigo-700 dark:text-indigo-300">
                      {school.nextTermBegins ? new Date(school.nextTermBegins).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : (school.reopeningDate ? new Date(school.reopeningDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '2026-09-08')}
                    </div>
                  </div>
                </div>

                {/* Earned Badges Section */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Character Commendations & GES Values Badges ({studentBadges.length})
                  </h3>
                  {studentBadges.length === 0 ? (
                    <div className="p-3 text-center border border-dashed rounded-xl text-slate-400 text-xs">
                      No conduct badges awarded yet for this term.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {studentBadges.map(b => {
                        const cfg = BADGE_CONFIGS[b.badgeType] || BADGE_CONFIGS['Punctuality'];
                        const Icon = cfg.icon;
                        return (
                          <div key={b.id} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${cfg.color}`} />
                            <div>
                              <div className="text-xs font-bold">{cfg.label}</div>
                              <div className="text-[10px] text-slate-500 italic">"{b.reason}"</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer Signature & Verification QR */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Headteacher Approval</div>
                    <div className="font-serif italic font-bold text-slate-800 dark:text-slate-200">{school.headTeacherName || 'Headmaster/Headmistress'}</div>
                    <div className="text-[10px] text-slate-500">Official Stamp & Signature</div>
                  </div>

                  <div className="text-center space-y-1">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 flex items-center justify-center mx-auto text-[9px] font-mono text-slate-500">
                      [QR VERIFY]
                    </div>
                    <div className="text-[9px] text-slate-400">Scan to Verify Record</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                Select a student to generate their Parent Access Slip.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
