import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  Zap,
  Trophy,
  Award,
  CheckCircle,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import AnimatedSection from "./AnimatedSection";

const PricingSection = () => {
  const navigate = useNavigate();

  const plans = [
    {
      name: "Free Tier",
      price: "₹0",
      features: [
        "Top 3 grant matches",
        "Soft approval tags",
        "Basic dashboard",
        "Upgrade prompts",
      ],
      cta: "Get Started",
      highlighted: false,
      icon: Sparkles,
    },
    {
      name: "Premium",
      price: "₹199",
      coupon: "GRANT199",
      features: [
        "Top 10 grant matches",
        "Email notifications",
        "PDF downloads",
        "Priority support",
      ],
      cta: "Upgrade Now",
      highlighted: true,
      icon: Zap,
    },
    {
      name: "Expert",
      price: "₹30,000",
      coupon: "EXPERT30K",
      features: [
        "Unlimited grant access",
        "Expert consultation",
        "CRM integration",
        "Full application support",
        "3-month engagement",
      ],
      cta: "Contact Us",
      highlighted: false,
      icon: Trophy,
    },
  ];

  return (
    <section className="section px-4 sm:px-6" data-testid="pricing-section">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-100 mb-4"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05 }}
          >
            <Award className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-600">
              Flexible Pricing
            </span>
          </motion.div>
          <motion.h2
            className="text-4xl sm:text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Choose Your Plan
          </motion.h2>
          <motion.p
            className="text-lg text-gray-600"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Start free, upgrade anytime with coupon codes
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
          {plans.map((plan, idx) => (
            <AnimatedSection key={idx} variant="pricing" custom={idx}>
              <motion.div
                whileHover={{ y: -12, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="h-full"
              >
                <Card
                  className={`relative overflow-hidden h-full flex flex-col ${
                    plan.highlighted
                      ? "ring-2 ring-[#5d248f] shadow-2xl"
                      : "border-2 hover:border-purple-200"
                  } transition-all duration-300`}
                  data-testid={`pricing-card-${idx}`}
                >
                  {plan.highlighted && (
                    <motion.div
                      className="absolute top-0 left-0 right-0 h-1 bg-[#63268c]"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.5, duration: 0.8 }}
                    />
                  )}
                  <CardHeader className="relative">
                    {plan.highlighted && (
                      <motion.div
                        className="bg-[#63268c] text-white text-sm font-semibold px-4 py-1 rounded-full w-fit mx-auto mb-4"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.3 }}
                      >
                        Most Popular
                      </motion.div>
                    )}
                    <motion.div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      style={{
                        background: plan.highlighted ? "#63268c" : "#f3f4f6",
                      }}
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <plan.icon
                        className={`w-8 h-8 ${
                          plan.highlighted ? "text-white" : "text-gray-700"
                        }`}
                      />
                    </motion.div>
                    <CardTitle className="text-3xl text-center">
                      {plan.name}
                    </CardTitle>
                    <motion.div
                      className="text-5xl font-bold text-center mt-4 text-[#5d248f]"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.4 + idx * 0.1 }}
                    >
                      {plan.price}
                    </motion.div>
                    {plan.coupon && (
                      <motion.div
                        className="text-center mt-2 text-sm text-gray-600"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                      >
                        Use code:{" "}
                        <span className="font-mono font-semibold text-[#f46d19] bg-orange-50 px-2 py-1 rounded">
                          {plan.coupon}
                        </span>
                      </motion.div>
                    )}
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-3 mb-6 flex-1">
                      {plan.features.map((feature, fidx) => (
                        <motion.li
                          key={fidx}
                          className="flex items-start"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 + fidx * 0.1 }}
                        >
                          <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{feature}</span>
                        </motion.li>
                      ))}
                    </ul>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        className={`w-full ${
                          plan.highlighted
                            ? "bg-[#63268c]"
                            : "bg-gray-800 hover:bg-gray-900"
                        } group`}
                        onClick={() => navigate("/register")}
                        data-testid={`plan-cta-${idx}`}
                      >
                        {plan.cta}
                        <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </motion.div>
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

export default PricingSection;
