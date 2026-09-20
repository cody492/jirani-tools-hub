import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  Calendar,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Database,
  Cpu,
  Fingerprint,
} from 'lucide-react';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from '../../services/firebase';
import { syncUserProfile } from '../../services/firestoreService';
import { LegalModal } from '../legal/LegalModal';

interface AuthPageProps {
  onAuthenticated: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [birthAge, setBirthAge] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!email.trim() || !password.trim()) {
          throw new Error('Please provide both email and a secure password.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (displayName.trim()) {
          await updateProfile(userCredential.user, { displayName: displayName.trim() });
        }

        // Synchronize user profile into Firestore `users` collection immediately
        await syncUserProfile(userCredential.user, {
          birthAge: birthAge.trim(),
          displayName: displayName.trim(),
          signInMethod: 'Email / Password',
        });
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        // Sync login timestamp to Firestore
        await syncUserProfile(userCredential.user, {
          signInMethod: 'Email / Password',
        });
      }

      onAuthenticated();
    } catch (err: any) {
      console.error('Authentication Error:', err);
      let msg = err.message || 'Authentication failed. Please check your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Invalid email or password. If you do not have an account yet, switch to "Create Account".';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Please switch to "Sign In".';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password is too weak. Please choose at least 6 characters.';
      } else if (err.code === 'auth/popup-closed-by-user') {
        msg = 'Sign in window was closed before completing.';
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Synchronize Google user to Firestore `users` collection
      await syncUserProfile(result.user, {
        signInMethod: 'Google (Gmail)',
      });
      onAuthenticated();
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      let msg = err.message || 'Google sign-in failed.';
      if (err.code === 'auth/popup-closed-by-user') {
        msg = 'Google sign-in window was closed.';
      } else if (err.code === 'auth/unauthorized-domain') {
        msg = 'This domain is not yet authorized in Firebase Console. Please add the app URL to Authorized Domains in Firebase Auth settings.';
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[340px] bg-cyan-600/10 blur-[130px] rounded-full" />
        <div className="absolute top-1/3 -left-32 w-80 h-80 bg-blue-700/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-600/10 blur-[140px] rounded-full" />
      </div>

      {/* Top Bar Header */}
      <header className="relative z-10 border-b border-[#151d2f] bg-[#090e1a]/80 backdrop-blur px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#11192b] border border-cyan-800/50 flex items-center justify-center text-cyan-400 shadow-sm shadow-cyan-950">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-mono font-bold tracking-wider text-slate-100 uppercase">
              Web Forensics
            </span>
            <span className="text-[10px] font-mono text-cyan-400 block -mt-0.5">
              Zero-Trust Investigation Suite
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="hidden sm:inline text-[11px]">Securely Analyze Public Domains</span>
        </div>
      </header>

      {/* Main Content: Value Overview + Auth Form */}
      <main className="relative z-10 flex-1 max-w-5xl mx-auto w-full px-4 py-8 md:py-12 flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-14">
        {/* Left Column: Easy-to-understand Explanation of Web Forensics */}
        <div className="w-full lg:w-1/2 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10192b] border border-cyan-800/40 text-cyan-400 text-xs font-mono">
            <Fingerprint className="w-3.5 h-3.5" />
            <span>Authorized Security Analyst Gateway</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-mono font-bold text-slate-100 tracking-tight leading-tight">
              Investigate any domain with clarity, speed & privacy.
            </h1>
            <p className="text-sm sm:text-base text-slate-300 font-sans leading-relaxed">
              Web Forensics turns complex public internet protocols into clear, readable intelligence. Whether diagnosing DNS routing, inspecting TLS encryption, or auditing web technology stacks, you get accurate forensic telemetry without running complicated terminal scripts.
            </p>
          </div>

          {/* Key Value Cards */}
          <div className="space-y-3 pt-2">
            <div className="p-3.5 rounded-lg border border-[#182337] bg-[#0c1220]/90 flex items-start gap-3">
              <div className="p-2 rounded bg-cyan-950/40 border border-cyan-800/30 text-cyan-400 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  Instant Domain Transparency
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter any public domain to reveal its full infrastructure footprint: DNS records, HTTP redirect chains, headers, servers, and security posture in seconds.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg border border-[#182337] bg-[#0c1220]/90 flex items-start gap-3">
              <div className="p-2 rounded bg-blue-950/40 border border-blue-800/30 text-blue-400 shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  Strict Data Security & Privacy
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Built with Zero-Trust rules. Your investigation records and search targets are private to your account—User A can never see or access User B&apos;s forensic data.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg border border-[#182337] bg-[#0c1220]/90 flex items-start gap-3">
              <div className="p-2 rounded bg-indigo-950/40 border border-indigo-800/30 text-indigo-400 shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  Reliable Cloud Persistence
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Every scan is automatically organized in your personal Firestore database so you can inspect historical target behavior anytime across devices.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Authentication Card */}
        <div className="w-full lg:w-[420px] shrink-0">
          <div className="rounded-xl border border-[#1d273d] bg-[#0c111e] p-6 sm:p-7 shadow-2xl shadow-cyan-950/20 space-y-5">
            {/* Form Header */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-[#182337]">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                    {mode === 'signin' ? 'Sign In to Workspace' : 'Create Investigator Account'}
                  </span>
                </div>

                <div className="flex rounded-md bg-[#131a29] p-0.5 border border-[#202c42]">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setErrorMessage(null);
                    }}
                    className={`px-2.5 py-1 text-[11px] font-mono rounded transition-all ${
                      mode === 'signin'
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setErrorMessage(null);
                    }}
                    className={`px-2.5 py-1 text-[11px] font-mono rounded transition-all ${
                      mode === 'signup'
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Register
                  </button>
                </div>
              </div>

              <p className="text-xs font-sans text-slate-400 mt-2.5">
                {mode === 'signin'
                  ? 'Enter your credentials or use Google sign in to access your forensic tools.'
                  : 'Register your account to access your personal investigation dashboard and cloud database.'}
              </p>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 flex items-start gap-2.5 text-xs text-rose-300 font-mono">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Google Sign In Button */}
            <button
              type="button"
              id="btn-google-signin"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#141b2c] hover:bg-[#1a243b] text-slate-200 border border-[#23314d] text-xs font-mono font-medium flex items-center justify-center gap-3 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Legal Notice */}
            <p className="text-[11px] font-sans text-center text-slate-500 leading-tight">
              By proceeding, you agree to our{' '}
              <button
                type="button"
                onClick={() => setLegalModalType('terms')}
                className="text-cyan-400 hover:underline inline font-medium"
              >
                Terms of Service
              </button>{' '}
              and{' '}
              <button
                type="button"
                onClick={() => setLegalModalType('privacy')}
                className="text-cyan-400 hover:underline inline font-medium"
              >
                Privacy Policy
              </button>
              .
            </p>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-[#1a2337] w-full" />
              <span className="bg-[#0c111e] px-2 text-[10px] font-mono uppercase text-slate-500 shrink-0">
                or with email
              </span>
              <div className="border-t border-[#1a2337] w-full" />
            </div>

            {/* Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3.5">
              {mode === 'signup' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                      <User className="w-3 h-3 text-cyan-400" />
                      <span>Full Name or Callsign</span>
                    </label>
                    <input
                      type="text"
                      id="input-display-name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Agent Miller"
                      className="w-full px-3 py-2 rounded bg-[#111726] border border-[#212c42] text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-cyan-400" />
                      <span>Age or Year of Birth</span>
                    </label>
                    <input
                      type="text"
                      id="input-birth-age"
                      value={birthAge}
                      onChange={(e) => setBirthAge(e.target.value)}
                      placeholder="e.g. 28 or 1996"
                      className="w-full px-3 py-2 rounded bg-[#111726] border border-[#212c42] text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
                    />
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-cyan-400" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  id="input-auth-email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@domain.com"
                  className="w-full px-3 py-2 rounded bg-[#111726] border border-[#212c42] text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-cyan-400" />
                    <span>Password</span>
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="input-auth-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-3 pr-9 py-2 rounded bg-[#111726] border border-[#212c42] text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="btn-auth-submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-mono font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <span>
                  {loading
                    ? 'Processing...'
                    : mode === 'signin'
                    ? 'Enter Forensic Workspace'
                    : 'Create Investigator Account'}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#141b2c] py-4 px-6 text-center text-xs font-mono text-slate-500">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
          <span>Web Forensics Intelligence Engine • Connected to Firebase</span>
          <span className="hidden sm:inline text-slate-700">•</span>
          <div className="flex items-center gap-3 text-[11px]">
            <button
              type="button"
              onClick={() => setLegalModalType('privacy')}
              className="text-slate-400 hover:text-cyan-400 hover:underline transition-colors"
            >
              Privacy Policy
            </button>
            <span className="text-slate-700">•</span>
            <button
              type="button"
              onClick={() => setLegalModalType('terms')}
              className="text-slate-400 hover:text-cyan-400 hover:underline transition-colors"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </footer>

      {/* Legal Modal */}
      <LegalModal
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />
    </div>
  );
};
