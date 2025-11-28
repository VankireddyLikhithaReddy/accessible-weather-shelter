import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import NotFound from '../components/notFound';
import Feedback from '../components/feedback';
import LogoutButton from '../components/LogoutButton';
import { TTSControls } from '../components/TTSControls';
import { ForecastCard } from '../components/ForecastCard';

describe('Simple UI tests', () => {
  test('NotFound shows 404 heading', () => {
    render(<NotFound />);
    expect(screen.getByText(/404 Page Not Found/i)).toBeInTheDocument();
  });

  test('LogoutButton clears localStorage and triggers audio feedback', async () => {
    // spy on localStorage.clear
    const clearSpy = jest.spyOn(Storage.prototype, 'clear');
    const { audioFeedback } = require('../components/libs/audioFeedback');
    render(<LogoutButton />);
    const btn = screen.getByRole('button', { name: /Logout/i });
    await userEvent.click(btn);
    expect(clearSpy).toHaveBeenCalled();
    expect(audioFeedback.playChime).toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  test('TTSControls calls onSpeak when speak button clicked', async () => {
    const onSpeak = jest.fn();
    render(<TTSControls onSpeak={onSpeak} isSpeaking={false} onToggleMute={() => {}} isMuted={false} />);
    const btn = screen.getByTestId('button-speak-weather');
    await userEvent.click(btn);
    expect(onSpeak).toHaveBeenCalled();
  });

  test('ForecastCard displays forecast data', () => {
    const fc = { day: 1, date: '2025-11-23', condition: 'Sunny', high: 70, low: 50 };
    render(<ForecastCard forecast={fc} />);
    expect(screen.getByText('2025-11-23')).toBeInTheDocument();
    expect(screen.getByTestId('text-high-1')).toHaveTextContent('70°');
    expect(screen.getByTestId('text-low-1')).toHaveTextContent('50°');
  });

  test('Feedback form does not submit when empty', async () => {
    render(<Feedback />);
    const submit = screen.getByRole('button', { name: /Submit Feedback/i });
    await userEvent.click(submit);
    // Should not show success alert
    const alert = screen.queryByRole('alert');
    expect(alert).toBeNull();
  });

  test('voice-logout event triggers logout actions', async () => {
    const clearSpy = jest.spyOn(Storage.prototype, 'clear');
    const { audioFeedback } = require('../components/libs/audioFeedback');

    render(<LogoutButton />);

    // Dispatch voice logout event inside act to wrap state updates
    act(() => {
      window.dispatchEvent(new CustomEvent('voice-logout'));
    });

    // Wait for any state updates caused by the handler
    await waitFor(() => {
      expect(clearSpy).toHaveBeenCalled();
      expect(audioFeedback.playChime).toHaveBeenCalled();
    });

    clearSpy.mockRestore();
  });
});
