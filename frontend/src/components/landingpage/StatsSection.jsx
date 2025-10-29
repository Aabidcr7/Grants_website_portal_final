import React from "react";
import { motion } from "framer-motion";
import { Users, FileCheck, TrendingUp, Award } from "lucide-react";
import AnimatedSection from "./AnimatedSection";

const StatsSection = () => {
  const stats = [
    { value: "500+", label: "Active Startups", color: "#5d248f", icon: Users },
    {
      value: "200+",
      label: "Available Grants",
      color: "#f46d19",
      icon: FileCheck,
    },
    {
      value: "₹50Cr+",
      label: "Funding Secured",
      color: "#ef3e25",
      icon: TrendingUp,
    },
    { value: "87%", label: "Success Rate", color: "#5d248f", icon: Award },
  ];

  return (
    <section
      id="stats-section"
      className="section bg-gradient-to-b from-gray-50 to-white px-4 sm:px-6"
      data-testid="stats-section"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {stats.map((stat, idx) => (
            <AnimatedSection key={idx} variant="stats" custom={idx}>
              <motion.div
                className="relative group"
                whileHover={{ scale: 1.05 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-orange-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-6 text-center">
                  <stat.icon
                    className="w-8 h-8 mx-auto mb-3"
                    style={{ color: stat.color }}
                  />
                  <div
                    className="text-4xl font-bold mb-2"
                    style={{ color: stat.color }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
