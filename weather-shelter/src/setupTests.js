// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Global mocks to make tests resilient to ESM-only packages and browser APIs
jest.mock('axios', () => ({ get: jest.fn(), post: jest.fn() }));
jest.mock('wouter', () => ({
	useLocation: () => ['/', jest.fn()],
	Link: ({ children }) => children,
	Route: ({ children }) => children || null,
	Switch: ({ children }) => children || null,
}));
// Simplify ThemeToggle so tests do not need ThemeProvider
jest.mock('./components/themeToggle', () => ({ ThemeToggle: () => null }));
jest.mock('./components/libs/audioFeedback', () => ({ audioFeedback: { playChime: jest.fn(), speak: jest.fn() } }));
jest.mock('./components/libs/ttsService', () => ({ ttsService: { speak: jest.fn(), cancel: jest.fn() } }));
// Mock lucide-react icons to simple span elements so tests don't import ESM
jest.mock('lucide-react', () => {
	const React = require('react');
	const MockIcon = ({ className, 'aria-hidden': ariaHidden }) => React.createElement('span', { 'data-testid': 'icon', className });
	return new Proxy({}, {
		get: () => MockIcon,
	});
});
