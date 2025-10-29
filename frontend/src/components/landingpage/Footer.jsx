import React from "react";
import { motion } from "framer-motion";

const Footer = () => {
  return (
    <footer
      className="bg-gray-900 text-white py-8 sm:py-12 px-4 sm:px-6"
      data-testid="footer"
    >
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div>
            <motion.div
              className="flex items-center space-x-2 mb-4"
              whileHover={{ scale: 1.05 }}
            >
              <img
                src="/myprobuddy-logo.png"
                alt="MyProBuddy Logo"
                className="w-8 h-8 object-contain"
              />
              <h3 className="text-lg sm:text-xl font-bold text-white font-poppins">
                MyProBuddy
              </h3>
            </motion.div>
            <p className="text-sm sm:text-base text-gray-400">
              AI-powered grant matching for startups
            </p>
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4">
              Product
            </h4>
            <ul className="space-y-2 text-sm sm:text-base text-gray-400">
              <li>
                <a
                  href="#features"
                  className="hover:text-white transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="hover:text-white transition-colors"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="hover:text-white transition-colors"
                >
                  How It Works
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4">
              Company
            </h4>
            <ul className="space-y-2 text-sm sm:text-base text-gray-400">
              <li>
                <a href="#about" className="hover:text-white transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  className="hover:text-white transition-colors"
                >
                  Contact
                </a>
              </li>
              <li>
                <a
                  href="#careers"
                  className="hover:text-white transition-colors"
                >
                  Careers
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4">
              Legal
            </h4>
            <ul className="space-y-2 text-sm sm:text-base text-gray-400">
              <li>
                <a
                  href="#privacy"
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#terms" className="hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-sm sm:text-base text-gray-400">
          <p className="text-xs sm:text-sm">
            &copy; 2025 MyProBuddy. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
