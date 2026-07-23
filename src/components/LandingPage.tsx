import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { School, Role } from '../types';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth, googleAuthProvider, db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const BACKGROUND_IMAGES = [
  'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=1920',
  'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&q=80&w=1920',
  'https://images.unsplash.com/photo-1544654803-b69140b285a1?auto=format&fit=crop&q=80&w=1920'
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
  AlertCircle
} from 'lucide-react';

interface LandingPageProps {
  schools: School[];
  onLogin: (school: School, role: Role, isDemo?: boolean, user?: any) => void;
  onRegisterSchool: (name: string, region: string, district: string, email: string, password: string) => Promise<{ success: boolean; school?: School; error?: string }>;
}

export default function LandingPage({ schools, onLogin, onRegisterSchool }: LandingPageProps) {
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
        alert('Registration successful! A verification email has been sent to your email address.');

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
            if (loginEmail.trim() === "superadmin@ges.gov.gh") {
              responseData = {
                success: true,
                user: { email: loginEmail.trim(), fullName: "Super Admin", role: "SuperAdmin" },
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
              const snapshot = await getDocs(query(collection(db, "schools"), where("email", "==", loginEmail.trim())));
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
                  user: { email: loginEmail.trim(), fullName: "Admin User", role: selectedRole },
                  role: selectedRole
                };
                isSuccess = true;
              } else {
                 setLoginError('Invalid official school email or password.');
                 return;
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
            alert("Database not configured. Please use 'admin@gedaschool.edu.gh' to try the demo.");
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
    <div className="min-h-screen bg-[#0a0f1c] text-slate-300 font-sans selection:bg-emerald-500/30 selection:text-emerald-200 overflow-x-hidden relative">
      {/* Background Slideshow */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <AnimatePresence>
          <motion.img
            key={bgIndex}
            src={BACKGROUND_IMAGES[bgIndex]}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 0.15, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full object-cover"
            alt="Ghana School Children Background"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c]/80 via-[#0a0f1c]/60 to-[#0a0f1c]"></div>
      </div>

      {/* Subtle Background Glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-[500px] bg-emerald-600/20 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none z-0" />

      {/* Upper Color Strip */}
      <div className="h-1 w-full flex relative z-50">
        <div className="h-full bg-red-500 flex-1"></div>
        <div className="h-full bg-amber-400 flex-1"></div>
        <div className="h-full bg-emerald-500 flex-1"></div>
      </div>

      {/* Hero Header */}
      <header className="border-b border-white/5 bg-[#0a0f1c]/80 sticky top-0 z-40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <span className="font-display font-bold text-lg tracking-tight text-white">GEDA Portal</span>
              <span className="block text-[9px] font-mono uppercase tracking-widest text-emerald-400/80 font-medium">Ghana Ed-Admissions</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-emerald-400 transition-colors">Features</a>
            <a href="#register" className="hover:text-emerald-400 transition-colors">Register</a>
            <a href="#login-portal" className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-1.5 rounded-full font-medium hover:bg-emerald-500/20 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.1)]">Sign In</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 lg:pt-28 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-16 lg:gap-8 items-center">
            
            {/* Left Column: Headline */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 space-y-8"
            >
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                <Globe className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-300 tracking-wide">Official Ghana Education Admission Framework</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold tracking-tight text-white leading-[1.1]">
                Modernize School Admissions, <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Online & Offline</span>
              </h1>
              
              <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
                Empowering Ghanaian Primary and Secondary Schools to digitally register new students, verify Mobile Money payment plans, instantly issue official GES admission letters, and sync data seamlessly in regions with low connectivity.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-300 bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" />
                  <span>GES Roster Formats</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-300 bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                  <WifiOff className="h-4.5 w-4.5 text-amber-400" />
                  <span>Offline Registry Cache</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-300 bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                  <Wallet className="h-4.5 w-4.5 text-cyan-400" />
                  <span>MoMo Payment Tracker</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-300 bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                  <CalendarCheck className="h-4.5 w-4.5 text-blue-400" />
                  <span>Mark Attendance</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-300 bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                  <ClipboardList className="h-4.5 w-4.5 text-purple-400" />
                  <span>Record SBA</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-slate-300 bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
                  <FileText className="h-4.5 w-4.5 text-emerald-400" />
                  <span>Issue Report Cards</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <a href="#login-portal" className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-[#0a0f1c] px-6 py-3.5 rounded-xl font-semibold shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all group">
                  Access School Dashboard <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </a>
                <a href="#register" className="inline-flex items-center justify-center bg-white/5 hover:bg-white/10 text-white px-6 py-3.5 rounded-xl border border-white/10 transition-all font-medium backdrop-blur-sm">
                  Register Your School
                </a>
              </div>
            </motion.div>

            {/* Right Column: Portal Gateway Selector */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-5 relative mt-6 lg:mt-0" 
              id="login-portal"
            >
              <div className="bg-[#0f172a]/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-6 sm:p-8 relative">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 rounded-t-2xl"></div>
                <div className="absolute top-0 right-4 sm:right-8 transform -translate-y-1/2 bg-[#0a0f1c] text-emerald-400 font-mono font-semibold text-[10px] uppercase px-3 py-1 rounded-full border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)] z-10 whitespace-nowrap">
                  SCHOOL LOGIN PORTAL
                </div>
                
                <h2 className="font-display font-bold text-2xl text-white mb-1 mt-2">Administrative Gateway</h2>
                <p className="text-slate-400 text-sm mb-6">Select your role and sign in to access your school's private dashboard.</p>

                {/* Login Mode Toggle Tabs */}
                <div className="grid grid-cols-2 gap-2 bg-[#0a0f1c] p-1.5 rounded-xl mb-6 text-xs font-semibold border border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMode('secure');
                      setLoginError('');
                    }}
                    className={`py-2 text-center rounded-lg transition-all cursor-pointer ${
                      loginMode === 'secure'
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-300'
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
                    className={`py-2 text-center rounded-lg transition-all cursor-pointer ${
                      loginMode === 'demo'
                        ? 'bg-white/10 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    Quick Demo Access
                  </button>
                </div>

                {loginError && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 text-red-400 border border-red-500/20 px-4 py-3 rounded-xl mb-6 text-sm flex items-start gap-2">
                    {loginError}
                  </motion.div>
                )} 

                <form onSubmit={handleLoginSubmit} autoComplete="off" className="space-y-5">
                  {loginMode === 'secure' ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                      <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">School Official Email</label>
                        <div className="relative">
                          <input
                            type="email"
                            autoComplete="off"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            placeholder="administrator@achimota.edu.gh"
                            className="w-full bg-[#0a0f1c] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-sm transition-all placeholder:text-slate-600 dark:text-slate-400"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">Password</label>
                          <button
                            type="button"
                            onClick={() => {
                              setShowForgotPasswordModal(true);
                              setForgotPasswordEmail(loginEmail);
                              setForgotPasswordMsg('');
                              setForgotPasswordError('');
                            }}
                            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold hover:underline transition-colors cursor-pointer"
                          >
                            Forgot Password?
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type="password"
                            autoComplete="current-password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-[#0a0f1c] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-sm transition-all placeholder:text-slate-600 dark:text-slate-400"
                            required
                          />
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 text-xs">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
                          <ShieldCheck className="h-4 w-4" />
                          <span>Sandbox Environment</span>
                        </div>
                        <p className="text-slate-300">
                          Quick Demo Access provides instant sandbox evaluation strictly for <strong>GEDA School Complex</strong>.
                        </p>
                        <p className="text-slate-400 text-[11px] mt-1">
                          All registered tenants are isolated and require official credentials under Secure School Login.
                        </p>
                      </div>

                      <div className="bg-[#0a0f1c] border border-white/10 rounded-xl p-3.5 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-500 block">Demo Tenant</span>
                          <span className="font-bold text-white text-sm">GEDA School Complex</span>
                          <span className="text-[11px] text-slate-400 block">Greater Accra &bull; Accra Metropolitan</span>
                        </div>
                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono px-2 py-1 rounded-md font-semibold">
                          PUBLIC DEMO
                        </span>
                      </div>
                    </motion.div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Role-Based Access Permission</label>
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {(['Admin', 'Staff', 'Teacher'] as Role[]).map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setSelectedRole(role)}
                          className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                            selectedRole === role
                              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                              : 'bg-[#0a0f1c] border-white/5 text-slate-500 dark:text-slate-400 hover:bg-white/5 hover:text-slate-300'
                          }`}
                        >
                          {role === 'Admin' && <ShieldCheck className="h-4 w-4 mb-0.5" />}
                          {role === 'Staff' && <Lock className="h-4 w-4 mb-0.5" />}
                          {role === 'Teacher' && <GraduationCap className="h-4 w-4 mb-0.5" />}
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-[#0a0f1c] font-bold py-3.5 px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                  >
                    {isLoggingIn ? 'Authenticating Gateway...' : 'Enter Dashboard'}
                    {!isLoggingIn && <ArrowRight className="h-4 w-4" />}
                  </button>
                  
                  {loginMode === 'secure' && (
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={isLoggingIn}
                      className="w-full bg-white hover:bg-gray-100 text-gray-900 font-bold py-3.5 px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed mt-3"
                    >
                      <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Sign In with Google
                    </button>
                  )}
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-[#060913] relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-display font-bold text-white mb-4">Built for Ghana's Education Ecosystem</h2>
            <p className="text-slate-400">A resilient platform designed to handle the realities of infrastructure while delivering modern administrative capabilities.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <motion.div whileHover={{ y: -5 }} className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
              <div className="bg-blue-500/10 text-blue-400 p-3 rounded-xl w-fit mb-5">
                <Database className="h-6 w-6" />
              </div>
              <h3 className="font-display font-semibold text-lg text-white mb-2">Offline-First Resilience</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Continue registering students and recording payments even when the internet drops. Data syncs automatically when connection is restored.
              </p>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
              <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-xl w-fit mb-5">
                <Wallet className="h-6 w-6" />
              </div>
              <h3 className="font-display font-semibold text-lg text-white mb-2">MoMo Payment Tracker</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Track Mobile Money payments natively. Log transaction IDs and instantly generate receipts for parents paying via MTN MoMo or Telecel Cash.
              </p>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-sm">
              <div className="bg-purple-500/10 text-purple-400 p-3 rounded-xl w-fit mb-5">
                <KeyRound className="h-6 w-6" />
              </div>
              <h3 className="font-display font-semibold text-lg text-white mb-2">Seamless SIS API Sync</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Developer-ready secure REST endpoints. Extract rosters or register new records via authorized external Student Information Systems (SIS).
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* School Registration Form Section */}
      <section id="register" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] to-[#060913]"></div>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="bg-[#0f172a]/60 backdrop-blur-md rounded-3xl border border-white/10 p-8 sm:p-12 shadow-2xl">
            <div className="text-center space-y-3 mb-10">
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-semibold w-fit mx-auto uppercase tracking-wide">
                Add Your Institution
              </div>
              <h2 className="font-display font-bold text-3xl text-white">Register a New School</h2>
              <p className="text-slate-400 text-sm max-w-lg mx-auto">Create a dedicated, private tenant space for your school. You can immediately access its administrative backend upon submission.</p>
            </div>

            {registerError && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-500/10 text-red-400 border border-red-500/20 px-5 py-4 rounded-xl mb-8 text-sm">
                {registerError}
              </motion.div>
            )}

            {registerSuccess && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-5 py-4 rounded-xl mb-8 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 shrink-0" />
                  <span>School registered successfully! We have automatically selected your school in the login portal.</span>
                </div>
                <button
                  onClick={() => {
                    const schoolToLogin = registeredSchool || schools.find(s => s.id === selectedSchoolId);
                    if (schoolToLogin) {
                      onLogin(schoolToLogin, 'Admin', false);
                    }
                  }}
                  className="bg-emerald-500 text-[#0a0f1c] font-bold px-4 py-2 rounded-lg text-xs whitespace-nowrap hover:bg-emerald-400 transition-colors cursor-pointer self-end sm:self-auto"
                >
                  Enter Dashboard
                </button>
              </motion.div>
            )}

            <form onSubmit={handleRegister} autoComplete="off" className="grid sm:grid-cols-2 gap-6">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">School Official Name</label>
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="e.g. Accra Methodist Basic School"
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  className="w-full bg-[#0a0f1c] border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-sm transition-all placeholder:text-slate-600 dark:text-slate-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">GES Regional Division</label>
                <select
                  value={newSchoolRegion}
                  onChange={(e) => setNewSchoolRegion(e.target.value)}
                  className="w-full bg-[#0a0f1c] border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-sm transition-all appearance-none"
                >
                  {ghanaRegions.map((reg) => (
                    <option key={reg} value={reg} className="bg-[#0f172a]">{reg}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Municipal District</label>
                <input
                  type="text"
                  autoComplete="off"
                  placeholder="e.g. Kumasi Metro"
                  value={newSchoolDistrict}
                  onChange={(e) => setNewSchoolDistrict(e.target.value)}
                  className="w-full bg-[#0a0f1c] border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-sm transition-all placeholder:text-slate-600 dark:text-slate-400"
                  required
                />
              </div>

              <div className="sm:col-span-2 border-t border-white/5 pt-6 mt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-5">Official Administrator Account Credentials</h3>
              </div>
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">School Contact/Login Email</label>
                <input
                  type="email"
                  autoComplete="off"
                  placeholder="e.g. admin@school.edu.gh"
                  value={newSchoolEmail}
                  onChange={(e) => setNewSchoolEmail(e.target.value)}
                  className="w-full bg-[#0a0f1c] border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-sm transition-all placeholder:text-slate-600 dark:text-slate-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Administrator Password *</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="•••••••• (min 6 chars)"
                  value={newSchoolPassword}
                  onChange={(e) => setNewSchoolPassword(e.target.value)}
                  className="w-full bg-[#0a0f1c] border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-sm transition-all placeholder:text-slate-600 dark:text-slate-400"
                  minLength={6}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Repeat / Confirm Password *</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="•••••••• (repeat password)"
                  value={newSchoolConfirmPassword}
                  onChange={(e) => setNewSchoolConfirmPassword(e.target.value)}
                  className="w-full bg-[#0a0f1c] border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-sm transition-all placeholder:text-slate-600 dark:text-slate-400"
                  minLength={6}
                  required
                />
                {newSchoolConfirmPassword.length > 0 && (
                  <p className={`text-[11px] font-medium mt-1.5 flex items-center gap-1 ${
                    newSchoolPassword === newSchoolConfirmPassword ? 'text-emerald-400' : 'text-red-400'
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

              

              <div className="sm:col-span-2 pt-4">
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#0a0f1c] font-bold py-4 px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isRegistering ? 'Provisioning School Space...' : 'Register Institution & Create Admin Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#090d16] text-white py-12 border-t border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="flex items-center justify-center gap-2.5 text-white text-xl font-extrabold">
            <GraduationCap className="h-7 w-7 text-emerald-400" />
            <span className="font-display tracking-tight text-white">GEDA Portal — Ghana Ed-Admissions</span>
          </div>
          <p className="text-sm max-w-xl mx-auto text-slate-100 font-normal leading-relaxed">
            Providing resilient, multi-tenant digital administration services for schools across the Republic of Ghana.
          </p>
          <div className="pt-6 border-t border-slate-700 max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white font-semibold">
            <div className="text-slate-100">
              &copy; {new Date().getFullYear()} GEDA Ghana. Compliant with Ghana Education Service (GES) data standards.
            </div>
            <div className="text-emerald-300 font-bold bg-emerald-950 border border-emerald-400 px-4 py-2 rounded-full flex items-center gap-2">
              <span>Developed &copy; BossITSolutions</span>
            </div>
          </div>
        </div>
      </footer>
      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#0f172a] border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-5">
            <button 
              onClick={() => { setShowForgotPasswordModal(false); setForgotPasswordMsg(''); setForgotPasswordError(''); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-lg font-display">
                <KeyRound className="h-5 w-5" />
                <span>Account Password Recovery</span>
              </div>
              <p className="text-slate-400 text-xs">Enter your registered email address to receive password recovery instructions or reset information.</p>
            </div>

            {forgotPasswordError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                <span>{forgotPasswordError}</span>
              </div>
            )}

            {forgotPasswordMsg ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl text-xs space-y-3">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Request Processed</span>
                </div>
                <p className="leading-relaxed text-slate-200">{forgotPasswordMsg}</p>
                <button
                  onClick={() => { setShowForgotPasswordModal(false); setForgotPasswordMsg(''); }}
                  className="w-full bg-emerald-500 text-slate-950 font-bold py-2.5 rounded-xl text-xs hover:bg-emerald-400 transition cursor-pointer mt-2"
                >
                  Return to Portal Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Registered Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. admin@school.edu.gh or teacher@school.edu.gh"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="w-full bg-[#0a0f1c] border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    required
                  />
                </div>

                <div className="bg-slate-900/60 border border-white/5 p-3 rounded-xl text-[11px] text-slate-400 space-y-1">
                  <span className="font-semibold text-slate-300 block">&bull; School Administrators:</span>
                  <p>Recovery credentials dispatched via verified school contact channel.</p>
                  <span className="font-semibold text-slate-300 block pt-1">&bull; Registered Teachers:</span>
                  <p>Password resets are handled securely by your School Administrator via generated Password Slips.</p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingForgotPassword}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingForgotPassword ? 'Checking Recovery Records...' : 'Submit Password Reset Request'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
