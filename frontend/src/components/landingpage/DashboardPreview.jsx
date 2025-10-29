import React, { useState, useEffect } from "react";
import { motion, useTransform } from "framer-motion";
import {
  Users,
  Search,
  Target,
  FileCheck,
  TrendingUp,
  CheckCircle,
  Trophy,
  Bell,
  Percent,
  Clock,
  DollarSign,
  Building2,
} from "lucide-react";

const DashboardPreview = ({ smoothMouseX, smoothMouseY }) => {
  const [activeCard, setActiveCard] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!hasAnimated) {
      const interval = setInterval(() => {
        setActiveCard((prev) => {
          const next = (prev + 1) % 3;
          if (next === 0) {
            setHasAnimated(true);
            clearInterval(interval);
          }
          return next;
        });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [hasAnimated]);

  return (
    <motion.div
      className="relative w-full max-w-2xl mx-auto"
      style={{
        rotateY: useTransform(smoothMouseX, [-100, 100], [-5, 5]),
        rotateX: useTransform(smoothMouseY, [-100, 100], [5, -5]),
      }}
    >
      {/* Main Dashboard Container */}
      <motion.div
        className="relative bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200 overflow-hidden w-full"
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        {/* Dashboard Header */}
        <div className="bg-[#63268c] p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg">
                  Welcome back!
                </h3>
                <p className="text-xs sm:text-sm opacity-90">
                  Your Startup Dashboard
                </p>
              </div>
            </div>
            <motion.div
              className="relative"
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: 0 }}
            >
              <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full" />
            </motion.div>
          </div>

          {/* Search Bar */}
          <div className="bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 flex items-center gap-2">
            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            <motion.input
              type="text"
              placeholder="Search grants..."
              className="bg-transparent border-none outline-none text-white placeholder-white/70 w-full text-sm sm:text-base"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: 1, duration: 0.5 }}
            />
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {[
              { label: "Matches", value: "12", icon: Target, color: "#5d248f" },
              {
                label: "Applied",
                value: "5",
                icon: FileCheck,
                color: "#f46d19",
              },
              {
                label: "Success",
                value: "87%",
                icon: TrendingUp,
                color: "#ef3e25",
              },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                className="bg-gray-50 rounded-lg sm:rounded-xl p-2 sm:p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + idx * 0.1 }}
              >
                <stat.icon
                  className="w-4 h-4 sm:w-5 sm:h-5 mb-1 sm:mb-2"
                  style={{ color: stat.color }}
                />
                <div
                  className="text-lg sm:text-2xl font-bold"
                  style={{ color: stat.color }}
                >
                  {stat.value}
                </div>
                <div className="text-[10px] sm:text-xs text-gray-600">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Grant Cards */}
          <div className="space-y-2 sm:space-y-3">
            {[
              {
                name: "Women Innovators Fund",
                match: 95,
                amount: "₹10L",
                deadline: "15 days",
              },
              {
                name: "Startup India Seed",
                match: 88,
                amount: "₹20L",
                deadline: "22 days",
              },
              {
                name: "MSME Technology",
                match: 82,
                amount: "₹15L",
                deadline: "30 days",
              },
            ].map((grant, idx) => (
              <motion.div
                key={idx}
                className={`bg-gradient-to-r ${
                  activeCard === idx
                    ? "from-purple-50 to-orange-50 border-2 border-purple-300"
                    : "from-gray-50 to-gray-50 border border-gray-200"
                } rounded-lg sm:rounded-xl p-3 sm:p-4 transition-all duration-300`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + idx * 0.15 }}
              >
                <div className="flex items-start justify-between mb-2 sm:mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-xs sm:text-sm mb-1 truncate">
                      {grant.name}
                    </h4>
                    <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-gray-600">
                      <Building2 className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">Government of India</span>
                    </div>
                  </div>
                  <motion.div
                    className="flex items-center gap-0.5 sm:gap-1 bg-green-100 text-green-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap ml-2"
                    animate={{ scale: activeCard === idx ? [1, 1.1, 1] : 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Percent className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    {grant.match}%
                  </motion.div>
                </div>

                <div className="flex items-center justify-between text-[10px] sm:text-xs">
                  <div className="flex items-center gap-0.5 sm:gap-1 text-purple-600 font-semibold">
                    <DollarSign className="w-3 h-3" />
                    {grant.amount}
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1 text-gray-600">
                    <Clock className="w-3 h-3" />
                    {grant.deadline}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-2 sm:mt-3 bg-gray-200 rounded-full h-1 sm:h-1.5 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#5d248f] to-[#f46d19]"
                    initial={{ width: 0 }}
                    animate={{ width: `${grant.match}%` }}
                    transition={{ delay: 1.5 + idx * 0.15, duration: 1 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Floating Elements */}
      <motion.div
        className="absolute -top-4 sm:-top-6 -right-4 sm:-right-6 bg-white rounded-xl sm:rounded-2xl shadow-xl p-2 sm:p-4 border border-gray-200 hidden sm:block"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.5, type: "spring" }}
        style={{
          x: useTransform(smoothMouseX, [-100, 100], [-10, 10]),
          y: useTransform(smoothMouseY, [-100, 100], [-10, 10]),
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
          </div>
          <div>
            <div className="text-[10px] sm:text-xs font-semibold">
              New Match!
            </div>
            <div className="text-[10px] sm:text-xs text-gray-600">
              95% compatible
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute -bottom-3 sm:-bottom-4 -left-3 sm:-left-4 bg-white rounded-xl sm:rounded-2xl shadow-xl p-2 sm:p-4 border border-gray-200 hidden sm:block"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.8, type: "spring" }}
        style={{
          x: useTransform(smoothMouseX, [-100, 100], [10, -10]),
          y: useTransform(smoothMouseY, [-100, 100], [10, -10]),
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
          </div>
          <div>
            <div className="text-[10px] sm:text-xs font-semibold">₹50Cr+</div>
            <div className="text-[10px] sm:text-xs text-gray-600">Funded</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DashboardPreview;
