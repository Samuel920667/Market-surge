import { useEffect, useRef } from 'react';

export default function GlassCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cursorRef.current;
    if (!el) return;
    const move = (e: MouseEvent) => {
      el.style.transform = `translate(${e.clientX - 30}px, ${e.clientY - 30}px)`;
    };
    window.addEventListener('mousemove', move, { passive: true });
    return () => window.removeEventListener('mousemove', move);
  }, []);

  return (
    <div ref={cursorRef} className="glass-cursor" aria-hidden="true">
      <span className="glass-cursor-label">you</span>
    </div>
  );
}
