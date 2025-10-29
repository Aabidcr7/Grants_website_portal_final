import React from "react";
import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import AnimatedSection from "./AnimatedSection";

const FAQSection = () => {
  const faqs = [
    {
      q: "How does AI matching work?",
      a: "Our GPT-4 powered engine analyzes your startup profile including industry, stage, revenue, and demographics to match you with the most relevant grants from our database of 200+ opportunities.",
    },
    {
      q: "What are soft approvals?",
      a: "Soft approvals indicate grants where our system has pre-screened your eligibility based on initial criteria. This increases your chances of success and saves application time.",
    },
    {
      q: "How do I upgrade my tier?",
      a: "Simply use the coupon codes GRANT199 for Premium tier or EXPERT30K for Expert tier in your dashboard. Your account will be upgraded instantly.",
    },
  ];

  return (
    <section
      className="section px-4 sm:px-6 bg-gray-50"
      data-testid="faq-section"
    >
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 mb-4"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05 }}
          >
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">FAQ</span>
          </motion.div>
          <motion.h2
            className="text-4xl sm:text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Frequently Asked Questions
          </motion.h2>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {faqs.map((faq, idx) => (
            <AnimatedSection key={idx} variant="faq" custom={idx}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="border-2 hover:border-purple-200 transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <motion.div
                        className="w-8 h-8 rounded-lg bg-[#63268c] flex items-center justify-center text-white font-bold"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        ?
                      </motion.div>
                      {faq.q}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 leading-relaxed">{faq.a}</p>
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

export default FAQSection;
