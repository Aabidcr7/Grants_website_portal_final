import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import DashboardPreview from "./DashboardPreview";
import FloatingShape from "./FloatingShape";

const HeroSection = ({
  heroRef,
  mousePosition,
  smoothMouseX,
  smoothMouseY,
}) => {
  const navigate = useNavigate();

  return (
    <section
      ref={heroRef}
      className="relative pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 overflow-hidden min-h-screen flex items-center"
      data-testid="hero-section"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 -z-10">
        <FloatingShape delay={0} duration={25} size={300} />
        <FloatingShape delay={5} duration={30} size={200} />
        <FloatingShape delay={10} duration={20} size={250} />
      </div>

      {/* Animated Grid Pattern */}
      <div className="absolute inset-0 -z-10 opacity-[0.02]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(#5d248f 2px, transparent 2px), linear-gradient(90deg, #5d248f 2px, transparent 2px)",
            backgroundSize: "60px 60px",
            transform: "perspective(500px) rotateX(60deg)",
            transformOrigin: "center top",
          }}
        />
      </div>

      {/* Spotlight Effect */}
      <motion.div
        className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(93, 36, 143, 0.05), transparent 40%)`,
        }}
      />

      <div className="container mx-auto relative">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-purple-50 border border-purple-100 mb-4 sm:mb-6"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
            >
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-[#5d248f]" />
              <span className="text-xs sm:text-sm font-medium text-[#5d248f]">
                AI-Powered Grant Discovery
              </span>
            </motion.div>

            <motion.h1
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              Discover Perfect
              <br />
              <span className="gradient-text">Grant Matches</span>
              <br />
              in Seconds
            </motion.h1>

            <motion.p
              className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-10 leading-relaxed max-w-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Our AI analyzes your startup profile and matches you with the most
              relevant government grants. Get pre-screened opportunities with
              soft approval tags.
            </motion.p>

            <motion.div
              className="flex gap-3 sm:gap-4 flex-wrap"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  onClick={() => navigate("/register")}
                  className="bg-[#63268c] text-sm sm:text-base lg:text-lg px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 group"
                  data-testid="hero-cta-btn"
                >
                  Get Started
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() =>
                    document
                      .getElementById("how-it-works")
                      .scrollIntoView({ behavior: "smooth" })
                  }
                  className="text-sm sm:text-base lg:text-lg px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 border-2 group"
                  data-testid="learn-more-btn"
                >
               Learn More
                  <Sparkles className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform" />
                </Button>
              </motion.div>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              className="flex items-center gap-4 sm:gap-6 mt-6 sm:mt-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              <div className="flex -space-x-2">
                {[
                  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
                  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
                  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
                ].map((imgUrl, i) => (
                  <img
                    key={i}
                    src={imgUrl}
                    alt={`User ${i + 1}`}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white object-cover"
                  />
                ))}
              </div>
              <div>
                <div className="font-semibold text-sm sm:text-base text-gray-900">
                  500+ Startups
                </div>
                <div className="text-xs sm:text-sm text-gray-600">
                  Trust MyProBuddy
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Dashboard Preview */}
          <div className="relative w-full min-h-[500px] sm:min-h-[600px] lg:min-h-[700px] mt-8 lg:mt-0 flex items-center justify-center">
            <DashboardPreview
              smoothMouseX={smoothMouseX}
              smoothMouseY={smoothMouseY}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
