import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hasWebGL } from '../../lib/webgl';
import { FreeKickSection } from './FreeKickSection';
import { hudMessage } from './FreeKickHud';
import { initialGameState } from './gameReducer';

// The real game needs WebGL; jsdom has none, so stand in for it.
vi.mock('./FreeKickGame', () => ({ default: () => <div>3D game</div> }));
vi.mock('../../lib/webgl', () => ({ hasWebGL: vi.fn(() => true) }));

function setReducedMotion(reduce: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduce && query.includes('reduce'),
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

beforeEach(() => setReducedMotion(false));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.mocked(hasWebGL).mockReturnValue(true);
});

describe('FreeKickSection', () => {
  it('starts with an intro and loads the game on Play', async () => {
    render(<FreeKickSection />);
    expect(screen.getByText(/hoops hang in the goal/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(await screen.findByText('3D game')).toBeInTheDocument();
  });

  it('can skip straight to the results', async () => {
    render(<FreeKickSection />);
    await userEvent.click(screen.getByRole('button', { name: 'Just show me the results' }));
    expect(screen.getByText('3 min → 30 s')).toBeInTheDocument();
    expect(screen.queryByText(/Shoot through this hoop/)).not.toBeInTheDocument();
  });

  it('shows results instead of the game when the device asks for reduced motion', () => {
    setReducedMotion(true);
    render(<FreeKickSection />);
    expect(screen.getByText(/set to reduce motion/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play anyway' })).toBeInTheDocument();
  });

  it('falls back to results when the browser has no WebGL', async () => {
    vi.mocked(hasWebGL).mockReturnValue(false);
    render(<FreeKickSection />);
    await userEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(screen.getByRole('status')).toHaveTextContent('can’t show 3D');
    expect(screen.queryByRole('button', { name: /Play/ })).not.toBeInTheDocument();
  });
});

describe('hudMessage', () => {
  const targets = [{ id: 'users', value: '8,000+', label: 'App users', detail: '' }];

  it('explains how to play, then reports each shot', () => {
    expect(hudMessage(initialGameState, targets)).toBe('Click or tap the goal to shoot');
    expect(hudMessage({ ...initialGameState, shots: 1, last: { outcome: 'saved' } }, targets)).toBe('Saved by the keeper.');
    expect(hudMessage({ ...initialGameState, shots: 2, found: [], last: { outcome: 'target', targetId: 'users' } }, targets)).toBe(
      'Top bins! You found one. App users: 8,000+',
    );
  });

  it('celebrates when every target is found', () => {
    expect(hudMessage({ ...initialGameState, shots: 4, found: ['users'], last: { outcome: 'target', targetId: 'users' } }, targets)).toBe(
      'All 1 found in 4 shots!',
    );
  });
});
