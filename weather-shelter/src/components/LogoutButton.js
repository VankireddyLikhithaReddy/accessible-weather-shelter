import React from 'react';
import { useLocation } from 'wouter';
import { useToast } from './hooks/useToast';
import { audioFeedback } from './libs/audioFeedback';

export default function LogoutButton() {
  const [, setLocation] = useLocation();
  const { addToast } = useToast();

  const handleLogout = () => {
    try { localStorage.clear(); } catch (e) {}
    addToast({ title: 'Logged out', body: 'You have been signed out' });
    try { audioFeedback.playChime(); audioFeedback.speak('You have been signed out'); } catch (e) {}
    setLocation('/login');
  };

  // Also listen for voice-triggered logout events
  React.useEffect(() => {
    const onVoiceLogout = () => {
      handleLogout();
    };
    window.addEventListener('voice-logout', onVoiceLogout);
    return () => window.removeEventListener('voice-logout', onVoiceLogout);
  }, []);

  return (
    <button type="button" className="btn btn-outline-danger ms-2" onClick={handleLogout} aria-label="Logout">
      Logout
    </button>
  );
}