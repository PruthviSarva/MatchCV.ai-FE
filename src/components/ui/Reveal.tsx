"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Fades a block up as it scrolls into view.
 *
 * <p>`once` so a section does not re-animate every time it passes the viewport,
 * which reads as a glitch rather than as polish. The margin fires the animation
 * slightly before the element is fully visible, so it is already settled by the
 * time it is being read.
 *
 * <p>The reduced-motion rule in globals.css collapses the duration to nothing,
 * so this is inert for anyone who has asked their system to stop moving things.
 */
export function Reveal({
  children,
  delay = 0,
  y = 16,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.55, delay, ease: [0.2, 0.7, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * The same thing for a list, staggering each child.
 *
 * <p>Takes the children as an array so the stagger index is the real position
 * rather than whatever order they happen to mount in.
 */
export function RevealGroup({
  children,
  className,
  step = 0.07,
}: {
  children: ReactNode[];
  className?: string;
  step?: number;
}) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <Reveal key={index} delay={index * step}>
          {child}
        </Reveal>
      ))}
    </div>
  );
}
