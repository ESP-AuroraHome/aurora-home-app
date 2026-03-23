"use client";

import { motion } from "framer-motion";

export default function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: "100%" }}
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
