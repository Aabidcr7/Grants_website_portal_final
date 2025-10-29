import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Target, Search, Trophy, CheckCircle, Users, TrendingUp, Award, Calendar } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Search className="w-8 h-8 text-[#5d248f]" />,
      title: 'AI-Powered Matching',
      description: 'Our GPT-4 powered engine analyzes your profile and matches you with the most relevant grants.'
    },
    {
      icon: <Target className="w-8 h-8 text-[#f46d19]" />,
      title: 'Soft Approval Tags',
      description: 'Get pre-screened grants with soft approval indicators to save time and increase success rates.'
    },
    {
      icon: <Trophy className="w-8 h-8 text-[#ef3e25]" />,
      title: 'Expert Consultation',
      description: 'Access to grant experts who guide you through the entire application process.'
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-[#5d248f]" />,
      title: 'Track Success',
      description: 'Monitor your applications, deadlines, and success metrics in one dashboard.'
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
      highlighted: false
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
      highlighted: true
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
      highlighted: false
    }
  ];

  const testimonials = [
    {
      name: 'Priya Sharma',
      company: 'TechWomen India',
      text: 'MyProBuddy helped us secure ₹10 lakhs through the Women Innovators Fund. The AI matching was spot-on!'
    },
    {
      name: 'Rajesh Kumar',
      company: 'GreenTech Solutions',
      text: 'The soft approval feature saved us weeks of research. Highly recommend for early-stage startups.'
    },
    {
      name: 'Anjali Verma',
      company: 'HealthFirst Startup',
      text: 'Expert consultation made all the difference. We got funding within 3 months of signing up.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md z-50 border-b border-gray-100" data-testid="main-navigation">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img 
              src="/myprobuddy-logo.png" 
              alt="MyProBuddy Logo" 
              className="w-10 h-10 object-contain"
            />
            <h1 className="text-2xl font-bold text-gray-900 font-poppins">MyProBuddy</h1>
          </div>
          <div className="flex space-x-4">
            <Button variant="ghost" onClick={() => navigate('/login')} data-testid="nav-login-btn">
              Login
            </Button>
            <Button onClick={() => navigate('/register')} className="bg-[#5d248f] hover:bg-[#4a1d73]" data-testid="nav-register-btn">
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6" data-testid="hero-section">
        <div className="container mx-auto text-center max-w-5xl">
          <div className="fade-in-up">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Discover Government Grants
              <span className="gradient-text"> Powered by AI</span>
            </h1>
            <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
              Connect your startup with the perfect funding opportunities. Our AI analyzes thousands of grants to find your best matches.
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Button 
                size="lg" 
                onClick={() => navigate('/register')} 
                className="bg-[#5d248f] hover:bg-[#4a1d73] text-lg px-8 py-6"
                data-testid="hero-cta-btn"
              >
                Find Grants Now
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })}
                className="text-lg px-8 py-6"
                data-testid="learn-more-btn"
              >
                Learn More
              </Button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20" data-testid="stats-section">
            <div className="fade-in-up">
              <div className="text-4xl font-bold text-[#5d248f]">500+</div>
              <div className="text-gray-600 mt-2">Active Startups</div>
            </div>
            <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="text-4xl font-bold text-[#f46d19]">200+</div>
              <div className="text-gray-600 mt-2">Available Grants</div>
            </div>
            <div className="fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="text-4xl font-bold text-[#ef3e25]">₹50Cr+</div>
              <div className="text-gray-600 mt-2">Funding Secured</div>
            </div>
            <div className="fade-in-up" style={{ animationDelay: '0.3s' }}>
              <div className="text-4xl font-bold text-[#5d248f]">87%</div>
              <div className="text-gray-600 mt-2">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="section bg-gray-50 px-6" data-testid="how-it-works-section">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-gray-600">Get matched with grants in 3 simple steps</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="card text-center" data-testid="step-1-card">
              <CardHeader>
                <div className="w-16 h-16 bg-[#5d248f]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-[#5d248f]" />
                </div>
                <CardTitle className="text-2xl">1. Register & Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Create your account and complete the grant screening form with your startup details.</p>
              </CardContent>
            </Card>

            <Card className="card text-center" data-testid="step-2-card">
              <CardHeader>
                <div className="w-16 h-16 bg-[#f46d19]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-[#f46d19]" />
                </div>
                <CardTitle className="text-2xl">2. AI Matching</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Our AI analyzes your profile against thousands of grants to find perfect matches.</p>
              </CardContent>
            </Card>

            <Card className="card text-center" data-testid="step-3-card">
              <CardHeader>
                <div className="w-16 h-16 bg-[#ef3e25]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-[#ef3e25]" />
                </div>
                <CardTitle className="text-2xl">3. Apply & Win</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Review your matches, get expert help, and apply to secure funding for your startup.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section px-6" data-testid="features-section">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Why Choose MyProBuddy?</h2>
            <p className="text-lg text-gray-600">Powerful features to accelerate your funding journey</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <Card key={idx} className="card text-center" data-testid={`feature-card-${idx}`}>
                <CardHeader>
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section bg-gray-50 px-6" data-testid="pricing-section">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Choose Your Plan</h2>
            <p className="text-lg text-gray-600">Start free, upgrade anytime with coupon codes</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, idx) => (
              <Card 
                key={idx} 
                className={`card ${plan.highlighted ? 'ring-2 ring-[#5d248f] shadow-2xl' : ''}`}
                data-testid={`pricing-card-${idx}`}
              >
                <CardHeader>
                  {plan.highlighted && (
                    <div className="bg-[#5d248f] text-white text-sm font-semibold px-4 py-1 rounded-full w-fit mx-auto mb-4">
                      Most Popular
                    </div>
                  )}
                  <CardTitle className="text-3xl text-center">{plan.name}</CardTitle>
                  <div className="text-4xl font-bold text-center mt-4 text-[#5d248f]">{plan.price}</div>
                  {plan.coupon && (
                    <div className="text-center mt-2 text-sm text-gray-600">
                      Use code: <span className="font-mono font-semibold text-[#f46d19]">{plan.coupon}</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, fidx) => (
                      <li key={fidx} className="flex items-start">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full ${plan.highlighted ? 'bg-[#5d248f] hover:bg-[#4a1d73]' : 'bg-gray-800 hover:bg-gray-900'}`}
                    onClick={() => navigate('/register')}
                    data-testid={`plan-cta-${idx}`}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section px-6" data-testid="testimonials-section">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Success Stories</h2>
            <p className="text-lg text-gray-600">Join hundreds of startups who found funding with MyProBuddy</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="card" data-testid={`testimonial-${idx}`}>
                <CardContent className="pt-6">
                  <p className="text-gray-700 mb-6 italic">"{testimonial.text}"</p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-[#5d248f]/10 rounded-full flex items-center justify-center mr-4">
                      <Users className="w-6 h-6 text-[#5d248f]" />
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.company}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Expert Consultation CTA */}
      <section className="section bg-gradient-to-br from-[#5d248f] to-[#4a1d73] text-white px-6" data-testid="expert-cta-section">
        <div className="container mx-auto max-w-4xl text-center">
          <Calendar className="w-16 h-16 mx-auto mb-6 opacity-90" />
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">Need Expert Help?</h2>
          <p className="text-lg mb-8 opacity-90">
            Our grant experts have helped secure over ₹50 crores in funding. 
            Book a consultation to maximize your success rate.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/register')} 
            className="bg-white text-[#5d248f] hover:bg-gray-100 text-lg px-8 py-6"
            data-testid="expert-consultation-btn"
          >
            Book Expert Consultation
          </Button>
        </div>
      </section>

      {/* FAQ */}
      <section className="section px-6" data-testid="faq-section">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-6">
            <Card className="card">
              <CardHeader>
                <CardTitle>How does AI matching work?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Our GPT-4 powered engine analyzes your startup profile including industry, stage, revenue, and demographics to match you with the most relevant grants from our database of 200+ opportunities.</p>
              </CardContent>
            </Card>

            <Card className="card">
              <CardHeader>
                <CardTitle>What are soft approvals?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Soft approvals indicate grants where our system has pre-screened your eligibility based on initial criteria. This increases your chances of success and saves application time.</p>
              </CardContent>
            </Card>

            <Card className="card">
              <CardHeader>
                <CardTitle>How do I upgrade my tier?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Simply use the coupon codes GRANT199 for Premium tier or EXPERT30K for Expert tier in your dashboard. Your account will be upgraded instantly.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6" data-testid="footer">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img 
                  src="/myprobuddy-logo.png" 
                  alt="MyProBuddy Logo" 
                  className="w-8 h-8 object-contain"
                />
                <h3 className="text-xl font-bold text-white font-poppins">MyProBuddy</h3>
              </div>
              <p className="text-gray-400">AI-powered grant matching for startups</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="#how-it-works" className="hover:text-white">How It Works</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#about" className="hover:text-white">About Us</a></li>
                <li><a href="#contact" className="hover:text-white">Contact</a></li>
                <li><a href="#careers" className="hover:text-white">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#privacy" className="hover:text-white">Privacy Policy</a></li>
                <li><a href="#terms" className="hover:text-white">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 MyProBuddy. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
