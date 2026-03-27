"use client";

import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

let hasNavigated = false;

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const controls = useAnimation();

  useEffect(() => {
    if (hasNavigated) {
      controls.set({ opacity: 0, x: "100%" });
      controls.start({ opacity: 1, x: 0 });
    }
    hasNavigated = true;
  }, [controls]);

  return (
    <motion.div
      initial={false}
      animate={controls}
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
