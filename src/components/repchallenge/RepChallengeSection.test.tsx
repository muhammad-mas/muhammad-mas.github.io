import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { hasWebGL } from '../../lib/webgl';
import { RepChallengeSection } from './RepChallengeSection';

// The real game needs WebGL and animation frames; record which mode it was opened in.
vi.mock('./RepChallengeGame', () => ({ default: ({ show3d }: { show3d: boolean }) => <div>game {show3d ? '3d' : 'flat'}</div> }));
vi.mock('../../lib/webgl', () => ({ hasWebGL: vi.fn(() => true) }));

function setReducedMotion(reduce: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduce && query.includes('reduce'),
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.mocked(hasWebGL).mockReturnValue(true);
  localStorage.clear();
});

describe('RepChallengeSection', () => {
  it('opens the 3D game on Play and shows the saved best', async () => {
    setReducedMotion(false);
    localStorage.setItem('rep-challenge-best', '14');
    render(<RepChallengeSection />);
    expect(screen.getByText('Your best: 14 reps')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(await screen.findByText('game 3d')).toBeInTheDocument();
  });

  it('plays without the 3D lifter when motion is reduced', async () => {
    setReducedMotion(true);
    render(<RepChallengeSection />);
    expect(screen.getByText(/reduce motion/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(await screen.findByText('game flat')).toBeInTheDocument();
  });

  it('plays without 3D when the browser has no WebGL', async () => {
    setReducedMotion(false);
    vi.mocked(hasWebGL).mockReturnValue(false);
    render(<RepChallengeSection />);
    await userEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(await screen.findByText('game flat')).toBeInTheDocument();
  });
});
