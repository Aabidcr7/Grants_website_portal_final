import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, ArrowRight } from "lucide-react";
import { Button } from "../ui/button";
import AnimatedSection from "./AnimatedSection";

const ExpertCTASection = () => {
  const navigate = useNavigate();

  return (
    <AnimatedSection variant="cta">
      <section
        className="section relative overflow-hidden px-4 sm:px-6"
        data-testid="expert-cta-section"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#5d248f] to-[#4a1d73]" />
        <motion.div
          className="absolute inset-0 opacity-10"
          initial={{
            backgroundPosition: "0% 0%",
          }}
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{
            duration: 20,
            repeat: 0,
          }}
          style={{
            backgroundImage:
              "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />
        <div className="container mx-auto max-w-4xl text-center relative">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 360 }}
            transition={{ duration: 0.6 }}
          >
            <Calendar className="w-16 h-16 mx-auto mb-6 text-white" />
          </motion.div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-white">
            Need Expert Help?
          </h2>
          <p className="text-base sm:text-lg mb-6 sm:mb-8 text-white/90 leading-relaxed">
            Our grant experts have helped secure over ₹50 crores in funding.
            Book a consultation to maximize your success rate.
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="lg"
              onClick={() => navigate("/register")}
              className="bg-white text-[#5d248f] hover:bg-gray-100 text-sm sm:text-base lg:text-lg px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 group"
              data-testid="expert-consultation-btn"
            >
              Book Expert Consultation
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>
      </section>
    </AnimatedSection>
  );
};

export default ExpertCTASection;
