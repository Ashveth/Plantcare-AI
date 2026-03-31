import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { LogIn, UserPlus, LogOut, Leaf, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const Auth: React.FC<{ 
  onAuth: () => void; 
  onDemo: (data?: { displayName: string; photoURL: string | null }) => void 
}> = ({ onAuth, onDemo }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isGuestSetup, setIsGuestSetup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhoto, setGuestPhoto] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const getErrorMessage = (code: string) => {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'This email is already registered. Try signing in instead.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please try again.';
      case 'auth/operation-not-allowed':
        return 'This sign-in method is currently disabled. If you are the developer, please enable it in the Firebase Console (Authentication > Sign-in method).';
      case 'auth/popup-blocked':
        return 'Oops! The sign-in window was blocked. Please enable popups in your browser settings to continue.';
      case 'auth/popup-closed-by-user':
        return 'The sign-in window was closed. No changes were made.';
      case 'auth/cancelled-by-user':
        return 'The sign-in process was cancelled.';
      case 'auth/network-request-failed':
        return 'Connection error. Please check your internet and try again.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later for security.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast.success('Welcome back! 🌿');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        toast.success('Account created successfully! Welcome to the garden. ✨');
      }
      onAuth();
    } catch (err: any) {
      console.error("Auth Error:", err);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-by-user') {
        return;
      }
      const message = getErrorMessage(err.code);
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    const provider = new GoogleAuthProvider();
    setIsLoading(true);
    try {
      await signInWithPopup(auth, provider);
      toast.success('Signed in with Google! 🚀');
      onAuth();
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-by-user') {
        return;
      }
      const message = getErrorMessage(err.code);
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setError('Please enter a name');
      return;
    }
    onDemo({ displayName: guestName, photoURL: guestPhoto || null });
    toast.success(`Welcome, ${guestName}! 🌿`);
  };

  if (isGuestSetup) {
    return (
      <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-[40px] shadow-xl w-full max-w-md border border-emerald-100 animate-in fade-in zoom-in duration-300">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center text-white mb-4 shadow-lg">
              <Leaf size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Guest Profile</h1>
            <p className="text-gray-500 mt-2 text-center text-sm">Set up your local-only gardener profile</p>
          </div>

          <form onSubmit={handleGuestSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <input 
                type="text" 
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-emerald-500"
                placeholder="Your Name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profile Image URL (Optional)</label>
              <input 
                type="url" 
                value={guestPhoto}
                onChange={(e) => setGuestPhoto(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-emerald-500"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            {error && <p className="text-red-500 text-xs text-center font-medium">{error}</p>}

            <button 
              type="submit"
              className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-semibold hover:bg-emerald-700 transition-colors shadow-md flex items-center justify-center gap-2"
            >
              Start Gardening
            </button>
            
            <button 
              type="button"
              onClick={() => setIsGuestSetup(false)}
              className="w-full bg-gray-50 text-gray-600 py-3 rounded-2xl font-semibold hover:bg-gray-100 transition-colors"
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-emerald-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[40px] shadow-xl w-full max-w-md border border-emerald-100 animate-in fade-in zoom-in duration-300">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center text-white mb-4 shadow-lg">
            <Leaf size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">PlantCare AI</h1>
          <p className="text-gray-500 mt-2">Your smart plant companion</p>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-gray-100 rounded-2xl mb-8">
          <button 
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${isLogin ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Sign In
          </button>
          <button 
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${!isLogin ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-emerald-500 transition-all"
              placeholder="hello@example.com"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-emerald-500 transition-all"
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>

          {!isLogin && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-gray-50 border-none rounded-2xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-emerald-500 transition-all"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>
          )}

          {error && <p className="text-red-500 text-xs text-center font-medium">{error}</p>}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                {isLogin ? 'Sign In' : 'Create Account'}
              </>
            )}
          </button>
        </form>

        <div className="mt-8 flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-100"></div>
          <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Social Login</span>
          <div className="flex-1 h-px bg-gray-100"></div>
        </div>

        <div className="grid grid-cols-1 gap-3 mt-6">
          <button 
            onClick={handleGoogle}
            disabled={isLoading}
            className="w-full bg-white border border-gray-100 text-gray-700 py-3 rounded-2xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-sm"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                Continue with Google
              </>
            )}
          </button>
          
          <button 
            onClick={() => setIsGuestSetup(true)}
            disabled={isLoading}
            className="w-full bg-emerald-50 text-emerald-700 py-3 rounded-2xl font-bold hover:bg-emerald-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            Create Guest Account
          </button>
          
          <button 
            onClick={() => onDemo()}
            disabled={isLoading}
            className="w-full text-gray-400 py-2 text-[10px] font-bold uppercase tracking-widest hover:text-emerald-600 transition-colors"
          >
            Skip to Quick Demo
          </button>
        </div>
      </div>
    </div>
  );
};
