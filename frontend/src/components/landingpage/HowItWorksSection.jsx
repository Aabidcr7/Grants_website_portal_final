import React from "react";
import { motion } from "framer-motion";
import { Users, Search, Trophy, Rocket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import AnimatedSection from "./AnimatedSection";

const HowItWorksSection = () => {
  const steps = [
    {
      icon: Users,
      title: "1. Register & Profile",
      desc: "Create your account and complete the grant screening form with your startup details.",
      color: "#5d248f",
    },
    {
      icon: Search,
      title: "2. AI Matching",
      desc: "Our AI analyzes your profile against thousands of grants to find perfect matches.",
      color: "#f46d19",
    },
    {
      icon: Trophy,
      title: "3. Apply & Win",
      desc: "Review your matches, get expert help, and apply to secure funding for your startup.",
      color: "#ef3e25",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="section px-4 sm:px-6"
      data-testid="how-it-works-section"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 border border-purple-100 mb-4"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05 }}
          >
            <Rocket className="w-4 h-4 text-[#5d248f]" />
            <span className="text-sm font-medium text-[#5d248f]">
              Simple Process
            </span>
          </motion.div>
          <motion.h2
            className="text-4xl sm:text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            How It Works
          </motion.h2>
          <motion.p
            className="text-lg text-gray-600"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Get matched with grants in 3 simple steps
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 sm:gap-8 relative">
          {/* Connection Lines */}
          <div
            className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#5d248f] via-[#f46d19] to-[#ef3e25] opacity-20"
            style={{ transform: "translateY(-50%)" }}
          />

          {steps.map((step, idx) => (
            <AnimatedSection key={idx} variant="howItWorks" custom={idx}>
              <motion.div
                whileHover={{ y: -10 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card
                  className="relative overflow-hidden border-2 hover:border-purple-200 transition-all duration-300 h-full"
                  data-testid={`step-${idx + 1}-card`}
                >
                  <div
                    className="absolute top-0 right-0 w-32 h-32 opacity-5"
                    style={{
                      background: `radial-gradient(circle, ${step.color} 0%, transparent 70%)`,
                    }}
                  />
                  <CardHeader>
                    <motion.div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 relative"
                      style={{
                        background: `linear-gradient(135deg, ${step.color}15 0%, ${step.color}05 100%)`,
                      }}
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <step.icon
                        className="w-8 h-8"
                        style={{ color: step.color }}
                      />
                      <motion.div
                        className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: step.color }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + idx * 0.2, type: "spring" }}
                      >
                        {idx + 1}
                      </motion.div>
                    </motion.div>
                    <CardTitle className="text-2xl text-center">
                      {step.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-center">{step.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
