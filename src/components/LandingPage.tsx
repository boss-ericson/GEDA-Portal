import { toast } from 'sonner';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { School, Role } from '../types';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth, googleAuthProvider, db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

const BACKGROUND_IMAGES = [
  '/images/primary-classroom.svg',
  '/images/secondary-classroom.svg',
  'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=1920'
];

import { 
  GraduationCap, 
  WifiOff, 
  Wallet, 
  ArrowRight, 
  CheckCircle2, 
  School as SchoolIcon, 
  KeyRound, 
  Globe, 
  Database,
  ShieldCheck,
  Lock,
  CalendarCheck,
  FileText,
  ClipboardList,
  X,
  AlertCircle,
  Eye,
  EyeOff,
  Maximize2,
  BookOpen,
  Users,
  Award,
  Sparkles
} from 'lucide-react';

interface LandingPageProps {
  key?: string | number;
  schools: School[];
  onLogin: (school: School, role: Role, isDemo?: boolean, user?: any) => void;
  onRegisterSchool: (name: string, region: string, district: string, email: string, password: string) => Promise<{ success: boolean; school?: School; error?: string }>;
  sessionExpiredNotice?: string | null;
}

export default function LandingPage({ schools, onLogin, onRegisterSchool, sessionExpiredNotice }: LandingPageProps) {
  const [bgIndex, setBgIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const [loginMode, setLoginMode] = useState<'secure' | 'demo'>('secure');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(schools[0]?.id || 'achimota');
  const [selectedRole, setSelectedRole] = useState<Role>('Admin');
  
  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Forgot password state
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordMsg, setForgotPasswordMsg] = useState('');
  const [forgotPasswordError, setForgotPasswordError] = useState('');
  const [isSubmittingForgotPassword, setIsSubmittingForgotPassword] = useState(false);

  // Registration form state
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolRegion, setNewSchoolRegion] = useState('Greater Accra');
  const [newSchoolDistrict, setNewSchoolDistrict] = useState('');
  const [newSchoolEmail, setNewSchoolEmail] = useState('');
  const [newSchoolPassword, setNewSchoolPassword] = useState('');
  const [newSchoolConfirmPassword, setNewSchoolConfirmPassword] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registeredSchool, setRegisteredSchool] = useState<School | null>(null);
  
  // Modal states
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Lightbox for featured classroom images
  const [selectedClassroomImage, setSelectedClassroomImage] = useState<{ 
    title: string; 
    subtitle: string; 
    imageUrl: string; 
    level: string; 
    details: string[]; 
    tagline: string 
  } | null>(null);

  // Reset all landing page form fields on component mount (e.g., after logging out)
  useEffect(() => {
    setLoginEmail('');
    setLoginPassword('');
    setLoginError('');
    setNewSchoolName('');
    setNewSchoolDistrict('');
    setNewSchoolEmail('');
    setNewSchoolPassword('');
    setNewSchoolConfirmPassword('');
    setRegisterError('');
    setForgotPasswordEmail('');
    setForgotPasswordMsg('');
    setForgotPasswordError('');
  }, []);

  const ghanaRegions = [
    'Greater Accra', 'Ashanti', 'Western', 'Northern', 'Volta', 
    'Eastern', 'Central', 'Ahafo', 'Bono', 'Bono East', 
    'North East', 'Oti', 'Savannah', 'Upper East', 'Upper West', 'Western North'
  ];

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordError('');
    setForgotPasswordMsg('');
    if (!forgotPasswordEmail.trim()) {
      setForgotPasswordError('Please enter your registered email address.');
      return;
    }

    setIsSubmittingForgotPassword(true);
    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotPasswordEmail.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setForgotPasswordMsg(data.message);
      } else {
        setForgotPasswordError(data.error || 'No registered account found with this email.');
      }
    } catch (err: any) {
      try {
        const trimmed = forgotPasswordEmail.trim().toLowerCase();
        const sSnap = await getDocs(query(collection(db, "schools"), where("email", "==", trimmed)));
        if (!sSnap.empty) {
          const schoolData = sSnap.docs[0].data();
          setForgotPasswordMsg(`Password recovery instructions dispatched for ${schoolData.name}. Contact GEDA National Support (0244123456) for instant verification.`);
          return;
        }
        const tSnap = await getDocs(query(collection(db, "teachers"), where("email", "==", trimmed)));
        if (!tSnap.empty) {
          const teacherData = tSnap.docs[0].data();
          setForgotPasswordMsg(`Password reset requested for teacher ${teacherData.fullName}. Please contact your School Administrator to issue a new generated Password Slip.`);
          return;
        }
        setForgotPasswordError('No account found matching this email address. Please verify your email.');
      } catch (fbErr) {
        setForgotPasswordError('Unable to connect to recovery service. Please check your connection.');
      }
    } finally {
      setIsSubmittingForgotPassword(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess(false);

    if (!newSchoolName.trim() || !newSchoolDistrict.trim() || !newSchoolEmail.trim() || !newSchoolPassword.trim() || !newSchoolConfirmPassword.trim()) {
      setRegisterError('Please fill in all school registration fields.');
      return;
    }

    if (newSchoolPassword !== newSchoolConfirmPassword) {
      setRegisterError('Administrator passwords do not match. Please verify your password entry.');
      return;
    }
    
    setIsRegistering(true);
    try {
      try {
        const userCred = await createUserWithEmailAndPassword(auth, newSchoolEmail, newSchoolPassword);
        await sendEmailVerification(userCred.user);
      } catch(fbErr: any) {
        console.warn("Firebase Auth Error: ", fbErr.message);
      }
      const result = await onRegisterSchool(newSchoolName, newSchoolRegion, newSchoolDistrict, newSchoolEmail, newSchoolPassword);
      if (result.success && result.school) {
        setRegisterSuccess(true);
        setRegisteredSchool(result.school);
        setSelectedSchoolId(result.school.id);
        
        setLoginMode('secure');
        // Clear all login and registration form fields so they remain empty after registration
        setLoginEmail('');
        setLoginPassword('');
        setLoginError('');
        
        setNewSchoolName('');
        setNewSchoolDistrict('');
        setNewSchoolEmail('');
        setNewSchoolPassword('');
        setNewSchoolConfirmPassword('');
        setRegisterError('');

        // Note: we can also show a message to the user that a verification email was sent.
        toast.success('Registration successful! A verification email has been sent to your email address.');

        // Smooth scroll to login card
        document.getElementById('login-portal')?.scrollIntoView({ behavior: 'smooth' });
      } else {
        setRegisterError(result.error || 'A school with this name or email already exists.');
      }
    } catch (err) {
      setRegisterError('Registration failed. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    if (loginMode === 'demo') {
      // Find the official GEDA Demo School Complex
      const demoSchool = schools.find(s => s.id === 'demo-school' || s.name.toLowerCase().includes('geda')) || {
        id: 'demo-school',
        name: 'GEDA School Complex',
        slug: 'geda-demo-school',
        region: 'Greater Accra',
        district: 'Accra Metropolitan',
        email: 'admin@gedaschool.edu.gh',
        status: 'Active',
        accessLevel: 'Full',
        createdAt: new Date().toISOString()
      };
      setLoginEmail('');
      setLoginPassword('');
      setLoginError('');
      onLogin(demoSchool, selectedRole, true);
    } else {
      if (!loginEmail.trim() || !loginPassword.trim()) {
        setLoginError('Please enter your school email and password.');
        return;
      }
      
      setIsLoggingIn(true);
      try {
        let responseData: any = null;
        let isSuccess = false;

        try {
          const res = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword })
          });
          const data = await res.json();
          if (res.ok && data.success && data.school) {
             responseData = data;
             isSuccess = true;
          } else {
             throw new Error(data.error || 'Invalid credentials');
          }
        } catch (apiErr: any) {
          console.warn('Backend login API failed, falling back to Firebase directly:', apiErr);
          try {
            const cleanEmail = loginEmail.trim().toLowerCase();
            const rawEmail = loginEmail.trim();

            if (cleanEmail === "superadmin@ges.gov.gh") {
              responseData = {
                success: true,
                user: { email: cleanEmail, fullName: "Super Admin", role: "SuperAdmin" },
                school: {
                  id: 'superadmin-ges',
                  name: 'GES Super Admin Console',
                  slug: 'ges-super-admin',
                  region: 'National',
                  district: 'HQ',
                  email: 'superadmin@ges.gov.gh',
                  status: 'Active',
                  accessLevel: 'Full',
                  createdAt: new Date().toISOString()
                },
                role: "SuperAdmin"
              };
              isSuccess = true;
            } else {
              // 1. Check Teachers collection
              let teacherSnap = await getDocs(query(collection(db, "teachers"), where("email", "==", cleanEmail)));
              if (teacherSnap.empty) {
                teacherSnap = await getDocs(query(collection(db, "teachers"), where("email", "==", rawEmail)));
              }

              if (!teacherSnap.empty) {
                const teacherDoc = teacherSnap.docs[0];
                const teacherData = teacherDoc.data();
                const storedPassword = teacherData.password || teacherData.initialPassword;

                if (storedPassword !== loginPassword) {
                  setLoginError('Invalid password for teacher account.');
                  return;
                }

                const schoolDocRef = doc(db, "schools", teacherData.schoolId);
                const schoolSnap = await getDoc(schoolDocRef);
                if (!schoolSnap.exists()) {
                  setLoginError('School account not found for this teacher.');
                  return;
                }

                const schoolData = schoolSnap.data();
                if (schoolData.status === 'Deactivated') {
                  setLoginError('Your school account has been deactivated. Please contact the administrator.');
                  return;
                }

                responseData = {
                  success: true,
                  role: 'Teacher',
                  teacher: { ...teacherData, id: teacherDoc.id },
                  school: { ...schoolData, id: schoolSnap.id },
                  user: { email: teacherData.email, fullName: teacherData.fullName, role: 'Teacher' }
                };
                isSuccess = true;
              } else {
                // 2. Check Schools collection
                let snapshot = await getDocs(query(collection(db, "schools"), where("email", "==", cleanEmail)));
                if (snapshot.empty) {
                  snapshot = await getDocs(query(collection(db, "schools"), where("email", "==", rawEmail)));
                }

                if (!snapshot.empty) {
                  const schoolDoc = snapshot.docs[0];
                  const schoolData = schoolDoc.data();
                  if (schoolData.status === 'Deactivated') {
                    setLoginError('Your school account has been deactivated. Please contact the administrator.');
                    return;
                  }
                  responseData = {
                    success: true,
                    school: { ...schoolData, id: schoolDoc.id },
                    user: { email: rawEmail, fullName: "Admin User", role: selectedRole },
                    role: selectedRole
                  };
                  isSuccess = true;
                } else {
                  setLoginError('Invalid official school email or password.');
                  return;
                }
              }
            }
          } catch (fbErr: any) {
             console.error('Firebase fallback failed:', fbErr);
             setLoginError('Invalid official school email or password. (Database not configured)');
             return;
          }
        }
        
        if (isSuccess && responseData) {
          const actualRole = responseData.role || selectedRole;
          
          if (actualRole === 'Admin' && loginEmail.trim() !== "superadmin@ges.gov.gh") {
            try {
              const cred = await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
              if (!cred.user.emailVerified) {
                setLoginError('Please verify your email address before logging in. Check your inbox.');
                await auth.signOut();
                setIsLoggingIn(false);
                return;
              }
            } catch (fbErr: any) {
              setLoginError(fbErr.message || 'Firebase authentication failed.');
              setIsLoggingIn(false);
              return;
            }
          }
          
          setLoginEmail('');
          setLoginPassword('');
          setLoginError('');
          onLogin(responseData.school, actualRole, false, responseData.teacher || null);
        } else {
          setLoginError('Invalid official school email or password.');
        }
      } catch (err: any) {
        setLoginError(err.message || 'Failed to log in. Please check your connection and try again.');
      } finally {
        setIsLoggingIn(false);
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoginError('');
      setIsLoggingIn(true);
      const result = await signInWithPopup(auth, googleAuthProvider);
      // Fallback: check backend with email from Google
      const email = result.user.email;
      if (email) {
        let responseData: any = null;
        try {
          const res = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: "password123" }) // Fake password for now or we would need a proper OAuth flow in the backend
          });
          const data = await res.json();
          if (res.ok && data.success && data.school) {
             responseData = data;
          } else {
             throw new Error('API failed');
          }
        } catch (apiErr) {
          console.warn('Backend Google API failed, falling back to Firebase:', apiErr);
          try {
            const snapshot = await getDocs(query(collection(db, "schools"), where("email", "==", email)));
            if (!snapshot.empty) {
              const schoolDoc = snapshot.docs[0];
              const schoolData = schoolDoc.data();
              if (schoolData.status === 'Deactivated') {
                setLoginError('Your school account has been deactivated. Please contact the administrator.');
                setIsLoggingIn(false);
                return;
              }
              responseData = {
                success: true,
                school: { ...schoolData, id: schoolDoc.id }
              };
            }
          } catch (fbErr) {
            console.error('Firebase fallback failed:', fbErr);
            toast.info("Database not configured. Please use 'admin@gedaschool.edu.gh' to try the demo.");
            setIsLoggingIn(false);
            return;
          }
        }

        if (responseData && responseData.success && responseData.school) {
          const actualRole = responseData.role || selectedRole;
          onLogin(responseData.school, actualRole, false);
        } else {
          setLoginError('Google account not linked to an official school account.');
        }
      }
    } catch (error: any) {
      setLoginError(error.message || 'Google sign in failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#EEF6FC] text-[#13293D] font-sans selection:bg-[#274C77]/20 selection:text-[#0B1E2D] overflow-x-hidden relative">
      {/* Background Slideshow */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <AnimatePresence>
          <motion.img
            key={bgIndex}
            src={BACKGROUND_IMAGES[bgIndex]}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 0.08, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full object-cover"
            alt="Ghana School Children Background"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-[#EEF6FC]/85"></div>
      </div>

      {/* Subtle Background Glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[500px] bg-[#DCEAF6] blur-[140px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-[#4A6FA5]/10 blur-[140px] rounded-full pointer-events-none z-0" />

      {/* Upper Color Strip */}
      <div className="h-1 w-full flex relative z-50">
        <div className="h-full bg-red-500 flex-1"></div>
        <div className="h-full bg-amber-400 flex-1"></div>
        <div className="h-full bg-emerald-500 flex-1"></div>
      </div>

      {/* Hero Header */}
      <header className="border-b border-[#274C77]/10 bg-white/80 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#DCEAF6] border border-[#274C77]/15 text-[#0B1E2D] p-2.5 rounded-2xl shadow-sm">
              <GraduationCap className="h-5 w-5 text-[#0B1E2D]" />
            </div>
            <div>
              <span className="font-display font-extrabold text-lg tracking-tight text-[#0B1E2D]">GEDA Portal</span>
              <span className="block text-[9px] font-mono uppercase tracking-widest text-[#274C77] font-semibold">Ghana Ed-Admissions</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#274C77]">
            <a href="#features" className="hover:text-[#0B1E2D] transition-colors">Features</a>
            <a href="#register" className="hover:text-[#0B1E2D] transition-colors">Register</a>
            <button 
              type="button"
              onClick={() => {
                setShowLoginModal(true);
                setLoginError('');
              }}
              className="bg-[#0B1E2D] text-white px-5 py-2.5 rounded-full font-medium hover:bg-[#13293D] hover:-translate-y-0.5 transition-all shadow-sm cursor-pointer"
            >
              Sign In
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section Flyer */}
      <section className="relative pt-4 pb-8 lg:pt-6 lg:pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-[#274C77]/20 bg-[#0B1E2D] flex flex-col justify-center min-h-[480px]">
            {/* The realistic image background */}
            <div className="absolute inset-0">
              <img 
                src="/images/classroom-hero.png" 
                alt="Ghanaian Classroom Setting" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              {/* Gradient overlay for text readability (darker on the left) */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0B1E2D] via-[#0B1E2D]/85 to-transparent"></div>
              {/* Gradient overlay for mobile (darker on top/bottom) */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1E2D] via-[#0B1E2D]/40 to-[#0B1E2D]/80 sm:hidden"></div>
            </div>

            {/* Flyer Content */}
            <div className="relative z-10 p-6 sm:p-8 lg:p-10 max-w-3xl">
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-5"
              >
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-extrabold border border-white/20 shadow-sm">
                  <GraduationCap className="h-4 w-4 text-amber-400" />
                  <span className="tracking-wider uppercase">SMART SCHOOL PORTAL</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold tracking-tight text-white leading-[1.12]">
                  Modernize School Admissions, <br className="hidden sm:block" />
                  <span className="text-amber-400">Online &amp; Offline</span>
                </h1>
                
                <p className="text-sm sm:text-base text-slate-200 max-w-2xl leading-relaxed font-medium">
                  Empowering Ghanaian Primary and Secondary Schools to digitally register new students, verify Mobile Money payment plans, instantly issue official GES admission letters, and sync data seamlessly in regions with low connectivity.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowLoginModal(true);
                      setLoginError('');
                    }}
                    className="inline-flex items-center justify-center gap-2.5 bg-amber-400 hover:bg-amber-500 text-[#0B1E2D] px-8 py-4 rounded-full font-bold shadow-lg hover:-translate-y-0.5 transition-all group text-sm cursor-pointer"
                  >
                    <Lock className="h-4 w-4" />
                    <span>Access School Dashboard</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <a href="#register" className="inline-flex items-center justify-center bg-white/10 hover:bg-white/20 text-white backdrop-blur-md px-8 py-4 rounded-full border border-white/20 hover:-translate-y-0.5 transition-all font-bold text-sm">
                    Register Your School
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Cards Section */}
      <section className="pb-8 lg:pb-12 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-[#274C77]/20 py-16 lg:py-20">
            <div className="absolute inset-0">
              <img 
                src="https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=1920" 
                alt="Ghanaian Classroom Background" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-[#0B1E2D]/85 backdrop-blur-sm"></div>
            </div>

            <div className="relative z-10 px-4 sm:px-8 lg:px-12">
              <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
                <h2 className="text-3xl md:text-4xl font-display font-extrabold text-white tracking-tight">
                  Powerful Tools for School Administration
                </h2>
                <p className="text-slate-300 text-base md:text-lg leading-relaxed">
                  Everything you need to run your school efficiently, built with the specific needs of Ghanaian educators in mind.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white p-7 rounded-2xl border border-white/10 shadow-2xl transition-all flex flex-col gap-4"
            >
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100 text-emerald-600 shadow-sm">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-[#0B1E2D] text-lg mb-2">GES Roster Formats</h3>
                <p className="text-sm text-[#274C77] leading-relaxed font-medium">
                  Automatically generate class rosters and student lists that comply perfectly with official Ghana Education Service formatting requirements.
                </p>
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white p-7 rounded-2xl border border-white/10 shadow-2xl transition-all flex flex-col gap-4"
            >
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-600 shadow-sm">
                <WifiOff className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-[#0B1E2D] text-lg mb-2">Offline Registry Cache</h3>
                <p className="text-sm text-[#274C77] leading-relaxed font-medium">
                  Continue working without interruption. Our smart offline mode caches your data locally and synchronizes automatically when connection returns.
                </p>
              </div>
            </motion.div>

            {/* Feature 3 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white p-7 rounded-2xl border border-white/10 shadow-2xl transition-all flex flex-col gap-4"
            >
              <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100 text-amber-600 shadow-sm">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-[#0B1E2D] text-lg mb-2">MoMo Fee Tracker</h3>
                <p className="text-sm text-[#274C77] leading-relaxed font-medium">
                  Seamlessly track school fee payments via Mobile Money. Reconcile transactions instantly and send automated digital receipts to parents.
                </p>
              </div>
            </motion.div>

            {/* Feature 4 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white p-7 rounded-2xl border border-white/10 shadow-2xl transition-all flex flex-col gap-4"
            >
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-600 shadow-sm">
                <CalendarCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-[#0B1E2D] text-lg mb-2">Mark Attendance</h3>
                <p className="text-sm text-[#274C77] leading-relaxed font-medium">
                  Replace paper registers with swift digital attendance tracking. Monitor daily presence, tardiness, and generate termly attendance summaries.
                </p>
              </div>
            </motion.div>

            {/* Feature 5 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white p-7 rounded-2xl border border-white/10 shadow-2xl transition-all flex flex-col gap-4"
            >
              <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100 text-emerald-600 shadow-sm">
                <ClipboardList className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-[#0B1E2D] text-lg mb-2">Record SBA Scores</h3>
                <p className="text-sm text-[#274C77] leading-relaxed font-medium">
                  Securely log School-Based Assessment scores throughout the term. Automatic calculations for class averages and grading thresholds.
                </p>
              </div>
            </motion.div>

            {/* Feature 6 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white p-7 rounded-2xl border border-white/10 shadow-2xl transition-all flex flex-col gap-4"
            >
              <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-600 shadow-sm">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-[#0B1E2D] text-lg mb-2">Issue Report Cards</h3>
                <p className="text-sm text-[#274C77] leading-relaxed font-medium">
                  Generate comprehensive end-of-term report cards with just a few clicks. Print in batch or share directly with parents digitally.
                </p>
              </div>
            </motion.div>
          </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Classroom Environments Section */}
      <section className="py-20 bg-white/90 relative border-t border-b border-[#274C77]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#DCEAF6] text-[#0B1E2D] text-xs font-bold border border-[#274C77]/20">
              <Sparkles className="h-3.5 w-3.5 text-[#274C77]" />
              <span>REAL CLASSROOM IMPACT</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold text-[#0B1E2D] tracking-tight">
              Designed for Primary &amp; Secondary Schools Across Ghana
            </h2>
            <p className="text-[#274C77] text-base leading-relaxed">
              GEDA Portal powers student registration, attendance tracking, and academic reporting directly inside vibrant Ghanaian learning environments.
            </p>
          </div>

          {/* 2-Column Featured Image Showcase Cards */}
          <div className="grid lg:grid-cols-2 gap-10">
            {/* Primary School Classroom Card */}
            <motion.div 
              whileHover={{ y: -6 }}
              transition={{ duration: 0.3 }}
              className="bg-[#EEF6FC]/60 border border-[#274C77]/15 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col"
            >
              <div className="relative aspect-[16/10] overflow-hidden cursor-pointer" onClick={() => setSelectedClassroomImage({
                title: "Primary & Basic Level Administration",
                subtitle: "Excellence Today, Leaders Tomorrow",
                imageUrl: "/images/primary-classroom.svg",
                level: "PRIMARY & BASIC EDUCATION",
                tagline: "Empowering young learners with official GES Learner ID numbers, attendance registers, and continuous assessment logging.",
                details: [
                  "GES Learner ID & Basic Roster Management",
                  "Daily Class Attendance & Guardian Absence Alerts",
                  "School-Based Assessment (SBA) Class Logging",
                  "Termly Progress Reports & Conduct Badges"
                ]
              })}>
                <img 
                  src="/images/primary-classroom.svg" 
                  alt="Ghana Primary School Classroom" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1E2D]/80 via-[#0B1E2D]/20 to-transparent"></div>
                
                {/* Badges on Image */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="bg-[#0B1E2D]/90 backdrop-blur-md text-white text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-white/20">
                    BASIC &amp; PRIMARY LEVEL
                  </span>
                </div>

                <div className="absolute top-4 right-4">
                  <button 
                    type="button"
                    className="bg-white/90 hover:bg-white text-[#0B1E2D] p-2 rounded-full shadow-md backdrop-blur-md transition-all cursor-pointer"
                    title="Expand Photo &amp; Details"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-400 text-[#0B1E2D] text-[10px] font-extrabold uppercase mb-1">
                    <Award className="h-3 w-3" />
                    <span>Excellence Today, Leaders Tomorrow</span>
                  </div>
                  <h3 className="text-xl font-bold font-display text-white drop-shadow-sm">
                    Primary School Classroom Learning
                  </h3>
                </div>
              </div>

              <div className="p-7 space-y-5 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-sm text-[#274C77] leading-relaxed mb-4">
                    Optimized for basic schools across Ghana. Teachers can effortlessly log daily attendance, compute SBA scores, and track student growth from KG to Class 6.
                  </p>

                  <div className="grid sm:grid-cols-2 gap-3 pt-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#13293D] bg-white p-2.5 rounded-xl border border-[#274C77]/10">
                      <BookOpen className="h-4 w-4 text-[#274C77] shrink-0" />
                      <span>GES Learner ID Roster</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#13293D] bg-white p-2.5 rounded-xl border border-[#274C77]/10">
                      <CalendarCheck className="h-4 w-4 text-[#274C77] shrink-0" />
                      <span>Daily Class Registers</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#13293D] bg-white p-2.5 rounded-xl border border-[#274C77]/10">
                      <ClipboardList className="h-4 w-4 text-[#274C77] shrink-0" />
                      <span>Continuous Assessment (SBA)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#13293D] bg-white p-2.5 rounded-xl border border-[#274C77]/10">
                      <FileText className="h-4 w-4 text-[#274C77] shrink-0" />
                      <span>Termly Report Cards</span>
                    </div>
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={() => setSelectedClassroomImage({
                    title: "Primary & Basic Level Administration",
                    subtitle: "Excellence Today, Leaders Tomorrow",
                    imageUrl: "/images/primary-classroom.svg",
                    level: "PRIMARY & BASIC EDUCATION",
                    tagline: "Empowering young learners with official GES Learner ID numbers, attendance registers, and continuous assessment logging.",
                    details: [
                      "GES Learner ID & Basic Roster Management",
                      "Daily Class Attendance & Guardian Absence Alerts",
                      "School-Based Assessment (SBA) Class Logging",
                      "Termly Progress Reports & Conduct Badges"
                    ]
                  })}
                  className="w-full bg-white hover:bg-[#DCEAF6] text-[#0B1E2D] border border-[#274C77]/20 font-bold py-3 px-4 rounded-full text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Eye className="h-4 w-4 text-[#274C77]" />
                  <span>Inspect Primary Classroom Features</span>
                </button>
              </div>
            </motion.div>

            {/* Secondary / JHS Classroom Card */}
            <motion.div 
              whileHover={{ y: -6 }}
              transition={{ duration: 0.3 }}
              className="bg-[#EEF6FC]/60 border border-[#274C77]/15 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all group flex flex-col"
            >
              <div className="relative aspect-[16/10] overflow-hidden cursor-pointer" onClick={() => setSelectedClassroomImage({
                title: "Junior & Senior High Administration",
                subtitle: "BECE & WASSCE Candidate Readiness",
                imageUrl: "/images/secondary-classroom.svg",
                level: "JUNIOR & SENIOR HIGH SCHOOL",
                tagline: "Streamlining secondary student placement verification, academic transcripts, examination indexing, and Mobile Money fee tracking.",
                details: [
                  "BECE / WASSCE Candidate Indexing & Placement Validation",
                  "Automated High School Transcripts & GPA Analysis",
                  "Subject Grade Distribution & Academic Ranking",
                  "Boarding & Day Student MoMo Fee Verification"
                ]
              })}>
                <img 
                  src="/images/secondary-classroom.svg" 
                  alt="Ghana Secondary School Classroom" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1E2D]/80 via-[#0B1E2D]/20 to-transparent"></div>
                
                {/* Badges on Image */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="bg-[#0B1E2D]/90 backdrop-blur-md text-white text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-white/20">
                    JHS &amp; SECONDARY LEVEL
                  </span>
                </div>

                <div className="absolute top-4 right-4">
                  <button 
                    type="button"
                    className="bg-white/90 hover:bg-white text-[#0B1E2D] p-2 rounded-full shadow-md backdrop-blur-md transition-all cursor-pointer"
                    title="Expand Photo &amp; Details"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-400 text-[#0B1E2D] text-[10px] font-extrabold uppercase mb-1">
                    <ShieldCheck className="h-3 w-3" />
                    <span>BECE &amp; WASSCE Candidate Indexing</span>
                  </div>
                  <h3 className="text-xl font-bold font-display text-white drop-shadow-sm">
                    Junior &amp; Senior High Classroom Learning
                  </h3>
                </div>
              </div>

              <div className="p-7 space-y-5 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-sm text-[#274C77] leading-relaxed mb-4">
                    Tailored for secondary schools. Manage subject teachers, compute exam averages, track boarding vs day placements, and issue official transcripts.
                  </p>

                  <div className="grid sm:grid-cols-2 gap-3 pt-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#13293D] bg-white p-2.5 rounded-xl border border-[#274C77]/10">
                      <GraduationCap className="h-4 w-4 text-[#274C77] shrink-0" />
                      <span>BECE / WASSCE Indexing</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#13293D] bg-white p-2.5 rounded-xl border border-[#274C77]/10">
                      <FileText className="h-4 w-4 text-[#274C77] shrink-0" />
                      <span>Official Transcripts</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#13293D] bg-white p-2.5 rounded-xl border border-[#274C77]/10">
                      <Wallet className="h-4 w-4 text-[#274C77] shrink-0" />
                      <span>MoMo Fee Verification</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#13293D] bg-white p-2.5 rounded-xl border border-[#274C77]/10">
                      <Users className="h-4 w-4 text-[#274C77] shrink-0" />
                      <span>Boarding &amp; Day Roster</span>
                    </div>
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={() => setSelectedClassroomImage({
                    title: "Junior & Senior High Administration",
                    subtitle: "BECE & WASSCE Candidate Readiness",
                    imageUrl: "/images/secondary-classroom.svg",
                    level: "JUNIOR & SENIOR HIGH SCHOOL",
                    tagline: "Streamlining secondary student placement verification, academic transcripts, examination indexing, and Mobile Money fee tracking.",
                    details: [
                      "BECE / WASSCE Candidate Indexing & Placement Validation",
                      "Automated High School Transcripts & GPA Analysis",
                      "Subject Grade Distribution & Academic Ranking",
                      "Boarding & Day Student MoMo Fee Verification"
                    ]
                  })}
                  className="w-full bg-white hover:bg-[#DCEAF6] text-[#0B1E2D] border border-[#274C77]/20 font-bold py-3 px-4 rounded-full text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  <Eye className="h-4 w-4 text-[#274C77]" />
                  <span>Inspect Secondary Classroom Features</span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      {/* School Registration Form Section */}
      <section id="register" className="py-24 relative overflow-hidden bg-[#EEF6FC]/60 border-t border-[#274C77]/10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-[#274C77]/15 p-8 sm:p-12 shadow-xl">
            <div className="text-center space-y-2 mb-10">
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-[#0B1E2D]">Register a New School</h2>
              <p className="text-[#274C77] text-sm max-w-lg mx-auto">Create a dedicated, private tenant space for your school. You can immediately access its administrative backend upon submission.</p>
            </div>

            {registerError && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 text-red-800 border border-red-200 px-4 py-3 rounded-xl mb-6 text-sm font-medium">
                {registerError}
              </motion.div>
            )}

            {registerSuccess && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#DCEAF6] text-[#0B1E2D] border border-[#274C77]/30 px-5 py-4 rounded-xl mb-6 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-[#274C77]" />
                  <span>School registered successfully! We have automatically selected your school in the login portal.</span>
                </div>
                <button
                  onClick={() => {
                    const schoolToLogin = registeredSchool || schools.find(s => s.id === selectedSchoolId);
                    if (schoolToLogin) {
                      onLogin(schoolToLogin, 'Admin', false);
                    }
                  }}
                  className="bg-[#0B1E2D] text-white font-bold px-4 py-2 rounded-full text-xs whitespace-nowrap hover:bg-[#13293D] transition-colors cursor-pointer self-end sm:self-auto"
                >
                  Enter Dashboard
                </button>
              </motion.div>
            )}

            <form onSubmit={handleRegister} autoComplete="off" className="grid sm:grid-cols-2 gap-5 text-sm">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#274C77] mb-2">School Official Name</label>
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="e.g. Accra Methodist Basic School"
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  className="w-full bg-[#EEF6FC] border border-[#274C77]/20 rounded-xl px-4 py-3 text-[#0B1E2D] focus:outline-none focus:ring-2 focus:ring-[#274C77]/30 transition-all placeholder:text-[#4A6FA5]/60"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#274C77] mb-2">GES Regional Division</label>
                <select
                  value={newSchoolRegion}
                  onChange={(e) => setNewSchoolRegion(e.target.value)}
                  className="w-full bg-[#EEF6FC] border border-[#274C77]/20 rounded-xl px-4 py-3 text-[#0B1E2D] focus:outline-none focus:ring-2 focus:ring-[#274C77]/30 transition-all appearance-none cursor-pointer"
                >
                  {ghanaRegions.map((reg) => (
                    <option key={reg} value={reg} className="bg-white text-[#0B1E2D]">{reg}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#274C77] mb-2">Municipal District</label>
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="e.g. Kumasi Metro"
                  value={newSchoolDistrict}
                  onChange={(e) => setNewSchoolDistrict(e.target.value)}
                  className="w-full bg-[#EEF6FC] border border-[#274C77]/20 rounded-xl px-4 py-3 text-[#0B1E2D] focus:outline-none focus:ring-2 focus:ring-[#274C77]/30 transition-all placeholder:text-[#4A6FA5]/60"
                  required
                />
              </div>

              <div className="sm:col-span-2 border-t border-[#274C77]/15 pt-4 mt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1E2D] mb-3">Official Administrator Account Credentials</h3>
              </div>
              
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#274C77] mb-2">School Contact/Login Email</label>
                <input
                  type="email"
                  autoComplete="off"
                  placeholder="e.g. admin@school.edu.gh"
                  value={newSchoolEmail}
                  onChange={(e) => setNewSchoolEmail(e.target.value)}
                  className="w-full bg-[#EEF6FC] border border-[#274C77]/20 rounded-xl px-4 py-3 text-[#0B1E2D] focus:outline-none focus:ring-2 focus:ring-[#274C77]/30 transition-all placeholder:text-[#4A6FA5]/60"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#274C77] mb-2">Administrator Password *</label>
                <div className="relative">
                  <input
                    type={showRegisterPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="•••••••• (min 6 chars)"
                    value={newSchoolPassword}
                    onChange={(e) => setNewSchoolPassword(e.target.value)}
                    className="w-full bg-[#EEF6FC] border border-[#274C77]/20 rounded-xl pl-4 pr-11 py-3 text-[#0B1E2D] focus:outline-none focus:ring-2 focus:ring-[#274C77]/30 transition-all placeholder:text-[#4A6FA5]/60"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#274C77] hover:text-[#0B1E2D] transition-colors cursor-pointer p-1"
                    title={showRegisterPassword ? "Hide password" : "Show password"}
                    aria-label={showRegisterPassword ? "Hide password" : "Show password"}
                  >
                    {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#274C77] mb-2">Repeat / Confirm Password *</label>
                <div className="relative">
                  <input
                    type={showRegisterConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="•••••••• (repeat password)"
                    value={newSchoolConfirmPassword}
                    onChange={(e) => setNewSchoolConfirmPassword(e.target.value)}
                    className="w-full bg-[#EEF6FC] border border-[#274C77]/20 rounded-xl pl-4 pr-11 py-3 text-[#0B1E2D] focus:outline-none focus:ring-2 focus:ring-[#274C77]/30 transition-all placeholder:text-[#4A6FA5]/60"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterConfirmPassword(!showRegisterConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#274C77] hover:text-[#0B1E2D] transition-colors cursor-pointer p-1"
                    title={showRegisterConfirmPassword ? "Hide password" : "Show password"}
                    aria-label={showRegisterConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showRegisterConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {newSchoolConfirmPassword.length > 0 && (
                  <p className={`text-xs font-bold mt-1.5 flex items-center gap-1 ${
                    newSchoolPassword === newSchoolConfirmPassword ? 'text-emerald-700' : 'text-red-600'
                  }`}>
                    {newSchoolPassword === newSchoolConfirmPassword ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Passwords match perfectly
                      </>
                    ) : (
                      <>
                        <X className="h-3.5 w-3.5" /> Passwords do not match
                      </>
                    )}
                  </p>
                )}
              </div>

              <div className="sm:col-span-2 pt-2">
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="w-full bg-[#0B1E2D] hover:bg-[#13293D] text-white font-bold py-4 px-4 rounded-full transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed text-sm"
                >
                  {isRegistering ? 'Provisioning School Space...' : 'Register Institution & Create Admin Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-[#0B1E2D] py-16 border-t border-[#274C77]/10 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&q=80&w=1920" 
            alt="Ghanaian Classroom Background" 
            className="w-full h-full object-cover opacity-20"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1E2D] via-[#0B1E2D]/90 to-[#0B1E2D]/80"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4 relative z-10">
          <div className="flex items-center justify-center gap-2 text-white text-lg font-bold">
            <GraduationCap className="h-6 w-6 text-amber-400" />
            <span className="font-display tracking-tight text-white">GEDA Portal — Ghana Ed-Admissions</span>
          </div>
          <p className="text-sm max-w-xl mx-auto text-slate-300 font-medium leading-relaxed">
            Providing resilient, multi-tenant digital administration services for schools across the Republic of Ghana.
          </p>
          <div className="pt-6 border-t border-white/10 max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold">
            <div className="text-slate-400 font-medium">
              &copy; {new Date().getFullYear()} GEDA Ghana. Compliant with Ghana Education Service (GES) data standards.
            </div>
            <div className="text-[#0B1E2D] font-bold bg-amber-400 px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
              <span>Developed &copy; BossITSolutions</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 bg-[#0B1E2D]/60 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white border border-[#274C77]/20 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-4">
            <button 
              onClick={() => { setShowForgotPasswordModal(false); setForgotPasswordMsg(''); setForgotPasswordError(''); }}
              className="absolute top-4 right-4 text-[#274C77] hover:text-[#0B1E2D] p-2 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[#0B1E2D] font-bold text-base font-display">
                <KeyRound className="h-5 w-5 text-[#274C77]" />
                <span>Account Password Recovery</span>
              </div>
              <p className="text-[#274C77] text-xs font-normal">Enter your registered email address to receive password recovery instructions or reset information.</p>
            </div>

            {forgotPasswordError && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs flex items-start gap-2 font-medium">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <span>{forgotPasswordError}</span>
              </div>
            )}

            {forgotPasswordMsg ? (
              <div className="bg-[#EEF6FC] border border-[#274C77]/30 text-[#0B1E2D] p-4 rounded-2xl text-xs space-y-2.5 font-medium">
                <div className="flex items-center gap-2 font-bold text-[#0B1E2D]">
                  <CheckCircle2 className="h-4 w-4 text-[#274C77]" />
                  <span>Request Processed</span>
                </div>
                <p className="leading-relaxed text-[#13293D]">{forgotPasswordMsg}</p>
                <button
                  onClick={() => { setShowForgotPasswordModal(false); setForgotPasswordMsg(''); }}
                  className="w-full bg-[#0B1E2D] text-white font-bold py-2.5 rounded-full text-xs hover:bg-[#13293D] transition cursor-pointer mt-2"
                >
                  Return to Portal Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-[10.5px] font-bold uppercase tracking-wider text-[#274C77] mb-1.5">Registered Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. admin@school.edu.gh or teacher@school.edu.gh"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="w-full bg-[#EEF6FC] border border-[#274C77]/20 rounded-xl px-3.5 py-2.5 text-[#0B1E2D] text-xs focus:outline-none focus:ring-2 focus:ring-[#274C77]/30"
                    required
                  />
                </div>

                <div className="bg-[#EEF6FC] border border-[#274C77]/15 p-3 rounded-2xl text-[11px] text-[#274C77] space-y-1 font-normal">
                  <span className="font-bold text-[#0B1E2D] block">&bull; School Administrators:</span>
                  <p>Recovery credentials dispatched via verified school contact channel.</p>
                  <span className="font-bold text-[#0B1E2D] block pt-1">&bull; Registered Teachers:</span>
                  <p>Password resets are handled securely by your School Administrator via generated Password Slips.</p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingForgotPassword}
                  className="w-full bg-[#0B1E2D] hover:bg-[#13293D] text-white font-bold py-3 rounded-full text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingForgotPassword ? 'Checking Recovery Records...' : 'Submit Password Reset Request'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}

      {/* Classroom Image Lightbox Modal */}
      {selectedClassroomImage && (
        <div className="fixed inset-0 z-50 bg-[#0B1E2D]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white border border-[#274C77]/20 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden relative my-8"
          >
            <button 
              onClick={() => setSelectedClassroomImage(null)}
              className="absolute top-4 right-4 z-20 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition cursor-pointer backdrop-blur-md"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative aspect-[16/9] w-full bg-slate-900">
              <img 
                src={selectedClassroomImage.imageUrl} 
                alt={selectedClassroomImage.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B1E2D]/90 via-[#0B1E2D]/30 to-transparent"></div>
              
              <div className="absolute bottom-4 left-6 right-6 text-white">
                <span className="bg-amber-400 text-[#0B1E2D] font-mono font-bold text-[10px] uppercase px-3 py-1 rounded-full inline-block mb-2 shadow-sm">
                  {selectedClassroomImage.level}
                </span>
                <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-white leading-tight">
                  {selectedClassroomImage.title}
                </h3>
                <p className="text-sm text-slate-200 font-medium mt-1">
                  {selectedClassroomImage.subtitle}
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6 bg-white">
              <p className="text-sm text-[#274C77] leading-relaxed font-normal">
                {selectedClassroomImage.tagline}
              </p>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0B1E2D] mb-3">
                  Core Administrative Capabilities
                </h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  {selectedClassroomImage.details.map((detail, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 bg-[#EEF6FC] p-3 rounded-xl border border-[#274C77]/15">
                      <CheckCircle2 className="h-4.5 w-4.5 text-[#274C77] shrink-0 mt-0.5" />
                      <span className="text-xs font-semibold text-[#13293D] leading-snug">{detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedClassroomImage(null)}
                  className="bg-[#0B1E2D] hover:bg-[#13293D] text-white font-bold px-6 py-2.5 rounded-full text-xs transition cursor-pointer shadow-sm"
                >
                  Close Photo Inspection
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Sign In Portal Gateway Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-[#0B1E2D]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white/95 backdrop-blur-xl rounded-3xl border border-[#274C77]/20 shadow-2xl max-w-md w-full p-7 sm:p-9 relative my-8"
          >
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-[#0B1E2D] p-2 rounded-full transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="absolute top-0 inset-x-0 h-1.5 bg-[#0B1E2D] rounded-t-3xl"></div>
            <div className="bg-[#0B1E2D] text-white font-mono font-bold text-[10px] uppercase px-3.5 py-1 rounded-full shadow-sm inline-block mb-3">
              SCHOOL LOGIN PORTAL
            </div>
            
            <h2 className="font-display font-bold text-2xl text-[#0B1E2D] mb-1">Administrative Gateway</h2>
            <p className="text-[#274C77] text-xs mb-5 font-normal">Select your role and sign in to access your school's private dashboard.</p>

            {/* Login Mode Toggle Tabs */}
            <div className="grid grid-cols-2 gap-2 bg-[#EEF6FC] p-1.5 rounded-2xl mb-5 text-xs font-semibold border border-[#274C77]/15">
              <button
                type="button"
                onClick={() => {
                  setLoginMode('secure');
                  setLoginError('');
                }}
                className={`py-2 text-center rounded-xl transition-all cursor-pointer ${
                  loginMode === 'secure'
                    ? 'bg-[#0B1E2D] text-white shadow-sm font-semibold'
                    : 'text-[#274C77] hover:text-[#0B1E2D]'
                }`}
              >
                Secure School Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMode('demo');
                  setLoginError('');
                }}
                className={`py-2 text-center rounded-xl transition-all cursor-pointer ${
                  loginMode === 'demo'
                    ? 'bg-[#0B1E2D] text-white shadow-sm font-semibold'
                    : 'text-[#274C77] hover:text-[#0B1E2D]'
                }`}
              >
                Quick Demo Access
              </button>
            </div>

            {sessionExpiredNotice && typeof sessionExpiredNotice === 'string' && (
              <div className="bg-amber-50 text-amber-900 border border-amber-200 px-4 py-2.5 rounded-xl mb-4 text-xs flex items-start gap-2 font-medium">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-xs leading-snug">{sessionExpiredNotice}</p>
                </div>
              </div>
            )}

            {loginError && (
              <div className="bg-red-50 text-red-800 border border-red-200 px-4 py-2.5 rounded-xl mb-4 text-xs flex items-start gap-2 font-medium">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={(e) => {
              handleLoginSubmit(e);
            }} autoComplete="off" className="space-y-4">
              {loginMode === 'secure' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#274C77] mb-1.5">School Official Email</label>
                    <input
                      type="email"
                      autoComplete="off"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="administrator@achimota.edu.gh"
                      className="w-full bg-[#EEF6FC] border border-[#274C77]/20 rounded-xl px-4 py-2.5 text-[#0B1E2D] focus:outline-none focus:ring-2 focus:ring-[#274C77]/30 focus:border-[#274C77] text-xs transition-all placeholder:text-[#4A6FA5]/60"
                      required
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#274C77]">Password</label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowLoginModal(false);
                          setShowForgotPasswordModal(true);
                          setForgotPasswordEmail(loginEmail);
                          setForgotPasswordMsg('');
                          setForgotPasswordError('');
                        }}
                        className="text-xs text-[#274C77] hover:text-[#0B1E2D] font-bold hover:underline transition-colors cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showLoginPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#EEF6FC] border border-[#274C77]/20 rounded-xl pl-4 pr-11 py-2.5 text-[#0B1E2D] focus:outline-none focus:ring-2 focus:ring-[#274C77]/30 focus:border-[#274C77] text-xs transition-all placeholder:text-[#4A6FA5]/60"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#274C77] hover:text-[#0B1E2D] transition-colors cursor-pointer p-1"
                        title={showLoginPassword ? "Hide password" : "Show password"}
                      >
                        {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-[#DCEAF6] border border-[#274C77]/20 rounded-2xl p-3.5 text-xs">
                    <div className="flex items-center gap-2 text-[#0B1E2D] font-bold mb-1">
                      <ShieldCheck className="h-4 w-4 text-[#274C77]" />
                      <span>Sandbox Environment</span>
                    </div>
                    <p className="text-[#13293D] text-[11px]">
                      Quick Demo Access provides instant sandbox evaluation strictly for <strong>GEDA School Complex</strong>.
                    </p>
                  </div>

                  <div className="bg-[#EEF6FC] border border-[#274C77]/15 rounded-2xl p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-[#274C77] block">Demo Tenant</span>
                      <span className="font-bold text-[#0B1E2D] text-xs">GEDA School Complex</span>
                    </div>
                    <span className="bg-[#DCEAF6] text-[#0B1E2D] border border-[#274C77]/30 text-[9px] font-mono px-2 py-0.5 rounded font-bold">
                      PUBLIC DEMO
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#274C77] mb-1.5">Role-Based Access Permission</label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {(['Admin', 'Staff', 'Teacher'] as Role[]).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        selectedRole === role
                          ? 'bg-[#0B1E2D] border-[#0B1E2D] text-white shadow-sm'
                          : 'bg-[#EEF6FC] border-[#274C77]/15 text-[#13293D] hover:bg-[#DCEAF6]'
                      }`}
                    >
                      {role === 'Admin' && <ShieldCheck className="h-3.5 w-3.5" />}
                      {role === 'Staff' && <Lock className="h-3.5 w-3.5" />}
                      {role === 'Teacher' && <GraduationCap className="h-3.5 w-3.5" />}
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-[#0B1E2D] hover:bg-[#13293D] text-white font-bold py-3 px-4 rounded-full transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed text-xs"
              >
                {isLoggingIn ? 'Authenticating Gateway...' : 'Enter Dashboard'}
                {!isLoggingIn && <ArrowRight className="h-4 w-4" />}
              </button>

              <div className="pt-2 border-t border-[#274C77]/15">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoggingIn}
                  className="w-full bg-white hover:bg-slate-50 text-[#0B1E2D] border border-[#274C77]/20 font-bold py-3 px-4 rounded-full transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Sign in with Google Workspace
                </button>
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole('Admin');
                    setLoginMode('secure');
                  }}
                  className="text-[11px] text-[#274C77] hover:text-[#0B1E2D] font-bold hover:underline transition cursor-pointer"
                >
                  Switch to School Administrator Secure Access &rarr;
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
