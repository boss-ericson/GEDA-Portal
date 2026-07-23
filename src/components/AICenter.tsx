import React, { useState, useEffect } from 'react';
import { 
  Sparkles, BookOpen, Calendar, FileText, UserCheck, 
  Send, Copy, Printer, Check, Download, Bookmark, 
  Trash2, HelpCircle, Layers, RefreshCw, MessageSquare, 
  School as SchoolIcon, ShieldAlert, Award, ChevronRight,
  Brain, FileSpreadsheet, Mail
} from 'lucide-react';
import { School, Student, Role } from '../types';

interface AICenterProps {
  school: School;
  students: Student[];
  user?: any;
  role: Role;
}

interface SavedDoc {
  id: string;
  title: string;
  type: string;
  content: string;
  date: string;
  level?: string;
  subject?: string;
}

const GHANA_LEVELS = [
  "KG 1", "KG 2",
  "Basic 1", "Basic 2", "Basic 3", "Basic 4", "Basic 5", "Basic 6",
  "Basic 7 (JHS 1)", "Basic 8 (JHS 2)", "Basic 9 (JHS 3)"
];

const GHANA_SUBJECTS = [
  "Integrated Science",
  "Mathematics",
  "English Language",
  "Social Studies",
  "Computing / ICT",
  "Creative Arts & Design",
  "Career Technology",
  "Ghanaian Language & Culture (Asante Twi / Ga / Ewe / Fante)",
  "Religious & Moral Education (RME)",
  "Physical & Health Education (PHE)"
];

export default function AICenter({ school, students, user, role }: AICenterProps) {
  const [activeTool, setActiveTool] = useState<
    'lesson-plan' | 'scheme-of-learning' | 'exam-paper' | 'remarks' | 'circular' | 'chat' | 'saved'
  >('lesson-plan');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Output Result State
  const [generatedOutput, setGeneratedOutput] = useState<string>('');
  const [outputTitle, setOutputTitle] = useState<string>('');

  // Local Storage for Saved AI Docs
  const [savedDocs, setSavedDocs] = useState<SavedDoc[]>(() => {
    try {
      const stored = localStorage.getItem(`geda_ai_docs_${school.id}`);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`geda_ai_docs_${school.id}`, JSON.stringify(savedDocs));
    } catch (e) {
      console.error('Failed to save docs to storage');
    }
  }, [savedDocs, school.id]);

  // Form State: Lesson Plan
  const [lpLevel, setLpLevel] = useState('Basic 7 (JHS 1)');
  const [lpSubject, setLpSubject] = useState('Integrated Science');
  const [lpStrand, setLpStrand] = useState('Diversity of Matter');
  const [lpSubStrand, setLpSubStrand] = useState('Living and Non-Living Things');
  const [lpStandard, setLpStandard] = useState('B7.1.1.1');
  const [lpIndicator, setLpIndicator] = useState('B7.1.1.1.1');
  const [lpTopic, setLpTopic] = useState('Cells as the Basic Units of Life');
  const [lpDuration, setLpDuration] = useState('60 mins');
  const [lpClassSize, setLpClassSize] = useState('45 learners');
  const [lpTlms, setLpTlms] = useState('Charts of plant/animal cells, onion skin slides, microscope diagrams, realia');

  // Form State: Scheme of Learning
  const [solLevel, setSolLevel] = useState('Basic 8 (JHS 2)');
  const [solSubject, setSolSubject] = useState('Mathematics');
  const [solTerm, setSolTerm] = useState('1');
  const [solWeeks, setSolWeeks] = useState('12');

  // Form State: Exam Paper
  const [examLevel, setExamLevel] = useState('Basic 9 (JHS 3)');
  const [examSubject, setExamSubject] = useState('Social Studies');
  const [examTopic, setExamTopic] = useState('Governance, Politics & BECE Mock Scope');
  const [examMcq, setExamMcq] = useState('10');
  const [examTheory, setExamTheory] = useState('3');
  const [examDifficulty, setExamDifficulty] = useState('BECE Standard');
  const [examAnswers, setExamAnswers] = useState(true);

  // Form State: Learner Remarks
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [remStudentName, setRemStudentName] = useState('Kwame Boateng');
  const [remLevel, setRemLevel] = useState('Basic 6');
  const [remGender, setRemGender] = useState('Male');
  const [remScore, setRemScore] = useState('86% (Grade A - Distinction)');
  const [remAttendance, setRemAttendance] = useState('58 out of 60 days');
  const [remConduct, setRemConduct] = useState('Respectful, punctual, highly cooperative');
  const [remTraits, setRemTraits] = useState('Excellent critical thinking, strong leadership skills');

  // Form State: Circular
  const [circPurpose, setCircPurpose] = useState('End of Term Vacation & PTA General Meeting');
  const [circDates, setCircDates] = useState('Vacation: 12th April | Reopening: 6th May | PTA Meeting: 25th April at 10:00 AM');
  const [circVenue, setCircVenue] = useState('School Assembly Hall');
  const [circDetails, setCircDetails] = useState('Next Term School Fee: GHS 850 (payable via Mobile Money or Direct Bank Deposit). All arrears must be cleared before reopening.');

  // Form State: Chat Assistant
  const [chatQuery, setChatQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: `Akwaaba! I am your NaCCA AI Teaching Assistant. How can I assist you today with Ghanaian curriculum lesson ideas, TLM suggestions, or classroom strategies?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Handle student select for Remarks
  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentId(studentId);
    const stu = students.find(s => s.id === studentId);
    if (stu) {
      setRemStudentName(stu.fullName);
      setRemLevel(stu.classLevel || 'Basic 7 (JHS 1)');
      setRemGender(stu.gender || 'Learner');
    }
  };

  const generateClientFallbackDoc = (type: string, schoolName: string, params: any) => {
    if (type === 'lesson-plan') {
      const { level, subject, strand, subStrand, contentStandard, indicator, topic, duration, classSize, tlms } = params || {};
      return `### NaCCA STANDARD-BASED LESSON PLAN
**SCHOOL:** ${schoolName || "Ghana Basic School"}
**CLASS/LEVEL:** ${level || "Basic 7 (JHS 1)"} | **SUBJECT:** ${subject || "Integrated Science"}
**DURATION:** ${duration || "60 Mins"} | **CLASS SIZE:** ${classSize || "45 Learners"}
**STRAND:** ${strand || "Diversity of Matter"}
**SUB-STRAND:** ${subStrand || "Living and Non-Living Things"}
**CONTENT STANDARD:** ${contentStandard || "B7.1.1.1"}
**PERFORMANCE INDICATOR:** ${indicator || "B7.1.1.1.1 - Demonstrate understanding of cell structures"}
**CORE COMPETENCIES:** Critical Thinking, Problem Solving, Communication and Collaboration.
**TLMs:** ${tlms || "Microscope diagrams, plant and animal cell wall charts, onion skin slides, realia."}

---

#### PHASE 1: STARTER / WARM-UP (10 MINS)
1. **Prior Knowledge Check:** Ask learners to list basic living organisms in their local community.
2. **Hook Activity:** Display an onion and ask learners what tiny units build up the entire onion.
3. **Learning Target Statement:** By the end of this lesson, learners will identify and describe the basic parts of plant and animal cells.

#### PHASE 2: MAIN / TEACHING & LEARNING ACTIVITIES (35 MINS)
1. **Step 1 (Teacher Demonstration):** Explain the cell as the basic structural and functional unit of life.
2. **Step 2 (Group Investigation):** Divide learners into small mixed-gender groups. Provide cell wall charts and ask groups to compare plant and animal cells.
3. **Step 3 (Learner Presentation):** Group representatives present their findings on cell organelles (nucleus, cytoplasm, cell membrane).
4. **Step 4 (Differentiation & Inclusion):** Assist learners who require visual reinforcement using enlarged cell diagrams.

#### PHASE 3: PLENARY / REFLECTION & ASSESSMENT (15 MINS)
1. **Summary Review:** Review key differences between plant and animal cells with rapid-fire questions.
2. **Class Exercise / Assessment:**
   - Define a cell.
   - List two functions of the cell membrane.
3. **Home Project:** Draw and label a plant cell neatly in exercise books.`;
    } else if (type === 'scheme-of-learning') {
      const { level, subject, term, totalWeeks } = params || {};
      return `### NaCCA SCHEME OF LEARNING (SOL)
**SCHOOL:** ${schoolName || "Ghana Basic School"}
**CLASS/LEVEL:** ${level || "Basic 8"} | **SUBJECT:** ${subject || "Mathematics"}
**ACADEMIC TERM:** Term ${term || "1"} | **DURATION:** ${totalWeeks || 12} Weeks

| Week | Strand & Sub-strand | Content Standard & Indicator | Topic / Focus | Key TLMs | Assessment |
| --- | --- | --- | --- | --- | --- |
| **Week 1** | Number & Numeration | B8.1.1.1 (B8.1.1.1.1) | Real Number Systems & Sets | Charts, Venn Diagrams | Class Test 1 |
| **Week 2** | Number & Numeration | B8.1.1.2 (B8.1.1.2.1) | Prime Factors & Multiples | Prime Factor Trees | Group Assignment |
| **Week 3** | Algebra & Patterns | B8.2.1.1 (B8.2.1.1.1) | Algebraic Expressions | Grid Sheets, Counters | Board Exercise |
| **Week 4** | Algebra & Patterns | B8.2.1.2 (B8.2.1.2.1) | Linear Equations in 1 Variable | Balance Scale Models | Written Quiz |
| **Week 5** | Geometry & Measurement | B8.3.1.1 (B8.3.1.1.1) | Angles & Lines Geometry | Protractors, Rulers | Practical Drawing |
| **Week 6** | Mid-Term Assessment | Mid-Term Revision & Evaluation | Comprehensive Term Review | Answer Sheets | Mid-Term Exam |
| **Week 7** | Geometry & Measurement | B8.3.2.1 (B8.3.2.1.1) | Perimeter & Area of Shapes | Metric Rules, Cut-outs | Problem Set |
| **Week 8** | Handling Data | B8.4.1.1 (B8.4.1.1.1) | Frequency Tables & Tallies | Survey Sheets | Group Project |
| **Week 9** | Handling Data | B8.4.1.2 (B8.4.1.2.1) | Bar Graphs & Pie Charts | Graph Books, Color Pens | Graph Plotting |
| **Week 10** | Revision & Remediation | Revision of Difficult Concepts | BECE / WAEC Past Questions | Past Papers | Class Competition |
| **Week 11** | End of Term Examinations | Terminal Evaluation | Comprehensive Assessment | Question Papers | Terminal Exam |
| **Week 12** | Vacation & Marking | Report Cards & Parent Consultation | Performance Analysis | Cumulative Records | Parents Conference |`;
    } else if (type === 'exam-paper') {
      const { level, subject, topic, mcqCount, theoryCount, difficulty, includeAnswers } = params || {};
      return `### ${schoolName || "GHANA BASIC SCHOOL"}
**TERMINAL EXAMINATION - ACADEMIC TERM**
**SUBJECT:** ${subject || "Social Studies"} | **CLASS:** ${level || "Basic 9 (JHS 3)"}
**TIME ALLOWED:** 1 HOUR 30 MINUTES | **DIFFICULTY:** ${difficulty || "BECE Standard"}
**TOPIC / SCOPE:** ${topic || "Comprehensive Term Scope"}

---

#### SECTION A: MULTIPLE CHOICE QUESTIONS (Answer ALL questions)

1. Which organ of government is primarily responsible for making laws in Ghana?
   A) The Executive  B) The Judiciary  C) Parliament  D) The Council of State

2. The traditional leader who heads a paramount chieftaincy area in Ghana is known as:
   A) Divisional Chief  B) Paramount Chief (Omanhene)  C) Development Chief  D) Clan Head

3. Which of the following is a key requirement for promoting national unity in Ghana?
   A) Tribalism  B) Tolerance and respect for diversity  C) Nepotism  D) Political conflict

4. Environmental degradation in mining areas can be controlled effectively through:
   A) Deforestation  B) Illegal galamsey  C) Land reclamation and reforestation  D) Bush burning

5. The main objective of establishing the Economic Community of West African States (ECOWAS) is to:
   A) Fight wars  B) Promote regional economic integration  C) Rule West Africa  D) Impose taxes

---

#### SECTION B: STRUCTURED & ESSAY QUESTIONS (Answer ALL questions)

**QUESTION 1**
a) Define the term **Chieftaincy** as practiced in Ghana. *(4 marks)*
b) State and explain **three** functions of traditional authorities in national development. *(6 marks)*

**QUESTION 2**
a) Explain **two** causes of rural-urban migration in Ghana. *(4 marks)*
b) Suggest **three** measures government can put in place to curb rural-urban migration. *(6 marks)*

${includeAnswers ? `---

#### TEACHER'S MARKING SCHEME & MODEL ANSWERS

**SECTION A ANSWERS:**
1. C (Parliament) | 2. B (Paramount Chief) | 3. B (Tolerance) | 4. C (Reforestation) | 5. B (Regional Integration)

**SECTION B MODEL ANSWERS:**
- **Q1a:** Chieftaincy is an ancient system of governance where traditional leaders (chiefs and queenmothers) rule over customary territories according to native law and customs.
- **Q1b:** 1) Preservation of cultural heritage. 2) Maintenance of peace and conflict resolution. 3) Mobilizing community labor for local development projects.` : ''}`;
    } else if (type === 'remarks') {
      const { studentName, level, gender, score, attendance, conduct } = params || {};
      return `### TERMINAL REPORT REMARKS & PARENT ADVICE
**LEARNER NAME:** ${studentName || "Kwame Boateng"} | **GENDER:** ${gender || "Learner"}
**CLASS:** ${level || "Basic 7"} | **OVERALL SCORE:** ${score || "85% (Grade A)"}
**ATTENDANCE:** ${attendance || "58/60 Days"} | **CONDUCT:** ${conduct || "Polite and obedient"}

---

#### 1. CLASS TEACHER'S REMARK
${studentName} is an exceptional, disciplined, and hardworking learner who consistently demonstrates academic excellence. ${gender === 'Female' ? 'She' : 'He'} engages actively during class discussions and exhibits remarkable leadership traits among peers. With sustained focus and dedication, ${gender === 'Female' ? 'she' : 'he'} will continue to achieve top honors.

#### 2. HEADTEACHER'S ENDORSEMENT
An outstanding terminal performance. ${studentName} is commended for exemplary behavior, punctuality, and academic distinction. Keep up the brilliant effort!

#### 3. TAILORED ADVICE TO PARENTS / GUARDIANS
1. **Academic Support:** Encourage ${studentName} to maintain a daily 2-hour home reading schedule, particularly in analytical subjects.
2. **Co-curricular Encouragement:** Support ${studentName}'s involvement in STEM/Science club activities to nurture observed critical thinking skills.
3. **Administrative Note:** Please ensure all termly educational materials and school fees are prepared promptly ahead of reopening.`;
    } else if (type === 'circular') {
      const { purpose, keyDates, venue, feeOrDetails } = params || {};
      return `### ${schoolName || "GHANA EDUCATIONAL COMPLEX"}
**OFFICIAL CIRCULAR TO PARENTS & GUARDIANS**
**DATE:** ${new Date().toLocaleDateString('en-GB')} | **REF:** GEC/CIRC/${new Date().getFullYear()}/04

**SUBJECT:** ${purpose || "End of Term Vacation & School Reopening Announcement"}

Dear Parents & Guardians,

Management and staff extend our warmest greetings and heartfelt gratitude for your continued partnership and trust in educating your children at ${schoolName || "Ghana Educational Complex"}.

As we successfully conclude the current academic term, please take note of the following vital announcements:

1. **VACATION & REOPENING DATES:**
   - **Vacation Date:** ${keyDates?.split('|')[0] || "15th August"}
   - **Reopening Date:** ${keyDates?.split('|')[1] || "10th September"}

2. **PARENTS-TEACHERS ASSOCIATION (PTA) MEETING:**
   - **Venue:** ${venue || "School Main Assembly Hall"}
   - All parents are encouraged to attend as important academic progress and facility upgrade plans will be discussed.

3. **FINANCIAL & FEE PAYMENT INSTRUCTIONS:**
   - ${feeOrDetails || "School fees for the upcoming term must be paid into the school's official account or via MoMo before reopening."}

We wish all our learners a restful and enjoyable vacation.

Yours faithfully,

_______________________
**Headteacher / Administration**
${schoolName || "Ghana Educational Complex"}`;
    } else {
      return `### NaCCA AI TEACHER ASSISTANT
Thank you for your inquiry regarding Ghana's Standard-Based Curriculum (SBC) and Common Core Programme (CCP).

**Key Guidance:**
1. Focus on learner-centered activities and group investigations.
2. Utilize locally available Teaching and Learning Materials (TLMs) such as bottle caps, counters, charts, and realia.
3. Develop core competencies: Critical Thinking, Problem Solving, Communication, Collaboration, and Cultural Identity.`;
    }
  };

  const generateAIContent = async (type: string, params: any, defaultTitle: string) => {
    setIsLoading(true);
    setErrorMsg('');
    setGeneratedOutput('');
    setOutputTitle(defaultTitle);

    try {
      const res = await fetch('/api/v1/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          schoolName: school?.name || "Ghana School",
          params
        })
      });

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok && data.result) {
          setGeneratedOutput(data.result);
          return;
        }
      }

      // Fallback if non-JSON or not OK
      const fallback = generateClientFallbackDoc(type, school?.name || "Ghana School", params);
      setGeneratedOutput(fallback);
    } catch (err: any) {
      console.warn("API call failed, using client NaCCA generator fallback:", err);
      const fallback = generateClientFallbackDoc(type, school?.name || "Ghana School", params);
      setGeneratedOutput(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedOutput) return;
    navigator.clipboard.writeText(generatedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveToLibrary = () => {
    if (!generatedOutput) return;
    const newDoc: SavedDoc = {
      id: `doc_${Date.now()}`,
      title: outputTitle || 'Saved NaCCA Document',
      type: activeTool,
      content: generatedOutput,
      date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    };
    setSavedDocs(prev => [newDoc, ...prev]);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handlePrint = () => {
    if (!generatedOutput) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${outputTitle}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }
            .header h1 { margin: 0; font-size: 22px; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; }
            .header p { margin: 4px 0 0 0; font-size: 13px; color: #64748b; }
            .title { font-size: 18px; font-weight: bold; text-align: center; margin-bottom: 20px; color: #1e3a8a; }
            .content { white-space: pre-wrap; font-size: 14px; }
            .footer { margin-top: 40px; font-size: 11px; text-align: center; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${school.name}</h1>
            <p>${school.district ? school.district + ', ' : ''}${school.region || 'Ghana'} | NaCCA Standard Portal</p>
          </div>
          <div class="title">${outputTitle}</div>
          <div class="content">${generatedOutput.replace(/#/g, '')}</div>
          <div class="footer">
            Generated via ${school.name} Digital Management & NaCCA AI Center | Date: ${new Date().toLocaleDateString('en-GB')}
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuery.trim()) return;

    const userText = chatQuery.trim();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatHistory(prev => [...prev, { sender: 'user', text: userText, time: timeStr }]);
    setChatQuery('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/v1/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'chat',
          schoolName: school?.name || "Ghana School",
          params: { query: userText }
        })
      });
      
      const contentType = res.headers.get('content-type') || '';
      let replyText = '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        if (res.ok && data.result) {
          replyText = data.result;
        }
      }

      if (!replyText) {
        replyText = generateClientFallbackDoc('chat', school?.name || "Ghana School", { query: userText });
      }

      setChatHistory(prev => [
        ...prev,
        { sender: 'ai', text: replyText, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
    } catch (e) {
      const fallbackReply = generateClientFallbackDoc('chat', school?.name || "Ghana School", { query: userText });
      setChatHistory(prev => [
        ...prev,
        { sender: 'ai', text: fallbackReply, time: timeStr }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 fade-in pb-12">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 border border-amber-400/30 rounded-full text-amber-200 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
              NaCCA Standard-Based AI Studio
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">
              Ghana Education NaCCA AI Center
            </h1>
            <p className="text-amber-100/90 text-sm leading-relaxed">
              Automate standard-based lesson plans, schemes of learning, examination papers with marking schemes, and tailored parent report advice aligned with Ghana's Ministry of Education standards.
            </p>
          </div>
          <div className="bg-slate-950/40 backdrop-blur-md p-4 rounded-xl border border-white/10 text-xs space-y-2 flex-shrink-0">
            <div className="flex items-center gap-2 text-amber-300 font-semibold">
              <Award className="h-4 w-4" /> Curriculum Framework
            </div>
            <p className="text-slate-300">SBC (Kindergarten - Primary)</p>
            <p className="text-slate-300">CCP (Junior High 1 - 3)</p>
          </div>
        </div>
      </div>

      {/* TOP NAVIGATION TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => { setActiveTool('lesson-plan'); setGeneratedOutput(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeTool === 'lesson-plan'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Lesson Plan Generator
        </button>

        <button
          onClick={() => { setActiveTool('scheme-of-learning'); setGeneratedOutput(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeTool === 'scheme-of-learning'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Scheme of Learning (SOL)
        </button>

        <button
          onClick={() => { setActiveTool('exam-paper'); setGeneratedOutput(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeTool === 'exam-paper'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <FileText className="h-4 w-4" />
          Exam & Quiz Paper Builder
        </button>

        <button
          onClick={() => { setActiveTool('remarks'); setGeneratedOutput(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeTool === 'remarks'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <UserCheck className="h-4 w-4" />
          Learner Remarks & Advice
        </button>

        <button
          onClick={() => { setActiveTool('circular'); setGeneratedOutput(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeTool === 'circular'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Mail className="h-4 w-4" />
          School Circular / Notice
        </button>

        <button
          onClick={() => setActiveTool('chat')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeTool === 'chat'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          AI Teacher Assistant
        </button>

        <button
          onClick={() => setActiveTool('saved')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
            activeTool === 'saved'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Bookmark className="h-4 w-4" />
          Saved Library ({savedDocs.length})
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 p-4 rounded-xl text-xs flex items-center gap-3">
          <ShieldAlert className="h-5 w-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TOOL GRID LAYOUT: LEFT CONTROLS, RIGHT OUTPUT PREVIEW */}
      {activeTool !== 'saved' && activeTool !== 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* INPUT FORM SIDE */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            {/* 1. LESSON PLAN FORM */}
            {activeTool === 'lesson-plan' && (
              <>
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-amber-500" />
                    NaCCA Lesson Plan Setup
                  </h3>
                  <p className="text-xs text-slate-500">Generates Phase 1, Phase 2, and Phase 3 activities with TLMs.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Basic Level / Class</label>
                    <select
                      value={lpLevel}
                      onChange={e => setLpLevel(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-amber-500"
                    >
                      {GHANA_LEVELS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                    <select
                      value={lpSubject}
                      onChange={e => setLpSubject(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-amber-500"
                    >
                      {GHANA_SUBJECTS.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Strand</label>
                    <input
                      type="text"
                      value={lpStrand}
                      onChange={e => setLpStrand(e.target.value)}
                      placeholder="e.g. Diversity of Matter"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Sub-strand</label>
                    <input
                      type="text"
                      value={lpSubStrand}
                      onChange={e => setLpSubStrand(e.target.value)}
                      placeholder="e.g. Cells and Living Things"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Content Standard Code</label>
                    <input
                      type="text"
                      value={lpStandard}
                      onChange={e => setLpStandard(e.target.value)}
                      placeholder="e.g. B7.1.1.1"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Indicator Code</label>
                    <input
                      type="text"
                      value={lpIndicator}
                      onChange={e => setLpIndicator(e.target.value)}
                      placeholder="e.g. B7.1.1.1.1"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Topic / Lesson Title</label>
                  <input
                    type="text"
                    value={lpTopic}
                    onChange={e => setLpTopic(e.target.value)}
                    placeholder="e.g. Structure and Function of Plant Cells"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Duration</label>
                    <input
                      type="text"
                      value={lpDuration}
                      onChange={e => setLpDuration(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Class Size</label>
                    <input
                      type="text"
                      value={lpClassSize}
                      onChange={e => setLpClassSize(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">TLMs (Teaching Materials)</label>
                  <textarea
                    rows={2}
                    value={lpTlms}
                    onChange={e => setLpTlms(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <button
                  onClick={() => generateAIContent('lesson-plan', {
                    level: lpLevel,
                    subject: lpSubject,
                    strand: lpStrand,
                    subStrand: lpSubStrand,
                    contentStandard: lpStandard,
                    indicator: lpIndicator,
                    topic: lpTopic,
                    duration: lpDuration,
                    classSize: lpClassSize,
                    tlms: lpTlms
                  }, `NaCCA Lesson Plan - ${lpSubject} (${lpLevel})`)}
                  disabled={isLoading}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {isLoading ? 'Generating NaCCA Lesson Plan...' : 'Generate NaCCA Lesson Plan'}
                </button>
              </>
            )}

            {/* 2. SCHEME OF LEARNING FORM */}
            {activeTool === 'scheme-of-learning' && (
              <>
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-amber-500" />
                    Scheme of Learning (SOL)
                  </h3>
                  <p className="text-xs text-slate-500">Generates 12-week NaCCA termly syllabus breakdown.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Class / Basic Level</label>
                  <select
                    value={solLevel}
                    onChange={e => setSolLevel(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-amber-500"
                  >
                    {GHANA_LEVELS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                  <select
                    value={solSubject}
                    onChange={e => setSolSubject(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-amber-500"
                  >
                    {GHANA_SUBJECTS.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Term</label>
                    <select
                      value={solTerm}
                      onChange={e => setSolTerm(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="1">Term 1</option>
                      <option value="2">Term 2</option>
                      <option value="3">Term 3</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Total Weeks</label>
                    <input
                      type="number"
                      value={solWeeks}
                      onChange={e => setSolWeeks(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <button
                  onClick={() => generateAIContent('scheme-of-learning', {
                    level: solLevel,
                    subject: solSubject,
                    term: solTerm,
                    totalWeeks: solWeeks
                  }, `Scheme of Learning - ${solSubject} (${solLevel}, Term ${solTerm})`)}
                  disabled={isLoading}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {isLoading ? 'Generating Scheme of Learning...' : 'Generate Termly Scheme of Learning'}
                </button>
              </>
            )}

            {/* 3. EXAM PAPER FORM */}
            {activeTool === 'exam-paper' && (
              <>
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                    <FileText className="h-5 w-5 text-amber-500" />
                    Exam & Quiz Paper Builder
                  </h3>
                  <p className="text-xs text-slate-500">Builds MCQs, Section B Theory, and Teacher's Marking Scheme.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Class / Level</label>
                    <select
                      value={examLevel}
                      onChange={e => setExamLevel(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-amber-500"
                    >
                      {GHANA_LEVELS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                    <select
                      value={examSubject}
                      onChange={e => setExamSubject(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-amber-500"
                    >
                      {GHANA_SUBJECTS.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Topic / Exam Scope</label>
                  <input
                    type="text"
                    value={examTopic}
                    onChange={e => setExamTopic(e.target.value)}
                    placeholder="e.g. End of Term 2 Examination / BECE Mock"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Section A (MCQs Count)</label>
                    <input
                      type="number"
                      value={examMcq}
                      onChange={e => setExamMcq(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Section B (Theory Questions)</label>
                    <input
                      type="number"
                      value={examTheory}
                      onChange={e => setExamTheory(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Difficulty Standard</label>
                  <select
                    value={examDifficulty}
                    onChange={e => setExamDifficulty(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Basic Practice">Basic Practice</option>
                    <option value="Moderate Standard">Moderate Standard</option>
                    <option value="BECE Standard">BECE Standard (High Rigor)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="chkAnswers"
                    checked={examAnswers}
                    onChange={e => setExamAnswers(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                  />
                  <label htmlFor="chkAnswers" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    Include Teacher's Marking Scheme & Answers
                  </label>
                </div>

                <button
                  onClick={() => generateAIContent('exam-paper', {
                    level: examLevel,
                    subject: examSubject,
                    topic: examTopic,
                    mcqCount: examMcq,
                    theoryCount: examTheory,
                    difficulty: examDifficulty,
                    includeAnswers: examAnswers
                  }, `Examination Paper - ${examSubject} (${examLevel})`)}
                  disabled={isLoading}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {isLoading ? 'Generating Exam Paper...' : 'Generate Exam Paper & Answers'}
                </button>
              </>
            )}

            {/* 4. LEARNER REMARKS FORM */}
            {activeTool === 'remarks' && (
              <>
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-amber-500" />
                    Learner Terminal Remarks & Advice
                  </h3>
                  <p className="text-xs text-slate-500">Generates custom report card remarks & home support guidance.</p>
                </div>

                {students.length > 0 && (
                  <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
                    <label className="block text-[11px] font-bold text-amber-800 dark:text-amber-300 mb-1">
                      Quick Pick Enrolled Student:
                    </label>
                    <select
                      value={selectedStudentId}
                      onChange={e => handleStudentSelect(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700/50 rounded-lg p-1.5 text-xs font-medium"
                    >
                      <option value="">-- Select Student from Roster --</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.fullName} ({s.classLevel || 'Basic Level'})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Learner Full Name</label>
                    <input
                      type="text"
                      value={remStudentName}
                      onChange={e => setRemStudentName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Gender</label>
                    <select
                      value={remGender}
                      onChange={e => setRemGender(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Male">Male (Boy)</option>
                      <option value="Female">Female (Girl)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Class / Level</label>
                    <select
                      value={remLevel}
                      onChange={e => setRemLevel(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-medium focus:ring-2 focus:ring-amber-500"
                    >
                      {GHANA_LEVELS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Total Score / Grade</label>
                    <input
                      type="text"
                      value={remScore}
                      onChange={e => setRemScore(e.target.value)}
                      placeholder="e.g. 88% Grade A"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Attendance & Punctuality</label>
                    <input
                      type="text"
                      value={remAttendance}
                      onChange={e => setRemAttendance(e.target.value)}
                      placeholder="e.g. 58/60 days"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Conduct & Attitude</label>
                    <input
                      type="text"
                      value={remConduct}
                      onChange={e => setRemConduct(e.target.value)}
                      placeholder="e.g. Polite, obedient"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Key Strengths & Competencies</label>
                  <input
                    type="text"
                    value={remTraits}
                    onChange={e => setRemTraits(e.target.value)}
                    placeholder="e.g. Good in problem solving, active group leader"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <button
                  onClick={() => generateAIContent('remarks', {
                    studentName: remStudentName,
                    level: remLevel,
                    gender: remGender,
                    score: remScore,
                    attendance: remAttendance,
                    conduct: remConduct,
                    competencies: remTraits
                  }, `Terminal Remark & Advice - ${remStudentName}`)}
                  disabled={isLoading}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {isLoading ? 'Generating Remarks...' : 'Generate Terminal Remarks & Parent Advice'}
                </button>
              </>
            )}

            {/* 5. CIRCULAR FORM */}
            {activeTool === 'circular' && (
              <>
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                    <Mail className="h-5 w-5 text-amber-500" />
                    School Notice & Parent Circular
                  </h3>
                  <p className="text-xs text-slate-500">Formal letters for PTA meetings, vacation, fee notices, and events.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Purpose / Title of Circular</label>
                  <input
                    type="text"
                    value={circPurpose}
                    onChange={e => setCircPurpose(e.target.value)}
                    placeholder="e.g. End of Term Vacation & Fee Payment Reminder"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Key Dates & Deadlines</label>
                  <input
                    type="text"
                    value={circDates}
                    onChange={e => setCircDates(e.target.value)}
                    placeholder="e.g. Vacation: 12th April, Reopening: 6th May"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Venue / Event Location</label>
                  <input
                    type="text"
                    value={circVenue}
                    onChange={e => setCircVenue(e.target.value)}
                    placeholder="e.g. School Assembly Hall"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Fees or Additional Instructions</label>
                  <textarea
                    rows={2}
                    value={circDetails}
                    onChange={e => setCircDetails(e.target.value)}
                    placeholder="e.g. School Fees for Next Term GHS 850..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <button
                  onClick={() => generateAIContent('circular', {
                    purpose: circPurpose,
                    keyDates: circDates,
                    venue: circVenue,
                    feeOrDetails: circDetails
                  }, `School Notice - ${circPurpose}`)}
                  disabled={isLoading}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {isLoading ? 'Drafting Circular...' : 'Draft Official Parent Circular'}
                </button>
              </>
            )}
          </div>

          {/* OUTPUT PREVIEW PANEL */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm min-h-[500px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <SchoolIcon className="h-5 w-5 text-amber-500" />
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {outputTitle || 'NaCCA AI Document Preview'}
                    </h3>
                    <p className="text-[11px] text-slate-500">{school.name} Document Engine</p>
                  </div>
                </div>

                {generatedOutput && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleCopy}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1 transition cursor-pointer"
                      title="Copy to Clipboard"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      onClick={handlePrint}
                      className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg flex items-center gap-1 transition cursor-pointer"
                      title="Print Document"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Print</span>
                    </button>

                    <button
                      onClick={handleSaveToLibrary}
                      className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-semibold rounded-lg flex items-center gap-1 transition cursor-pointer"
                      title="Save to Library"
                    >
                      {savedSuccess ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Bookmark className="h-3.5 w-3.5" />}
                      <span>{savedSuccess ? 'Saved!' : 'Save'}</span>
                    </button>
                  </div>
                )}
              </div>

              {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin"></div>
                    <Sparkles className="h-5 w-5 text-amber-500 absolute inset-0 m-auto animate-pulse" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Processing NaCCA Standard AI Output...</p>
                    <p className="text-xs text-slate-500">Aligning with Ghana SBC / CCP curriculum requirements</p>
                  </div>
                </div>
              ) : generatedOutput ? (
                <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-sans leading-relaxed max-h-[550px] overflow-y-auto">
                  {generatedOutput}
                </div>
              ) : (
                <div className="py-24 text-center space-y-3">
                  <Brain className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto" />
                  <div>
                    <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Ready to Generate</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Fill out the form on the left and click Generate to produce custom NaCCA documents instantly.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {generatedOutput && (
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Verified NaCCA Curriculum Format</span>
                <span>{school.name} AI Hub</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHAT ASSISTANT TAB */}
      {activeTool === 'chat' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="p-2 bg-amber-500/20 text-amber-500 rounded-xl">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                NaCCA AI Teacher Assistant & Pedagogy Consultant
              </h3>
              <p className="text-xs text-slate-500">
                Ask anything about Ghanaian lesson starter hooks, local TLMs, classroom discipline, or subject strategies.
              </p>
            </div>
          </div>

          <div className="space-y-3 min-h-[350px] max-h-[500px] overflow-y-auto p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col max-w-[85%] ${
                  msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-amber-500 text-slate-950 font-medium rounded-br-none'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
              </div>
            ))}

            {isLoading && (
              <div className="mr-auto items-start flex gap-2 items-center bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-500" />
                <span>NaCCA AI Assistant is thinking...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleChatSubmit} className="flex gap-2">
            <input
              type="text"
              value={chatQuery}
              onChange={e => setChatQuery(e.target.value)}
              placeholder="Ask a question e.g. How can I explain fractions using local Ghanaian TLMs like bottle caps?"
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={isLoading || !chatQuery.trim()}
              className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>Send</span>
            </button>
          </form>
        </div>
      )}

      {/* SAVED LIBRARY TAB */}
      {activeTool === 'saved' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-amber-500" />
                Saved NaCCA AI Document Library
              </h3>
              <p className="text-xs text-slate-500">
                Access, view, copy, or print previously saved lesson plans, schemes, exam papers, and circulars.
              </p>
            </div>
            {savedDocs.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Clear all saved AI documents from library?')) {
                    setSavedDocs([]);
                  }
                }}
                className="text-xs text-red-500 hover:text-red-600 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear All
              </button>
            )}
          </div>

          {savedDocs.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Bookmark className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No Saved Documents Yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Generate any lesson plan or exam paper and click "Save" to build your school's AI resource library.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedDocs.map(docItem => (
                <div
                  key={docItem.id}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-amber-500/50 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-amber-500/20 text-amber-800 dark:text-amber-300 rounded">
                        {docItem.type}
                      </span>
                      <span className="text-[10px] text-slate-400">{docItem.date}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs line-clamp-2">
                      {docItem.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-3">
                      {docItem.content.substring(0, 150)}...
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setGeneratedOutput(docItem.content);
                        setOutputTitle(docItem.title);
                        setActiveTool('lesson-plan');
                      }}
                      className="px-2.5 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open Preview</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>

                    <button
                      onClick={() => setSavedDocs(prev => prev.filter(d => d.id !== docItem.id))}
                      className="p-1.5 text-slate-400 hover:text-red-500 transition cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
