import React, { useState } from 'react';
import { 
  BadgeCheck, 
  Star, 
  Lock, 
  Scale, 
  Eye, 
  EyeOff, 
  LogIn, 
  ArrowRight, 
  Loader2,
  AlertCircle,
  Mail,
  ShieldCheck,
  Shield,
  User,
  UserPlus,
  BookOpen,
  Landmark,
  Gavel,
  Cpu,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import ladyJusticeBg from '../assets/images/lady_justice_warm_library.jpg';

export const LoginScreen: React.FC = () => {
  const { signInWithEmail, registerWithEmail, signInWithGoogle, isLoading } = useAuth();
  
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');
  const [selectedRole, setSelectedRole] = useState<Role>('Constable');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roleOptions: { role: Role; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { role: 'Constable', label: 'Constable', icon: ShieldCheck },
    { role: 'Sub-Inspector', label: 'Sub-Inspector', icon: Star },
    { role: 'Admin', label: 'Admin', icon: Lock },
    { role: 'Legal Officer', label: 'Legal Officer', icon: Scale },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your official email address.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      setError('Please provide a valid official email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    if (authMode === 'register') {
      if (!fullName.trim()) {
        setError('Please enter your full name & rank.');
        return;
      }
      if (password.length < 6) {
        setError('Password must contain at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please verify.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (authMode === 'signin') {
        if (signInWithEmail) {
          await signInWithEmail(trimmedEmail, password, selectedRole);
        } else {
          await signInWithGoogle();
        }
      } else {
        if (registerWithEmail) {
          await registerWithEmail(fullName.trim(), trimmedEmail, password, selectedRole);
        } else {
          await signInWithGoogle();
        }
      }
    } catch (err: any) {
      console.warn('Authentication status:', err?.message || err);
      const code = err?.code || '';
      const rawMsg = err?.message || '';
      let msg = rawMsg || 'Authentication error. Please check your credentials.';

      if (rawMsg.includes('over_email_send_rate_limit') || code === 'over_email_send_rate_limit' || rawMsg.includes('email rate limit exceeded')) {
        msg = 'Supabase email rate limit reached. Supabase limits outgoing confirmation emails. In Supabase Dashboard → Authentication → Providers → Email, disable "Confirm email" for instant password logins without rate limit blocks.';
      } else if (rawMsg.includes('Email not confirmed') || code === 'email_not_confirmed') {
        msg = 'Email not confirmed yet. Please verify your email via the confirmation link sent by Supabase, or disable "Confirm email" in your Supabase Authentication settings to allow immediate login.';
      } else if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found' || code === 'auth/invalid-email' || rawMsg.includes('Invalid login credentials')) {
        msg = 'Invalid credentials. Please verify your email and password, or register a new account.';
      } else if (code === 'auth/email-already-in-use' || rawMsg.includes('User already registered')) {
        msg = 'This email is already registered. Please switch to Sign In or verify your password.';
      } else if (code === 'auth/weak-password' || rawMsg.includes('Password should be')) {
        msg = 'Password is too weak. Must be at least 6 characters.';
      } else if (code === 'auth/operation-not-allowed') {
        msg = 'Connecting officer session...';
      }
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err?.message || 'Google authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col lg:flex-row bg-[#FAF8F3] text-[#142033] overflow-x-hidden selection:bg-[#B58A45]/25 selection:text-[#142033]">
      
      {/* Background Warm Legal Atmosphere with Lady Justice and Law Library */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-[#FAF8F3]">
        {/* Lady Justice in Warm Law Library Photograph */}
        <img 
          src={ladyJusticeBg} 
          alt="LAWGIC AI Legal Atmosphere - Lady Justice & Law Library" 
          className="w-full h-full object-cover object-[78%_center] opacity-40 mix-blend-multiply transition-opacity duration-700"
        />
        {/* Ivory Linear Gradient: Dense on Left for Maximum Readability, Gently Translucent on Right to Reveal Lady Justice */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F3] via-[#FAF8F3]/92 sm:via-[#FAF8F3]/80 to-[#FAF8F3]/25" />
        
        {/* Soft Vertical Gradient to Ground Bottom Library Desk */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#F7F4EE] via-transparent to-[#FAF8F3]/60" />
        
        {/* Subtle Warm Amber/Gold Radial Glow Near Scales of Justice */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_35%,rgba(181,138,69,0.12),transparent_65%)]" />
      </div>

      {/* Main Split Layout Container */}
      <div className="relative z-10 w-full min-h-screen max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between p-6 sm:p-10 lg:p-14 gap-8 lg:gap-14">
        
        {/* ================= LEFT SIDE: EDITORIAL LEGAL HERO ================= */}
        <div className="w-full lg:w-[54%] flex flex-col justify-between py-6 lg:py-10 z-10">
          
          <div>
            {/* Top Emblem & Category */}
            <div className="flex items-center gap-3.5 mb-8">
              <div className="w-11 h-11 rounded-xl border border-[#E7DED0] bg-white/90 backdrop-blur-md flex items-center justify-center shadow-[0_2px_12px_rgba(20,32,51,0.04)]">
                <Scale className="w-5 h-5 text-[#B58A45]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[11px] font-sans font-bold tracking-[0.2em] text-[#B58A45] uppercase">
                  LEGAL INTELLIGENCE COMMAND
                </span>
                <div className="h-[1px] w-24 bg-gradient-to-r from-[#B58A45]/60 to-transparent mt-1" />
              </div>
            </div>

            {/* Editorial Serif Headline matching reference */}
            <h1 className="font-serif-legal text-4xl sm:text-5xl lg:text-[54px] font-bold text-[#142033] leading-[1.12] tracking-tight mb-4">
              Where Jurisprudence <br />
              Meets <span className="text-[#B58A45] italic font-normal">Precision.</span>
            </h1>

            {/* Subtle Gold Divider */}
            <div className="h-[1px] w-14 bg-[#B58A45]/45 mb-6" />

            {/* Sub-branding & Description */}
            <div className="mb-8">
              <h2 className="font-serif-legal font-bold text-xl sm:text-2xl text-[#B58A45] tracking-wider mb-2.5">
                LAWGIC AI
              </h2>
              <p className="text-[#64748B] text-sm sm:text-base leading-relaxed max-w-lg font-sans">
                AI-assisted FIR drafting, statutory section correlation, and case law precedents engineered for law enforcement &amp; judicial authorities.
              </p>
            </div>

            {/* Legal Framework Pill Badges matching reference */}
            <div className="inline-flex flex-wrap items-center gap-3 sm:gap-4 px-5 py-3 rounded-full bg-white/85 border border-[#E7DED0] backdrop-blur-md text-xs font-medium text-[#142033] shadow-[0_2px_10px_rgba(20,32,51,0.03)] mb-8">
              <span className="flex items-center gap-1.5 font-semibold text-[#142033]">
                <BookOpen className="w-4 h-4 text-[#B58A45] shrink-0" /> BNS 2023
              </span>
              <span className="text-[#B58A45]/40">•</span>
              <span className="flex items-center gap-1.5 font-semibold text-[#142033]">
                <Landmark className="w-4 h-4 text-[#B58A45] shrink-0" /> BNSS 2023
              </span>
              <span className="text-[#B58A45]/40">•</span>
              <span className="flex items-center gap-1.5 font-semibold text-[#142033]">
                <ShieldCheck className="w-4 h-4 text-[#B58A45] shrink-0" /> BSA 2023
              </span>
              <span className="text-[#B58A45]/40">•</span>
              <span className="flex items-center gap-1.5 font-semibold text-[#142033]">
                <Gavel className="w-4 h-4 text-[#B58A45] shrink-0" /> SUPREME COURT RATIO
              </span>
            </div>
          </div>

          {/* Bottom Security / Trust Badges matching reference */}
          <div>
            <div className="h-[1px] w-full max-w-lg bg-[#E7DED0] mb-5" />
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs font-sans font-medium text-[#64748B]">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#B58A45] shrink-0" />
                <span>Institutional Grade Security</span>
              </div>
              <span className="text-[#E7DED0] hidden sm:inline">|</span>
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#B58A45] shrink-0" />
                <span>Grounded AI Models</span>
              </div>
              <span className="text-[#E7DED0] hidden sm:inline">|</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#B58A45] shrink-0" />
                <span>Human Verified Review</span>
              </div>
            </div>
          </div>

        </div>

        {/* ================= RIGHT SIDE: AUTHENTICATION CARD ================= */}
        <div className="w-full lg:w-[46%] flex justify-center lg:justify-end z-10">
          
          <div className="w-full max-w-[440px] bg-white text-[#142033] rounded-2xl p-6 sm:p-8 shadow-[0_12px_40px_rgba(20,32,51,0.06),0_1px_3px_rgba(20,32,51,0.03)] border border-[#E7DED0] transition-all">
            
            {/* Top Branding Section */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-11 h-11 mb-2.5 rounded-xl bg-[#FAF8F3] border border-[#E7DED0] shadow-2xs">
                <Scale className="w-5 h-5 text-[#B58A45]" />
              </div>
              <h2 className="font-serif-legal text-2xl font-bold tracking-tight text-[#142033]">
                Lawgic AI
              </h2>
              <p className="text-[13px] text-[#64748B] font-sans mt-0.5">
                Police FIR Drafting &amp; Legal Guidance
              </p>
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#64748B] mt-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#B58A45]" />
                <span>Secure access to legal intelligence workspace</span>
              </div>
            </div>

            {/* Segmented Sign In / Register Switcher */}
            <div className="bg-[#F5F2EB] p-1 rounded-xl flex items-center mb-5">
              <button
                type="button"
                id="tab-sign-in"
                onClick={() => {
                  setAuthMode('signin');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 text-center text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMode === 'signin'
                    ? 'bg-[#142033] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#142033]'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Sign In
              </button>
              <button
                type="button"
                id="tab-register"
                onClick={() => {
                  setAuthMode('register');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-2 text-center text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMode === 'register'
                    ? 'bg-[#142033] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#142033]'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Register
              </button>
            </div>

            {/* Role Selection Section */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#64748B]">
                  Jurisdictional Role
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold bg-[#FAF8F3] text-[#B58A45] border border-[#E7DED0]">
                  {selectedRole}
                </span>
              </div>

              {/* 2x2 Role Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {roleOptions.map(({ role, label, icon: Icon }) => {
                  const isSelected = selectedRole === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      id={`role-btn-${role.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={() => setSelectedRole(role)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all duration-150 cursor-pointer text-left ${
                        isSelected
                          ? 'bg-white border-[#B58A45] text-[#142033] shadow-xs ring-1 ring-[#B58A45]/30'
                          : 'bg-[#FAF8F3]/60 border-[#E7DED0] text-[#64748B] hover:border-[#B58A45]/40 hover:bg-white'
                      }`}
                    >
                      {/* Radio Dot Indicator */}
                      <span 
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border transition-colors shrink-0 ${
                          isSelected 
                            ? 'border-[#B58A45] bg-[#B58A45]' 
                            : 'border-[#CBD5E1] bg-white'
                        }`}
                      >
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>

                      {/* Icon */}
                      <Icon 
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isSelected ? 'text-[#B58A45]' : 'text-[#94A3B8]'
                        }`} 
                      />

                      {/* Label */}
                      <span className="text-xs font-semibold truncate">
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Success Notification */}
            {successMsg && (
              <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-start gap-2 leading-snug">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <span className="flex-1">{successMsg}</span>
              </div>
            )}

            {/* Error Notification */}
            {error && (
              <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium flex items-start gap-2 leading-snug">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <span className="flex-1">{error}</span>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Register Mode - Full Name Input */}
              {authMode === 'register' && (
                <div>
                  <label 
                    htmlFor="officer-fullname" 
                    className="block text-[11px] font-sans font-bold uppercase tracking-wider text-[#64748B] mb-1.5"
                  >
                    Full Name &amp; Rank
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 w-4 h-4 text-[#94A3B8]" />
                    <input
                      id="officer-fullname"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Inspector Rajesh Sharma"
                      autoComplete="name"
                      className="w-full h-11 pl-10 pr-3.5 bg-[#FAF8F3]/50 hover:bg-white focus:bg-white border border-[#E7DED0] rounded-xl text-[#142033] text-sm placeholder-[#94A3B8] focus:outline-none focus:border-[#B58A45] focus:ring-1 focus:ring-[#B58A45] transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Email Input */}
              <div>
                <label 
                  htmlFor="officer-email" 
                  className="block text-[11px] font-sans font-bold uppercase tracking-wider text-[#64748B] mb-1.5"
                >
                  Official Email
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-[#94A3B8]" />
                  <input
                    id="officer-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@police.gov.in"
                    autoComplete="email"
                    className="w-full h-11 pl-10 pr-3.5 bg-[#FAF8F3]/50 hover:bg-white focus:bg-white border border-[#E7DED0] rounded-xl text-[#142033] text-sm placeholder-[#94A3B8] focus:outline-none focus:border-[#B58A45] focus:ring-1 focus:ring-[#B58A45] transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label 
                  htmlFor="officer-password" 
                  className="block text-[11px] font-sans font-bold uppercase tracking-wider text-[#64748B] mb-1.5"
                >
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-[#94A3B8]" />
                  <input
                    id="officer-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'}
                    className="w-full h-11 pl-10 pr-10 bg-[#FAF8F3]/50 hover:bg-white focus:bg-white border border-[#E7DED0] rounded-xl text-[#142033] text-sm placeholder-[#94A3B8] focus:outline-none focus:border-[#B58A45] focus:ring-1 focus:ring-[#B58A45] transition-all"
                  />
                  <button
                    type="button"
                    id="toggle-password-visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-[#94A3B8] hover:text-[#142033] p-1 rounded transition-colors cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Register Mode - Confirm Password */}
              {authMode === 'register' && (
                <div>
                  <label 
                    htmlFor="officer-confirm-password" 
                    className="block text-[11px] font-sans font-bold uppercase tracking-wider text-[#64748B] mb-1.5"
                  >
                    Confirm Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 w-4 h-4 text-[#94A3B8]" />
                    <input
                      id="officer-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      autoComplete="new-password"
                      className="w-full h-11 pl-10 pr-10 bg-[#FAF8F3]/50 hover:bg-white focus:bg-white border border-[#E7DED0] rounded-xl text-[#142033] text-sm placeholder-[#94A3B8] focus:outline-none focus:border-[#B58A45] focus:ring-1 focus:ring-[#B58A45] transition-all"
                    />
                    <button
                      type="button"
                      id="toggle-confirm-password-visibility"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 text-[#94A3B8] hover:text-[#142033] p-1 rounded transition-colors cursor-pointer"
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Primary Action Button (Sign In Securely) */}
              <div className="pt-2">
                <button
                  type="submit"
                  id="auth-primary-submit-btn"
                  disabled={isSubmitting || isLoading}
                  className="group w-full h-12 bg-[#142033] hover:bg-[#1E2E48] active:bg-[#0E1724] text-white rounded-xl font-semibold text-sm flex items-center justify-between px-5 transition-all duration-150 disabled:opacity-60 cursor-pointer shadow-sm"
                >
                  {/* Left Login Icon */}
                  <span className="flex items-center justify-center w-5 h-5">
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <LogIn className="w-4 h-4 text-white/90" />
                    )}
                  </span>

                  {/* Center Text */}
                  <span className="font-semibold tracking-wide">
                    {isSubmitting 
                      ? (authMode === 'signin' ? 'Authenticating...' : 'Registering...')
                      : (authMode === 'signin' ? 'Sign In Securely' : 'Register Account Securely')
                    }
                  </span>

                  {/* Right Gold Arrow */}
                  <span className="flex items-center justify-center w-5 h-5">
                    <ArrowRight className="w-4 h-4 text-[#B58A45] group-hover:translate-x-1 transition-transform duration-150" />
                  </span>
                </button>
              </div>
            </form>

            {/* Alternative Google Sign-In */}
            <div className="mt-4 pt-4 border-t border-[#E7DED0] flex flex-col items-center gap-2.5">
              <button
                type="button"
                id="google-auth-btn"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting || isLoading}
                className="w-full h-10 bg-white hover:bg-[#FAF8F3] border border-[#E7DED0] text-[#142033] rounded-xl font-medium text-xs flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-2xs"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Or continue with Google Workspace</span>
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#64748B] text-center pt-1">
                <Lock className="w-3 h-3 text-[#94A3B8]" />
                <span>Protected by immutable audit and session encryption</span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
