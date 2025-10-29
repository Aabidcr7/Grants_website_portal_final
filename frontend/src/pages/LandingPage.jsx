import React, { useEffect, useRef, useState } from "react";
import { useScroll, useMotionValue, useSpring } from "framer-motion";
import { motion } from "framer-motion";

// Import section components
import Navigation from "../components/landingpage/Navigation";
import HeroSection from "../components/landingpage/HeroSection";
import StatsSection from "../components/landingpage/StatsSection";
import HowItWorksSection from "../components/landingpage/HowItWorksSection";
import FeaturesSection from "../components/landingpage/FeaturesSection";
import PricingSection from "../components/landingpage/PricingSection";
import TestimonialsSection from "../components/landingpage/TestimonialsSection";
import ExpertCTASection from "../components/landingpage/ExpertCTASection";
import FAQSection from "../components/landingpage/FAQSection";
import Footer from "../components/landingpage/Footer";

const LandingPage = () => {
  const { scrollYProgress } = useScroll();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);

  // Mouse tracking for parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) / 20;
        const y = (e.clientY - rect.top - rect.height / 2) / 20;
        mouseX.set(x);
        mouseY.set(y);
      }
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#5d248f] to-[#f46d19] origin-left z-50"
        style={{ scaleX: scrollYProgress }}
      />

      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <HeroSection
        heroRef={heroRef}
        mousePosition={mousePosition}
        smoothMouseX={smoothMouseX}
        smoothMouseY={smoothMouseY}
      />

      {/* Stats Section */}
      <StatsSection />

      {/* How It Works */}
      <HowItWorksSection />

      {/* Features */}
      <FeaturesSection />

      {/* Pricing */}
      <PricingSection />

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Expert Consultation CTA */}
      <ExpertCTASection />

      {/* FAQ */}
      <FAQSection />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
