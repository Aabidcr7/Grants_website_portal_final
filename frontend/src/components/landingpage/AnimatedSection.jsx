import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

const sectionVariants = {
  stats: {
    hidden: { opacity: 0, x: -100 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
    }),
  },
  howItWorks: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (i) => ({
      opacity: 1,
      scale: 1,
      transition: { delay: i * 0.2, duration: 0.5, ease: "backOut" },
    }),
  },
  features: {
    hidden: { opacity: 0, y: 50, rotate: -5 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      rotate: 0,
      transition: {
        delay: Math.random() * 0.3,
        duration: 0.6,
        ease: "easeOut",
      },
    }),
  },
  pricing: {
    hidden: { opacity: 0, rotateY: 90 },
    visible: (i) => ({
      opacity: 1,
      rotateY: 0,
      transition: { delay: i * 0.15, duration: 0.7, ease: "easeOut" },
    }),
  },
  testimonials: {
    hidden: { opacity: 0, x: 100 },
    visible: (i) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.2, duration: 0.6, ease: "easeOut" },
    }),
  },
  cta: {
    hidden: { opacity: 0, scale: 0.5 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.8, ease: "backOut" },
    },
  },
  faq: {
    hidden: { opacity: 0, y: -30 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" },
    }),
  },
};

const AnimatedSection = ({ children, variant = "default", custom = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      custom={custom}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={
        sectionVariants[variant] || {
          hidden: { opacity: 0, y: 50 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
        }
      }
    >
      {children}
    </motion.div>
  );
};

export default AnimatedSection;
