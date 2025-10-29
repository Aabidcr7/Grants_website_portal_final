import React from "react";
import { motion } from "framer-motion";

const FloatingShape = ({ delay = 0, duration = 20, size = 64 }) => (
  <motion.div
    className="absolute rounded-full opacity-10"
    style={{
      width: size,
      height: size,
      background: "linear-gradient(135deg, #5d248f 0%, #f46d19 100%)",
      filter: "blur(40px)",
    }}
    initial={{
      x: 0,
      y: 0,
      scale: 1,
    }}
    animate={{
      x: [0, 100, 0],
      y: [0, -100, 0],
      scale: [1, 1.2, 1],
    }}
    transition={{
      duration,
      repeat: 0,
      delay,
      ease: "easeInOut",
    }}
  />
);

export default FloatingShape;
