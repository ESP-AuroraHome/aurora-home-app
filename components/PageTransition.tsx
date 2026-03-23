"use client";

import { motion } from "framer-motion";

// On the first page load (direct URL / SSR), we skip the slide-in animation
// to avoid a hydration mismatch (server renders at animate state, client would
// start at initial state). On subsequent client-side navigations we animate normally.
let hasNavigated = false;

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const shouldAnimate = hasNavigated;
  hasNavigated = true;

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, x: "100%" } : false}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "-20%" }}
      transition={{
        type: "spring",
        stiffness: 80,
        damping: 20,
        mass: 0.8,
        opacity: { duration: 0.25, ease: "easeOut" },
      }}
      style={{ height: "100%", overflow: "hidden" }}
    >
      {children}
    </motion.div>
  );
}
