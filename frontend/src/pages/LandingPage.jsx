import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { 
  Target, 
  Search, 
  Trophy, 
  CheckCircle, 
  Users, 
  TrendingUp, 
  Award, 
  Calendar,
  Sparkles,
  Zap,
  Shield,
  ArrowRight,
  Star,
  Rocket,
  Brain,
  BarChart3,
  FileCheck,
  MessageSquare,
  ChevronRight,
  Bell,
  ChevronDown,
  Percent,
  Clock,
  DollarSign,
  Building2
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
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
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Matching',
      description: 'Our GPT-4 powered engine analyzes your profile and matches you with the most relevant grants.',
      color: '#5d248f'
    },
    {
      icon: Target,
      title: 'Soft Approval Tags',
      description: 'Get pre-screened grants with soft approval indicators to save time and increase success rates.',
      color: '#f46d19'
    },
    {
      icon: Shield,
      title: 'Expert Consultation',
      description: 'Access to grant experts who guide you through the entire application process.',
      color: '#ef3e25'
    },
    {
      icon: BarChart3,
      title: 'Track Success',
      description: 'Monitor your applications, deadlines, and success metrics in one dashboard.',
      color: '#5d248f'
    }
  ];

  const plans = [
    {
      name: 'Free Tier',
      price: '₹0',
      features: [
        'Top 3 grant matches',
        'Soft approval tags',
        'Basic dashboard',
        'Upgrade prompts'
      ],
      cta: 'Get Started',
      highlighted: false,
      icon: Sparkles
    },
    {
      name: 'Premium',
      price: '₹199',
      coupon: 'GRANT199',
      features: [
        'Top 10 grant matches',
        'Email notifications',
        'PDF downloads',
        'Priority support'
      ],
      cta: 'Upgrade Now',
      highlighted: true,
      icon: Zap
    },
    {
      name: 'Expert',
      price: '₹30,000',
      coupon: 'EXPERT30K',
      features: [
        'Unlimited grant access',
        'Expert consultation',
        'CRM integration',
        'Full application support',
        '3-month engagement'
      ],
      cta: 'Contact Us',
      highlighted: false,
      icon: Trophy
    }
  ];

  const testimonials = [
    {
      name: 'Priya Sharma',
      company: 'TechWomen India',
      text: 'MyProBuddy helped us secure ₹10 lakhs through the Women Innovators Fund. The AI matching was spot-on!',
      rating: 5
    },
    {
      name: 'Rajesh Kumar',
      company: 'GreenTech Solutions',
      text: 'The soft approval feature saved us weeks of research. Highly recommend for early-stage startups.',
      rating: 5
    },
    {
      name: 'Anjali Verma',
      company: 'HealthFirst Startup',
      text: 'Expert consultation made all the difference. We got funding within 3 months of signing up.',
      rating: 5
    }
  ];

  // Dashboard Preview Component
  const DashboardPreview = () => {
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
        className="relative w-full h-full"
        style={{
          rotateY: useTransform(smoothMouseX, [-100, 100], [-5, 5]),
          rotateX: useTransform(smoothMouseY, [-100, 100], [5, -5]),
        }}
      >
        {/* Main Dashboard Container */}
        <motion.div
          className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200 overflow-hidden"
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          {/* Dashboard Header */}
          <div className="bg-gradient-to-r from-[#5d248f] to-[#f46d19] p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Welcome back!</h3>
                  <p className="text-sm opacity-90">Your Startup Dashboard</p>
                </div>
              </div>
              <motion.div
                className="relative"
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: 0 }}
              >
                <Bell className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
              </motion.div>
            </div>
            
            {/* Search Bar */}
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 flex items-center gap-2">
              <Search className="w-5 h-5" />
              <motion.input
                type="text"
                placeholder="Search grants..."
                className="bg-transparent border-none outline-none text-white placeholder-white/70 w-full"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ delay: 1, duration: 0.5 }}
              />
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="p-6 space-y-4">
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Matches', value: '12', icon: Target, color: '#5d248f' },
                { label: 'Applied', value: '5', icon: FileCheck, color: '#f46d19' },
                { label: 'Success', value: '87%', icon: TrendingUp, color: '#ef3e25' }
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  className="bg-gray-50 rounded-xl p-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + idx * 0.1 }}
                >
                  <stat.icon className="w-5 h-5 mb-2" style={{ color: stat.color }} />
                  <div className="text-2xl font-bold" style={{ color: stat.color }}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-600">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* Grant Cards */}
            <div className="space-y-3">
              {[
                { name: 'Women Innovators Fund', match: 95, amount: '₹10L', deadline: '15 days' },
                { name: 'Startup India Seed', match: 88, amount: '₹20L', deadline: '22 days' },
                { name: 'MSME Technology', match: 82, amount: '₹15L', deadline: '30 days' }
              ].map((grant, idx) => (
                <motion.div
                  key={idx}
                  className={`bg-gradient-to-r ${
                    activeCard === idx
                      ? 'from-purple-50 to-orange-50 border-2 border-purple-300'
                      : 'from-gray-50 to-gray-50 border border-gray-200'
                  } rounded-xl p-4 transition-all duration-300`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1 + idx * 0.15 }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1">{grant.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Building2 className="w-3 h-3" />
                        <span>Government of India</span>
                      </div>
                    </div>
                    <motion.div
                      className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold"
                      animate={{ scale: activeCard === idx ? [1, 1.1, 1] : 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Percent className="w-3 h-3" />
                      {grant.match}%
                    </motion.div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-purple-600 font-semibold">
                      <DollarSign className="w-3 h-3" />
                      {grant.amount}
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock className="w-3 h-3" />
                      {grant.deadline}
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-3 bg-gray-200 rounded-full h-1.5 overflow-hidden">
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
          className="absolute -top-6 -right-6 bg-white rounded-2xl shadow-xl p-4 border border-gray-200"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5, type: "spring" }}
          style={{
            x: useTransform(smoothMouseX, [-100, 100], [-10, 10]),
            y: useTransform(smoothMouseY, [-100, 100], [-10, 10]),
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-xs font-semibold">New Match!</div>
              <div className="text-xs text-gray-600">95% compatible</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-4 border border-gray-200"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.8, type: "spring" }}
          style={{
            x: useTransform(smoothMouseX, [-100, 100], [10, -10]),
            y: useTransform(smoothMouseY, [-100, 100], [10, -10]),
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <Trophy className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-xs font-semibold">₹50Cr+</div>
              <div className="text-xs text-gray-600">Funded</div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // Unique animation variants for each section
  const sectionVariants = {
    stats: {
      hidden: { opacity: 0, x: -100 },
      visible: (i) => ({
        opacity: 1,
        x: 0,
        transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" }
      })
    },
    howItWorks: {
      hidden: { opacity: 0, scale: 0.8 },
      visible: (i) => ({
        opacity: 1,
        scale: 1,
        transition: { delay: i * 0.2, duration: 0.5, ease: "backOut" }
      })
    },
    features: {
      hidden: { opacity: 0, y: 50, rotate: -5 },
      visible: (i) => ({
        opacity: 1,
        y: 0,
        rotate: 0,
        transition: { delay: Math.random() * 0.3, duration: 0.6, ease: "easeOut" }
      })
    },
    pricing: {
      hidden: { opacity: 0, rotateY: 90 },
      visible: (i) => ({
        opacity: 1,
        rotateY: 0,
        transition: { delay: i * 0.15, duration: 0.7, ease: "easeOut" }
      })
    },
    testimonials: {
      hidden: { opacity: 0, x: 100 },
      visible: (i) => ({
        opacity: 1,
        x: 0,
        transition: { delay: i * 0.2, duration: 0.6, ease: "easeOut" }
      })
    },
    cta: {
      hidden: { opacity: 0, scale: 0.5 },
      visible: {
        opacity: 1,
        scale: 1,
        transition: { duration: 0.8, ease: "backOut" }
      }
    },
    faq: {
      hidden: { opacity: 0, y: -30 },
      visible: (i) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" }
      })
    }
  };

  const AnimatedSection = ({ children, variant = "default", custom = 0 }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
      <motion.div
        ref={ref}
        custom={custom}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={sectionVariants[variant] || {
          hidden: { opacity: 0, y: 50 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
        }}
      >
        {children}
      </motion.div>
    );
  };

  const FloatingShape = ({ delay = 0, duration = 20, size = 64 }) => (
    <motion.div
      className="absolute rounded-full opacity-10"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg, #5d248f 0%, #f46d19 100%)',
        filter: 'blur(40px)',
      }}
      initial={{
        x: 0,
        y: 0,
        scale: 1,
      }}
      animate={{
        x: [0, 100, 0],
        y: [0, -100, 0],
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration,
        repeat: 0,
        delay,
        ease: "easeInOut"
      }}
    />
  );

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#5d248f] to-[#f46d19] origin-left z-50"
        style={{ scaleX: scrollYProgress }}
      />

      {/* Navigation */}
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
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 font-poppins">MyProBuddy</h1>
          </motion.div>
          <div className="flex space-x-2 sm:space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/login')} 
              data-testid="nav-login-btn"
              className="text-sm sm:text-base px-3 sm:px-4"
            >
              Login
            </Button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={() => navigate('/register')} 
                className="bg-[#5d248f] hover:bg-[#4a1d73] text-sm sm:text-base px-3 sm:px-4" 
                data-testid="nav-register-btn"
              >
                Get Started
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-6 overflow-hidden min-h-screen flex items-center" 
        data-testid="hero-section"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 -z-10">
          <FloatingShape delay={0} duration={25} size={300} />
          <FloatingShape delay={5} duration={30} size={200} />
          <FloatingShape delay={10} duration={20} size={250} />
        </div>

        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 -z-10 opacity-[0.02]">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(#5d248f 2px, transparent 2px), linear-gradient(90deg, #5d248f 2px, transparent 2px)',
            backgroundSize: '60px 60px',
            transform: 'perspective(500px) rotateX(60deg)',
            transformOrigin: 'center top'
          }} />
        </div>

        {/* Spotlight Effect */}
        <motion.div
          className="absolute inset-0 -z-10 pointer-events-none"
          style={{
            background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(93, 36, 143, 0.05), transparent 40%)`,
          }}
        />

        <div className="container mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Badge */}
              <motion.div
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-purple-50 border border-purple-100 mb-4 sm:mb-6"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.05 }}
              >
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-[#5d248f]" />
                <span className="text-xs sm:text-sm font-medium text-[#5d248f]">AI-Powered Grant Discovery</span>
              </motion.div>

              <motion.h1 
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                Discover Perfect
                <br />
                <span className="gradient-text">Grant Matches</span>
                <br />
                in Seconds
              </motion.h1>

              <motion.p 
                className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-10 leading-relaxed max-w-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Our AI analyzes your startup profile and matches you with the most relevant government grants. Get pre-screened opportunities with soft approval tags.
              </motion.p>

              <motion.div 
                className="flex gap-3 sm:gap-4 flex-wrap"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    size="lg" 
                    onClick={() => navigate('/register')} 
                    className="bg-gradient-to-r from-[#5d248f] to-[#f46d19] hover:opacity-90 text-sm sm:text-base lg:text-lg px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 group"
                    data-testid="hero-cta-btn"
                  >
                    Start Free Trial
                    <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
                    className="text-sm sm:text-base lg:text-lg px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 border-2 group"
                    data-testid="learn-more-btn"
                  >
                    Watch Demo
                    <Sparkles className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform" />
                  </Button>
                </motion.div>
              </motion.div>

              {/* Trust Indicators */}
              <motion.div
                className="flex items-center gap-4 sm:gap-6 mt-6 sm:mt-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-400 to-orange-400 border-2 border-white" />
                  ))}
                </div>
                <div>
                  <div className="font-semibold text-sm sm:text-base text-gray-900">500+ Startups</div>
                  <div className="text-xs sm:text-sm text-gray-600">Trust MyProBuddy</div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Content - Dashboard Preview */}
            <div className="relative lg:h-[600px] h-[400px] sm:h-[500px] mt-8 lg:mt-0">
              <DashboardPreview />
            </div>
          </div>

        </div>
      </section>

      {/* Stats Section */}
      <section id="stats-section" className="section bg-gradient-to-b from-gray-50 to-white px-4 sm:px-6" data-testid="stats-section">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {[
              { value: '500+', label: 'Active Startups', color: '#5d248f', icon: Users },
              { value: '200+', label: 'Available Grants', color: '#f46d19', icon: FileCheck },
              { value: '₹50Cr+', label: 'Funding Secured', color: '#ef3e25', icon: TrendingUp },
              { value: '87%', label: 'Success Rate', color: '#5d248f', icon: Award }
            ].map((stat, idx) => (
              <AnimatedSection key={idx} variant="stats" custom={idx}>
                <motion.div
                  className="relative group"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-orange-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative p-6 text-center">
                    <stat.icon className="w-8 h-8 mx-auto mb-3" style={{ color: stat.color }} />
                    <div className="text-4xl font-bold mb-2" style={{ color: stat.color }}>
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

      {/* How It Works */}
      <section id="how-it-works" className="section px-4 sm:px-6" data-testid="how-it-works-section">
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
              <span className="text-sm font-medium text-[#5d248f]">Simple Process</span>
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
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#5d248f] via-[#f46d19] to-[#ef3e25] opacity-20" style={{ transform: 'translateY(-50%)' }} />
            
            {[
              { icon: Users, title: '1. Register & Profile', desc: 'Create your account and complete the grant screening form with your startup details.', color: '#5d248f' },
              { icon: Search, title: '2. AI Matching', desc: 'Our AI analyzes your profile against thousands of grants to find perfect matches.', color: '#f46d19' },
              { icon: Trophy, title: '3. Apply & Win', desc: 'Review your matches, get expert help, and apply to secure funding for your startup.', color: '#ef3e25' }
            ].map((step, idx) => (
              <AnimatedSection key={idx} variant="howItWorks" custom={idx}>
                <motion.div whileHover={{ y: -10 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Card className="relative overflow-hidden border-2 hover:border-purple-200 transition-all duration-300 h-full" data-testid={`step-${idx + 1}-card`}>
                    <div className="absolute top-0 right-0 w-32 h-32 opacity-5" style={{ background: `radial-gradient(circle, ${step.color} 0%, transparent 70%)` }} />
                    <CardHeader>
                      <motion.div 
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 relative"
                        style={{ background: `linear-gradient(135deg, ${step.color}15 0%, ${step.color}05 100%)` }}
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <step.icon className="w-8 h-8" style={{ color: step.color }} />
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
                      <CardTitle className="text-2xl text-center">{step.title}</CardTitle>
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

      {/* Features */}
      <section className="section px-4 sm:px-6 relative bg-gradient-to-b from-white to-gray-50" data-testid="features-section">
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
              <span className="text-sm font-medium text-[#f46d19]">Powerful Features</span>
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
                <motion.div whileHover={{ y: -8, scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Card className="relative overflow-hidden border-2 hover:border-purple-200 transition-all duration-300 h-full group" data-testid={`feature-card-${idx}`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-orange-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="relative">
                      <motion.div 
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ background: `linear-gradient(135deg, ${feature.color}15 0%, ${feature.color}05 100%)` }}
                        whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                        transition={{ duration: 0.5 }}
                      >
                        <feature.icon className="w-8 h-8" style={{ color: feature.color }} />
                      </motion.div>
                      <CardTitle className="text-xl text-center">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="relative">
                      <p className="text-gray-600 text-center">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
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
              <span className="text-sm font-medium text-green-600">Flexible Pricing</span>
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
                <motion.div whileHover={{ y: -12, scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Card 
                    className={`relative overflow-hidden h-full ${plan.highlighted ? 'ring-2 ring-[#5d248f] shadow-2xl' : 'border-2 hover:border-purple-200'} transition-all duration-300`}
                    data-testid={`pricing-card-${idx}`}
                  >
                    {plan.highlighted && (
                      <motion.div 
                        className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#5d248f] to-[#f46d19]"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                      />
                    )}
                    <CardHeader className="relative">
                      {plan.highlighted && (
                        <motion.div 
                          className="bg-gradient-to-r from-[#5d248f] to-[#f46d19] text-white text-sm font-semibold px-4 py-1 rounded-full w-fit mx-auto mb-4"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", delay: 0.3 }}
                        >
                          Most Popular
                        </motion.div>
                      )}
                      <motion.div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ background: plan.highlighted ? 'linear-gradient(135deg, #5d248f 0%, #f46d19 100%)' : '#f3f4f6' }}
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <plan.icon className={`w-8 h-8 ${plan.highlighted ? 'text-white' : 'text-gray-700'}`} />
                      </motion.div>
                      <CardTitle className="text-3xl text-center">{plan.name}</CardTitle>
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
                          Use code: <span className="font-mono font-semibold text-[#f46d19] bg-orange-50 px-2 py-1 rounded">{plan.coupon}</span>
                        </motion.div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 mb-6">
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
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button 
                          className={`w-full ${plan.highlighted ? 'bg-gradient-to-r from-[#5d248f] to-[#f46d19] hover:opacity-90' : 'bg-gray-800 hover:bg-gray-900'} group`}
                          onClick={() => navigate('/register')}
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

      {/* Testimonials */}
      <section className="section px-4 sm:px-6 relative overflow-hidden bg-gradient-to-b from-gray-50 to-white" data-testid="testimonials-section">
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
              <span className="text-sm font-medium text-yellow-600">Success Stories</span>
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
                <motion.div whileHover={{ y: -8, scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Card className="relative overflow-hidden border-2 hover:border-purple-200 transition-all duration-300 h-full group" data-testid={`testimonial-${idx}`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-orange-100 rounded-full opacity-0 group-hover:opacity-20 transition-opacity transform translate-x-16 -translate-y-16" />
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
                      <p className="text-gray-700 mb-6 italic leading-relaxed">"{testimonial.text}"</p>
                      <div className="flex items-center">
                        <motion.div 
                          className="w-12 h-12 rounded-full flex items-center justify-center mr-4 bg-gradient-to-br from-[#5d248f] to-[#f46d19]"
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                        >
                          <Users className="w-6 h-6 text-white" />
                        </motion.div>
                        <div>
                          <div className="font-semibold text-gray-900">{testimonial.name}</div>
                          <div className="text-sm text-gray-600">{testimonial.company}</div>
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

      {/* Expert Consultation CTA */}
      <AnimatedSection variant="cta">
        <section className="section relative overflow-hidden px-4 sm:px-6" data-testid="expert-cta-section">
          <div className="absolute inset-0 bg-gradient-to-br from-[#5d248f] to-[#4a1d73]" />
          <motion.div
            className="absolute inset-0 opacity-10"
            initial={{
              backgroundPosition: '0% 0%',
            }}
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
            }}
            transition={{
              duration: 20,
              repeat: 0,
            }}
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '50px 50px',
            }}
          />
          <div className="container mx-auto max-w-4xl text-center relative">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Calendar className="w-16 h-16 mx-auto mb-6 text-white" />
            </motion.div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-white">Need Expert Help?</h2>
            <p className="text-base sm:text-lg mb-6 sm:mb-8 text-white/90 leading-relaxed">
              Our grant experts have helped secure over ₹50 crores in funding. 
              Book a consultation to maximize your success rate.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                size="lg" 
                onClick={() => navigate('/register')} 
                className="bg-white text-[#5d248f] hover:bg-gray-100 text-sm sm:text-base lg:text-lg px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 group"
                data-testid="expert-consultation-btn"
              >
                Book Expert Consultation
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </div>
        </section>
      </AnimatedSection>

      {/* FAQ */}
      <section className="section px-4 sm:px-6 bg-gray-50" data-testid="faq-section">
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
            {[
              { q: 'How does AI matching work?', a: 'Our GPT-4 powered engine analyzes your startup profile including industry, stage, revenue, and demographics to match you with the most relevant grants from our database of 200+ opportunities.' },
              { q: 'What are soft approvals?', a: 'Soft approvals indicate grants where our system has pre-screened your eligibility based on initial criteria. This increases your chances of success and saves application time.' },
              { q: 'How do I upgrade my tier?', a: 'Simply use the coupon codes GRANT199 for Premium tier or EXPERT30K for Expert tier in your dashboard. Your account will be upgraded instantly.' }
            ].map((faq, idx) => (
              <AnimatedSection key={idx} variant="faq" custom={idx}>
                <motion.div whileHover={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Card className="border-2 hover:border-purple-200 transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <motion.div
                          className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5d248f] to-[#f46d19] flex items-center justify-center text-white font-bold"
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

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 sm:py-12 px-4 sm:px-6" data-testid="footer">
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
                <h3 className="text-lg sm:text-xl font-bold text-white font-poppins">MyProBuddy</h3>
              </motion.div>
              <p className="text-sm sm:text-base text-gray-400">AI-powered grant matching for startups</p>
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4">Product</h4>
              <ul className="space-y-2 text-sm sm:text-base text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4">Company</h4>
              <ul className="space-y-2 text-sm sm:text-base text-gray-400">
                <li><a href="#about" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#careers" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-semibold mb-3 sm:mb-4">Legal</h4>
              <ul className="space-y-2 text-sm sm:text-base text-gray-400">
                <li><a href="#privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#terms" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-sm sm:text-base text-gray-400">
            <p className="text-xs sm:text-sm">&copy; 2025 MyProBuddy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;