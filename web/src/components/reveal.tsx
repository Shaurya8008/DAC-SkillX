"use client";

import { motion, type Variants } from "framer-motion";

const variants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={variants}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

// Plain layout wrapper — no motion here. RevealItem below used to rely on
// inheriting animate state from a `whileInView` parent, which broke for any
// list loaded asynchronously (e.g. from a query): the parent's `once: true`
// viewport trigger fires once, against zero children, before the data
// arrives, and items mounted afterward never get their variant transition
// applied. Each RevealItem now observes its own viewport entry instead.
export function RevealGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function RevealItem({
  children,
  className,
  index = 0,
  stagger = 0.08,
}: {
  children: React.ReactNode;
  className?: string;
  index?: number;
  stagger?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={variants}
      transition={{ duration: 0.5, delay: index * stagger, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
