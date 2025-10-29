import React from "react";
import { motion } from "framer-motion";
import { Star, Users } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import AnimatedSection from "./AnimatedSection";

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Priya Sharma",
      company: "TechWomen India",
      text: "MyProBuddy helped us secure ₹10 lakhs through the Women Innovators Fund. The AI matching was spot-on!",
      rating: 5,
    },
    {
      name: "Rajesh Kumar",
      company: "GreenTech Solutions",
      text: "The soft approval feature saved us weeks of research. Highly recommend for early-stage startups.",
      rating: 5,
    },
    {
      name: "Anjali Verma",
      company: "HealthFirst Startup",
      text: "Expert consultation made all the difference. We got funding within 3 months of signing up.",
      rating: 5,
    },
  ];

  return (
    <section
      className="section px-4 sm:px-6 relative overflow-hidden bg-gradient-to-b from-gray-50 to-white"
      data-testid="testimonials-section"
    >
      <div className="container mx-auto max-w-6xl relative">
        <div className="text-center mb-16">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-50 border border-yellow-100 mb-4"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.05 }}
          >
            <Star className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-600">
              Success Stories
            </span>
          </motion.div>
          <motion.h2
            className="text-4xl sm:text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Success Stories
          </motion.h2>
          <motion.p
            className="text-lg text-gray-600"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Join hundreds of startups who found funding with MyProBuddy
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.map((testimonial, idx) => (
            <AnimatedSection key={idx} variant="testimonials" custom={idx}>
              <motion.div
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card
                  className="relative overflow-hidden border-2 hover:border-purple-200 transition-all duration-300 h-full group"
                  data-testid={`testimonial-${idx}`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[gradient-to-br from-purple-100 to-orange-100] rounded-full opacity-0 group-hover:opacity-20 transition-opacity transform translate-x-16 -translate-y-16" />
                  <CardContent className="pt-6 relative">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5 + i * 0.1 }}
                        >
                          <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        </motion.div>
                      ))}
                    </div>
                    <p className="text-gray-700 mb-6 italic leading-relaxed">
                      "{testimonial.text}"
                    </p>
                    <div className="flex items-center">
                      <motion.div
                        className="w-12 h-12 rounded-full flex items-center justify-center mr-4 bg-[#63268c]"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <Users className="w-6 h-6 text-white" />
                      </motion.div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {testimonial.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {testimonial.company}
                        </div>
                      </div>
                    </div>
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

export default TestimonialsSection;
