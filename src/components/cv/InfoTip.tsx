import { useEffect, useId, useRef, useState } from 'react';

const EDGE = 8; // px kept clear of the screen edge

/**
 * A small ⓘ button with a note. Shows on hover or keyboard focus, and toggles on tap (phones);
 * Escape or tapping elsewhere closes it. Screen readers get the note as the button's description.
 */
export function InfoTip({ label, text }: { label: string; text: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const root = useRef<HTMLSpanElement>(null);
  const bubble = useRef<HTMLSpanElement>(null);

  // Centre the bubble on the icon, then nudge it back inside the screen if it would spill over.
  const place = () => {
    const el = bubble.current;
    const anchor = root.current;
    if (!el || !anchor) return;
    // Start centred (CSS default), measure, then set a real `left` (not a transform) that keeps it
    // on screen: browsers count a transformed box's original spot as page width, a moved box's not.
    el.style.left = '';
    el.style.transform = '';
    const rect = el.getBoundingClientRect();
    const maxLeft = document.documentElement.clientWidth - EDGE - rect.width;
    const left = Math.max(EDGE, Math.min(rect.left, maxLeft));
    el.style.transform = 'none';
    el.style.left = `${Math.round(left - anchor.getBoundingClientRect().left)}px`;
  };

  // Hover/focus show the bubble via CSS; measure it once it has been drawn.
  const placeSoon = () => requestAnimationFrame(place);

  useEffect(() => {
    if (!open) return;
    place();
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent ? event.key === 'Escape' : !root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', close);
    document.addEventListener('pointerdown', close);
    return () => {
      document.removeEventListener('keydown', close);
      document.removeEventListener('pointerdown', close);
    };
  }, [open]);

  return (
    <span ref={root} className={`info-tip${open ? ' info-tip--open' : ''}`} onPointerEnter={placeSoon} onFocus={placeSoon}>
      <button type="button" className="info-tip__button" aria-label={label} aria-describedby={id} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        i
      </button>
      <span ref={bubble} id={id} role="tooltip" className="info-tip__bubble">
        {text}
      </span>
    </span>
  );
}
