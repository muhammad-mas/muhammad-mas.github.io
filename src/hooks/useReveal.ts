import { useEffect, useRef } from 'react';

/**
 * Fades an element up the first time it scrolls into view.
 * Does nothing (content stays visible) without IntersectionObserver
 * or when the visitor prefers reduced motion.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    // Already on screen at load (e.g. a #link jump): leave it alone.
    if (element.getBoundingClientRect().top < window.innerHeight * 0.9) return;

    element.classList.add('reveal');
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          element.classList.add('is-visible');
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return ref;
}
