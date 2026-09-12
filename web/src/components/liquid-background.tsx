"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

// A cursor-reactive "liquid" background: a few blurred, colored blobs that
// trail the pointer at different spring rates (so they lag and merge like
// liquid) plus one ambient blob that drifts on its own. The gooey merge look
// comes from a classic SVG filter (blur -> soft alpha boost), not from any
// physics simulation — cheap enough to run on every frame with pure CSS/SVG.
//
// Cursor tracking listens on `window`, not this element: this layer sits
// behind the hero's text/buttons (lower z-index), and those foreground
// elements would otherwise capture the mousemove and starve this div of
// events except in the empty margins around them.
export function LiquidBackground({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const fastX = useSpring(x, { stiffness: 120, damping: 20 });
  const fastY = useSpring(y, { stiffness: 120, damping: 20 });
  const slowX = useSpring(x, { stiffness: 40, damping: 25 });
  const slowY = useSpring(y, { stiffness: 40, damping: 25 });

  // Motion values hold a 0-1 fraction; CSS left/top need a percentage, not a
  // raw number (which Framer Motion would otherwise emit as "0.5px").
  const fastXPct = useTransform(fastX, (n) => `${n * 100}%`);
  const fastYPct = useTransform(fastY, (n) => `${n * 100}%`);
  const slowXPct = useTransform(slowX, (n) => `${n * 100}%`);
  const slowYPct = useTransform(slowY, (n) => `${n * 100}%`);

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      x.set((e.clientX - rect.left) / rect.width);
      y.set((e.clientY - rect.top) / rect.height);
    }
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [x, y]);

  return (
    <div ref={ref} className={className} style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <svg className="absolute h-0 w-0">
        <defs>
          <filter id="liquid-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="24" result="blur" />
            <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 8 -3" />
          </filter>
        </defs>
      </svg>

      <div className="absolute inset-0 opacity-60 dark:opacity-40" style={{ filter: "url(#liquid-goo)" }}>
        <motion.div
          className="absolute size-72 rounded-full bg-blue-400/70 dark:bg-blue-500/60"
          style={{ left: fastXPct, top: fastYPct, translateX: "-50%", translateY: "-50%" }}
        />
        <motion.div
          className="absolute size-56 rounded-full bg-violet-400/70 dark:bg-violet-500/60"
          style={{ left: slowXPct, top: slowYPct, translateX: "-50%", translateY: "-50%" }}
        />
        <div className="absolute top-1/4 left-1/4 size-64 animate-[drift_14s_ease-in-out_infinite] rounded-full bg-pink-300/60 dark:bg-pink-500/50" />
      </div>

      <style>{`
        @keyframes drift {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(60px, 40px); }
        }
      `}</style>
    </div>
  );
}
