import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from './hooks/useToast';
import { useTTS } from './hooks/useTTS';
import { audioFeedback } from './libs/audioFeedback';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupMode, setSignupMode] = useState(false);
  const [emergencyEmail, setEmergencyEmail] = useState('');
  const [, setLocation] = useLocation();
  const { addToast } = useToast();
  const { speak } = useTTS();

  // Prefill username from last successful login if present
  useEffect(() => {
    try {
      const last = localStorage.getItem('lastUsername');
      if (last) setUsername(last);
    } catch (e) {}
  }, []);

  // Announce voice-login/register instructions when the login page mounts
  const mountAnnouncedRef = React.useRef(false);
  useEffect(() => {
    if (mountAnnouncedRef.current) return;
    mountAnnouncedRef.current = true;
    const msg = "Welcome to Accessible Weather and Shelter Finder. To sign in using voice, say 'login' and you will be asked for your username and password. To create an account, say 'register'.";
    try {
      if (speak) speak(msg); else audioFeedback.speak(msg);
    } catch (e) {
      try { audioFeedback.speak(msg); } catch (err) {}
    }
  }, []);

  const signupModeRef = React.useRef(false);
  useEffect(() => {
    // skip the first render
    if (signupModeRef.current === signupMode) {
      // no change
      return;
    }
    signupModeRef.current = signupMode;
    const msg = signupMode ? "Register mode opened. Say 'register' to create an account." : "Login mode opened. Say 'login' to sign in.";
    try {
      speak && speak(msg);
    } catch (e) {
      try { audioFeedback.speak(msg); } catch (err) {}
    }
  }, [signupMode, speak]);

  // Simple local-only auth: store users in localStorage under 'localUsers'
  const readUsers = () => {
    try { return JSON.parse(localStorage.getItem('localUsers') || '[]'); } catch (e) { return []; }
  };
  const writeUsers = (u) => localStorage.setItem('localUsers', JSON.stringify(u || []));

  // Accept optional credentials object to allow direct invocation from voice flow
  const doRegister = (e, creds) => {
    e && e.preventDefault && e.preventDefault();
    setLoading(true);
    const regUsername = (creds && creds.username) || username;
    const regPassword = (creds && creds.password) || password;
    const regEmergency = (creds && creds.emergencyEmail) || emergencyEmail;
    (async () => {
      try {
        if (!regUsername || !regPassword) throw new Error('Username and password are required');
        // try backend signup first
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: regUsername, password: regPassword, emergencyEmail: regEmergency }),
        });
        if (res.ok) {
          const body = await res.json();
          // Notify user and switch back to login view
          addToast({ title: 'Signup successful', body: `User ${body.user.username} created. Please login.` });
          try { audioFeedback.playChime(); } catch (e) {}
          speak && speak('Signup successful. Please login.');
          setSignupMode(false);
          setPassword('');
          try { setLocation('/login'); } catch (e) {}
          return;
        }
        const body = await res.json().catch(() => ({}));
        // If backend responds with conflict or other error, show it
        if (res.status === 409) throw new Error(body.error || 'User already exists');
        if (!res.ok) throw new Error(body.error || `Signup failed (${res.status})`);
      } catch (err) {
        // fallback to local storage method if backend unreachable
        try {
          const users = readUsers();
          if (users.find((x) => x.username === regUsername)) throw new Error('User already exists (local)');
          users.push({ username: regUsername, password: regPassword, emergencyEmail: regEmergency });
          writeUsers(users);
          // Local fallback: notify and switch to login
          addToast({ title: 'Signup successful (local)', body: `User ${regUsername} created locally. Please login.` });
          try { audioFeedback.playChime(); } catch (e) {}
          speak && speak('Signup successful. Please login.');
          setSignupMode(false);
          setPassword('');
          try { setLocation('/login'); } catch (e) {}
        } catch (err2) {
          addToast({ title: 'Register failed', body: String(err.message || err2 || err) });
        }
      } finally {
        setLoading(false);
      }
    })();
  };

  // Accept optional creds object so voice flow can call directly without waiting for state updates
  const doLogin = (e, creds) => {
    e && e.preventDefault && e.preventDefault();
    setLoading(true);
    const loginUsername = (creds && creds.username) || username;
    const loginPassword = (creds && creds.password) || password;
    (async () => {
      try {
        console.log('doLogin sending', { username: loginUsername, password: loginPassword });
        // try backend login first
        const res = await fetch('https://accessible-weather-shelter.onrender.com/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: loginUsername, password: loginPassword }),
        });
        if (res.ok) {
          const body = await res.json();
          localStorage.setItem('currentUser', JSON.stringify({ username: body.user.username }));
          // Persist last successful username for convenience
          try { localStorage.setItem('lastUsername', body.user.username); } catch (e) {}
          setPassword('');
          addToast({ title: 'Logged in', body: `Welcome ${body.user.username}` });
          try { audioFeedback.playChime(); } catch (e) {}
          speak && speak(`Logged in. Welcome ${body.user.username}`);
          setLocation('/home');
          return;
        }
        const body = await res.json().catch(() => ({}));
        if (res.status === 401) throw new Error(body.error || 'Invalid credentials');
        if (!res.ok) throw new Error(body.error || `Login failed (${res.status})`);
      } catch (err) {
        // fallback to local storage verification
        try {
          const users = readUsers();
          const u = users.find((x) => x.username === loginUsername && x.password === loginPassword);
          if (!u) throw new Error('Invalid credentials');
          localStorage.setItem('currentUser', JSON.stringify({ username: loginUsername, emergencyEmail: u.emergencyEmail || '' }));
          try { localStorage.setItem('lastUsername', loginUsername); } catch (e) {}
          setPassword('');
          addToast({ title: 'Logged in (local)', body: `Welcome ${loginUsername}` });
          try { audioFeedback.playChime(); } catch (e) {}
          speak && speak(`Logged in. Welcome ${loginUsername}`);
          setLocation('/home');
        } catch (err2) {
          addToast({ title: 'Login failed', body: String(err.message || err2 || err) });
        }
      } finally {
        setLoading(false);
      }
    })();
  };

  // Listen for voice-submitted credentials from the global voice controller
  useEffect(() => {
    const onVoiceLogin = (e) => {
      const d = (e && e.detail) || {};
      console.log('Login received voice-submit-login event', d);
      const u = d.username || '';
      const p = d.password || '';
      if (u) setUsername(u);
      if (p) setPassword(p);
      setSignupMode(false);
      // Call doLogin with explicit credentials so we don't rely on async state updates
      setTimeout(() => {
        console.log('Invoking doLogin from voice event with', { username: u, password: p });
        try { doLogin(null, { username: u, password: p }); } catch (err) { /* ignore */ }
      }, 150);
    };

    const onVoiceRegister = (e) => {
      const d = (e && e.detail) || {};
      console.log('Login received voice-submit-register event', d);
      const u = d.username || '';
      const p = d.password || '';
      if (u) setUsername(u);
      if (p) setPassword(p);
      setSignupMode(true);
      setTimeout(() => {
        console.log('Invoking doRegister from voice event with', { username: u, password: p });
        try { doRegister(null, { username: u, password: p, emergencyEmail: '' }); } catch (err) { /* ignore */ }
      }, 150);
    };

    window.addEventListener('voice-submit-login', onVoiceLogin);
    window.addEventListener('voice-submit-register', onVoiceRegister);
    return () => {
      window.removeEventListener('voice-submit-login', onVoiceLogin);
      window.removeEventListener('voice-submit-register', onVoiceRegister);
    };
  }, []);

  return (
    <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <div className="text-center mb-2">
        <h1 className="fw-bold display-5">Accessible Weather & Shelter</h1>
      </div>

      <div className="card p-4" style={{ maxWidth: 420, width: '100%' }}>
        <h2 className="mb-4">{signupMode ? 'Sign Up' : 'Login'}</h2>
        <p className="text-muted">Voice: say "login" to start voice login (you will be asked for username and password). Say "register" to create an account.</p>
        <form onSubmit={signupMode ? doRegister : doLogin}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          {signupMode && (
            <div className="mb-3">
              {/* <label className="form-label">Emergency contact email (optional)</label> */}
              {/* <input className="form-control" placeholder="Email" value={emergencyEmail} onChange={(e) => setEmergencyEmail(e.target.value)} /> */}
            </div>
          )}

          <div className="d-flex gap-2">
            <button className="btn btn-primary" type="submit" disabled={loading}>{signupMode ? 'Create account' : 'Login'}</button>
            <button className="btn btn-outline-secondary" type="button" onClick={() => setSignupMode((s) => !s)} disabled={loading}>{signupMode ? 'Switch to Login' : 'Register'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
