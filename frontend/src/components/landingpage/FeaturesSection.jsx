import React from "react";
import { motion } from "framer-motion";
import { Brain, Target, Shield, BarChart3, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import AnimatedSection from "./AnimatedSection";

const FeaturesSection = () => {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Matching",
      description:
        "Our GPT-4 powered engine analyzes your profile and matches you with the most relevant grants.",
      color: "#5d248f",
    },
    {
      icon: Target,
      title: "Soft Approval Tags",
      description:
        "Get pre-screened grants with soft approval indicators to save time and increase success rates.",
      color: "#f46d19",
    },
    {
      icon: Shield,
      title: "Expert Consultation",
      description:
        "Access to grant experts who guide you through the entire application process.",
      color: "#ef3e25",
    },
    {
      icon: BarChart3,
      title: "Track Success",
      description:
        "Monitor your applications, deadlines, and success metrics in one dashboard.",
      color: "#5d248f",
    },
  ];

  return (
    <section
      className="section px-4 sm:px-6 relative bg-gradient-to-b from-white to-gray-50"
      data-testid="features-section"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange-100 mb-4"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05 }}
          >
            <Zap className="w-4 h-4 text-[#f46d19]" />
            <span className="text-sm font-medium text-[#f46d19]">
              Powerful Features
            </span>
          </motion.div>
          <motion.h2
            className="text-4xl sm:text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Why Choose MyProBuddy?
          </motion.h2>
          <motion.p
            className="text-lg text-gray-600"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Powerful features to accelerate your funding journey
          </motion.p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((feature, idx) => (
            <AnimatedSection key={idx} variant="features" custom={idx}>
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card
                  className="relative overflow-hidden border-2 hover:border-purple-200 transition-all duration-300 h-full group"
                  data-testid={`feature-card-${idx}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-orange-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="relative">
                    <motion.div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      style={{
                        background: `linear-gradient(135deg, ${feature.color}15 0%, ${feature.color}05 100%)`,
                      }}
                      whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <feature.icon
                        className="w-8 h-8"
                        style={{ color: feature.color }}
                      />
                    </motion.div>
                    <CardTitle className="text-xl text-center">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <p className="text-gray-600 text-center">
                      {feature.description}
                    </p>
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

export default FeaturesSection;
