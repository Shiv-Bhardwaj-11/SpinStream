import { useState } from 'react';
import { useStore } from '../store/useStore';
import { playSound } from '../utils/audio';
import { Play, Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import { auth, db } from '../utils/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, signOut, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const LandingPage = () => {
  const { setView, loginUser, isAuthenticated } = useStore();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [unverifiedUser, setUnverifiedUser] = useState<any>(null);
  const [chooseUsernameMode, setChooseUsernameMode] = useState(false);
  const [pendingUser, setPendingUser] = useState<any>(null);
  const AVATAR_OPTIONS = ['🦁', '🦄', '🐼', '🐨', '🦊', '🐯', '🐶', '🐱', '🐸', '🦉'];
  const [selectedAvatar, setSelectedAvatar] = useState('🦁');

  const handleResendVerification = async () => {
    if (unverifiedUser) {
      setLoading(true);
      try {
        await sendEmailVerification(unverifiedUser);
        setError('Verification email resent! Please check your inbox.');
      } catch (err: any) {
        setError(err.message || 'Failed to resend verification.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    if (isRegistering && !username.trim()) return;
    
    setLoading(true);
    setError('');

    try {
      if (isRegistering) {
        // 1. Check if username exists
        const usernameRef = doc(db, 'usernames', username.toLowerCase());
        const usernameSnap = await getDoc(usernameRef);
        if (usernameSnap.exists()) {
          setError('Username already taken.');
          setLoading(false);
          return;
        }

        // 2. Create User
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // 3. Attach username to auth profile for later retrieval
        await updateProfile(userCredential.user, { displayName: username, photoURL: selectedAvatar });

        // 4. Email Verification
        await sendEmailVerification(userCredential.user);
        await signOut(auth);

        playSound.levelUp(0.5);
        setVerificationSent(true);
      } else {
        // Login Flow
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        if (!userCredential.user.emailVerified) {
          setUnverifiedUser(userCredential.user);
          await signOut(auth);
          setError('Please verify your email address before continuing. (Check your spam folder!)');
          return;
        }

        const uid = userCredential.user.uid;
        const userSnap = await getDoc(doc(db, 'users', uid));
        
        if (userSnap.exists()) {
          playSound.levelUp(0.5);
          loginUser(userSnap.data() as any);
          setView('slot');
        } else {
          // First login after verification - Create Firestore profile
          const desiredUsername = userCredential.user.displayName || `user${Math.floor(Math.random() * 10000)}`;
          const usernameRef = doc(db, 'usernames', desiredUsername.toLowerCase());
          const usernameSnap = await getDoc(usernameRef);
          
          if (usernameSnap.exists()) {
            // Username was taken while they were verifying!
            setPendingUser(userCredential.user);
            setChooseUsernameMode(true);
            setUsername(''); // clear it so they can type a new one
          } else {
            // Username is still available, create profile
            const userAvatar = userCredential.user.photoURL || '🦁';
            await createFirestoreProfile(uid, desiredUsername, userCredential.user.email || '', userAvatar);
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const createFirestoreProfile = async (uid: string, finalUsername: string, finalEmail: string, finalAvatar: string) => {
    const userProfile = {
      uid,
      name: finalUsername,
      email: finalEmail,
      avatar: finalAvatar,
      xp: 150,
      level: 1,
      streak: 0,
      lastSpinDate: null,
      lastWatchDate: null,
      lastVisitDate: null,
      favoriteGenres: []
    };
    const initialState = {
      user: userProfile,
      watchedHistory: [],
      excludedIds: [],
      friends: [],
      spinStats: { totalSpins: 0, spinsThisSession: 0 }
    };
    try {
      await setDoc(doc(db, 'users', uid), initialState);
      await setDoc(doc(db, 'usernames', finalUsername.toLowerCase()), { uid });
      
      playSound.levelUp(0.5);
      loginUser(initialState as any);
      setView('slot');
    } catch (err: any) {
      // If Firestore write fails, sign out so the user isn't authenticated with no profile
      try { await signOut(auth); } catch (_) {}
      throw err; // re-throw so the outer catch shows the error
    }
  };

  const handleChooseNewUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !pendingUser) return;
    setLoading(true);
    setError('');

    try {
      const usernameRef = doc(db, 'usernames', username.toLowerCase());
      const usernameSnap = await getDoc(usernameRef);
      if (usernameSnap.exists()) {
        setError('Username already taken. Please choose another.');
        setLoading(false);
        return;
      }
      
      await updateProfile(pendingUser, { displayName: username });
      const userAvatar = pendingUser.photoURL || '🦁';
      await createFirestoreProfile(pendingUser.uid, username, pendingUser.email || '', userAvatar);
      setChooseUsernameMode(false);
      setPendingUser(null);
    } catch (err: any) {
      setError(err.message || 'Failed to create profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    playSound.tick(0.4);
    setView('slot');
  };

  return (
    <div className="landing-page animate-fade-in" style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', top: '20%', left: '20%', width: '50vw', height: '50vw',
        background: 'radial-gradient(circle, rgba(124, 58, 237, 0.12) 0%, transparent 60%)', filter: 'blur(80px)', zIndex: 0
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '15%', width: '40vw', height: '40vw',
        background: 'radial-gradient(circle, rgba(34, 211, 238, 0.08) 0%, transparent 60%)', filter: 'blur(80px)', zIndex: 0
      }} />

      <div className="container animate-scale-up" style={{ position: 'relative', zIndex: 10, maxWidth: '640px', textAlign: 'center' }}>
        
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '30px',
          fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '32px'
        }}>
          <Sparkles size={14} className="animate-spin-slow" style={{ color: 'var(--accent-secondary)' }}/>
          Premium Entertainment Discovery
        </div>
        
        <h1 style={{
          fontSize: 'clamp(3.5rem, 8vw, 5.5rem)', lineHeight: '1', marginBottom: '24px', fontWeight: '800',
          letterSpacing: '-0.04em', background: 'linear-gradient(135deg, #FFFFFF 20%, #A1A1AA 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          Spin the Stream.
        </h1>
        
        <p style={{
          color: 'var(--text-secondary)', fontSize: '1.25rem', lineHeight: '1.5', marginBottom: '48px', padding: '0 20px'
        }}>
          Solve decision fatigue. Turn movie night into an immersive interactive experience.
        </p>

        {!isAuthenticated ? (
          <div className="glass glass-padding" style={{ borderRadius: 'var(--radius-xl)' }}>
            {verificationSent ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', marginBottom: '10px'
                }}>
                  <Sparkles size={32} />
                </div>
                <h3 style={{ fontSize: '1.6rem', color: '#ffffff', margin: 0 }}>Check your email!</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                  We've sent a verification link to <strong>{email}</strong>. 
                  <br/>Please verify your account before signing in.
                </p>
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '12px 16px', borderRadius: '8px', color: '#EF4444', fontSize: '0.95rem', display: 'flex', alignItems: 'flex-start', gap: '10px', textAlign: 'left', marginTop: '4px' }}>
                  <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span><strong>Important:</strong> If you don't see the email within a minute, please check your <strong>spam or junk folder</strong>!</span>
                </div>
                <button 
                  className="btn btn-primary" 
                  style={{ padding: '16px 32px', fontSize: '1.1rem', borderRadius: 'var(--radius-md)', marginTop: '16px' }}
                  onClick={() => {
                    setVerificationSent(false);
                    setIsRegistering(false);
                    setPassword('');
                    setError('');
                  }}
                >
                  Back to Sign In
                </button>
              </div>
            ) : chooseUsernameMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.6rem', color: '#ffffff', margin: 0 }}>Username Taken</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
                  The username you requested is no longer available. Please choose a new unique username to finish setting up your account.
                </p>
                <form onSubmit={handleChooseNewUsername} style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', marginTop: '10px' }}>
                  {error && <div style={{ color: 'var(--status-error)', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px' }}>{error}</div>}
                  <input
                    type="text"
                    placeholder="New Unique Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    style={inputStyle}
                  />
                  <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '16px', fontSize: '1.1rem', borderRadius: 'var(--radius-md)', opacity: loading ? 0.7 : 1 }}>
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <Play size={20} fill="currentColor" />}
                    Complete Profile
                  </button>
                </form>
              </div>
            ) : (
              <>
              <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {error && (
                  <div style={{ 
                    color: error.includes('resent') ? 'var(--status-success)' : 'var(--status-error)', 
                    background: error.includes('resent') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                    padding: '12px', borderRadius: '8px',
                    display: 'flex', flexDirection: 'column', gap: '10px'
                  }}>
                    <span>{error}</span>
                    {unverifiedUser && !error.includes('resent') && (
                      <button 
                        type="button"
                        onClick={handleResendVerification}
                        style={{ 
                          background: 'none', border: 'none', padding: 0,
                          color: '#ffffff', textDecoration: 'underline', 
                          fontSize: '0.9rem', cursor: 'pointer', textAlign: 'left' 
                        }}
                      >
                        Resend verification email
                      </button>
                    )}
                  </div>
                )}
                
                {isRegistering && (
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>Choose your Avatar</div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {AVATAR_OPTIONS.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setSelectedAvatar(emoji)}
                          style={{
                            background: selectedAvatar === emoji ? 'rgba(124, 58, 237, 0.3)' : 'rgba(255,255,255,0.05)',
                            border: selectedAvatar === emoji ? '2px solid var(--accent-primary)' : '2px solid transparent',
                            borderRadius: '50%',
                            width: '44px',
                            height: '44px',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {isRegistering && (
                <input
                  type="text"
                  placeholder="Unique Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required={isRegistering}
                  style={inputStyle}
                />
              )}
              
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
              
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyle}
              />

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '16px', fontSize: '1.1rem', borderRadius: 'var(--radius-md)', opacity: loading ? 0.7 : 1 }}>
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Play size={20} fill="currentColor" />}
                {isRegistering ? 'Create Account' : 'Sign In'}
              </button>
            </form>
            
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={() => { setIsRegistering(!isRegistering); setError(''); setEmail(''); setPassword(''); setUsername(''); }} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.95rem', cursor: 'pointer', textDecoration: 'underline' }}>
                {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Register'}
              </button>
              
              <button onClick={handleGuest} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.9rem', cursor: 'pointer', textDecoration: 'underline', transition: 'color 0.2s ease' }}>
                Or continue as Guest
              </button>
            </div>
              </>
            )}
          </div>
        ) : (
          <button className="btn btn-primary glow-pulse" style={{ padding: '20px 48px', fontSize: '1.2rem', borderRadius: 'var(--radius-xl)' }} onClick={handleGuest}>
            <Play size={24} fill="currentColor" />
            Resume Session
          </button>
        )}
      </div>
    </div>
  );
};

const inputStyle = {
  width: '100%',
  padding: '16px 20px',
  borderRadius: 'var(--radius-md)',
  background: 'rgba(0,0,0,0.4)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: '#ffffff',
  fontSize: '1.05rem',
  textAlign: 'center' as const,
  outline: 'none',
  transition: 'all 0.2s ease'
};
