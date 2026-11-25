import { useEffect, useState, type RefObject } from 'react';

/** Report visibility loss immediately, including when animation frames stop in a hidden tab. */
export function useGameVisibility(ref: RefObject<HTMLElement | null>, enabled: boolean, onLeave: () => void) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!enabled || !element) return;
    const check = () => {
      const rect = element.getBoundingClientRect();
      const headerBottom = document.querySelector('header')?.getBoundingClientRect().bottom ?? 0;
      const inView = !document.hidden && rect.bottom > headerBottom && rect.top < window.innerHeight;
      setVisible(inView);
      if (!inView) onLeave();
    };
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    document.addEventListener('visibilitychange', check);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(check);
    observer?.observe(element);
    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
      document.removeEventListener('visibilitychange', check);
      observer?.disconnect();
    };
  }, [ref, enabled, onLeave]);
  return visible && enabled;
}
