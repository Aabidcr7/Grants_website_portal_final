import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../ui/button";

const Navigation = () => {
  const navigate = useNavigate();

  return (
    <motion.nav
      className="fixed top-0 w-full bg-white/80 backdrop-blur-xl z-50 border-b border-gray-100"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      data-testid="main-navigation"
    >
      <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
        <motion.div
          className="flex items-center space-x-2 sm:space-x-3"
          whileHover={{ scale: 1.05 }}
        >
          <img
            src="/myprobuddy-logo.png"
            alt="MyProBuddy Logo"
            className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
          />
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900 font-poppins">
            MyProBuddy
          </h1>
        </motion.div>
        <div className="flex space-x-2 sm:space-x-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/login")}
            data-testid="nav-login-btn"
            className="text-sm sm:text-base px-3 sm:px-4"
          >
            Login
          </Button>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => navigate("/register")}
              className="bg-[#5d248f] hover:bg-[#4a1d73] text-sm sm:text-base px-3 sm:px-4"
              data-testid="nav-register-btn"
            >
              Get Started
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navigation;
