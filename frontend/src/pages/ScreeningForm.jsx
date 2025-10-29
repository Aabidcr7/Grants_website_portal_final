import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Award, ArrowLeft, ArrowRight, CheckCircle, Sparkles, Target, Gauge } from 'lucide-react';
import { Progress } from '../components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

const ScreeningForm = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressSteps = [
    { pct: 5, text: 'Packaging your responses securely...' },
    { pct: 20, text: 'Analyzing your startup profile with AI...' },
    { pct: 40, text: 'Matching with the most relevant grants...' },
    { pct: 65, text: 'Scoring eligibility and impact fit...' },
    { pct: 85, text: 'Curating your top grant shortlist...' },
    { pct: 95, text: 'Preparing your dashboard...' }
  ];
  const [progressText, setProgressText] = useState(progressSteps[0].text);
  const [totalGrantsBase] = useState(453);
  const [totalGrantsAvailable, setTotalGrantsAvailable] = useState(453);
  const [selectionCount, setSelectionCount] = useState(0);
  const [animateCount, setAnimateCount] = useState(false);

  // Page 1 data - Basic Information
  const [page1Data, setPage1Data] = useState({
    startup_name: '',
    founder_name: '',
    entity_type: '',
    location: '',
    year_of_incorporation: ''
  });

  // Page 2 data - Industry & Details
  const [page2Data, setPage2Data] = useState({
    industry: '',
    industry_other: '',
    company_size: 1,
    description: '',
    contact_email: '',
    contact_phone: '',
    ownership_type: '',
    funding_need: 0
  });

  // Page 3 data - Financial & Eligibility
  const [page3Data, setPage3Data] = useState({
    stage: '',
    revenue: 0,
    stability: '',
    demographic: '',
    track_record: '',
    past_grant_experience: 'No',
    past_grant_description: ''
  });

  // Ownership type options
  const ownershipTypeOptions = [
    { value: 'Sole Proprietor', label: 'Sole Proprietor' },
    { value: 'Partnership', label: 'Partnership' },
    { value: 'Private Limited', label: 'Private Limited' },
    { value: 'Public Limited', label: 'Public Limited' },
    { value: 'LLP', label: 'LLP (Limited Liability Partnership)' },
    { value: 'MSME', label: 'MSME' }
  ];

  // Dynamic grant availability reduction logic
  const recomputeTotalGrants = () => {
    let total = totalGrantsBase;
    // Build ordered units to apply stepwise decrements (ensures dynamic but smooth flow)
    const units = [];
    // 1) Year (1 unit, +1 if age > 10)
    if (page1Data.year_of_incorporation && !isNaN(parseInt(page1Data.year_of_incorporation))) {
      units.push('year');
      const age = new Date().getFullYear() - parseInt(page1Data.year_of_incorporation);
      if (age > 10) units.push('year2');
    }
    // 2) Industry (1 unit)
    if (page2Data.industry) units.push('industry');
    // 3) Description richness (up to 3 units as length grows)
    const dlen = (page2Data.description || '').trim().length;
    if (dlen > 0) units.push('desc');
    if (dlen > 200) units.push('desc2');
    // 4) Ownership - single selected option
    if (page2Data.ownership_type) {
      units.push(`own:${page2Data.ownership_type}`);
    }
    // 5) Funding need - bucketed into up to 3 units
    const fn = Number(page2Data.funding_need) || 0;
    if (fn > 0) units.push('fund');
    if (fn >= 20000000) units.push('fund2');
    if (fn >= 60000000) units.push('fund3');
    // 6) Stage (1 unit)
    if (page3Data.stage) units.push('stage');
    // 7) Revenue - up to 3 units
    const rev = Number(page3Data.revenue) || 0;
    if (rev > 0) units.push('rev');
    if (rev >= 20000000) units.push('rev2');
    if (rev >= 60000000) units.push('rev3');
    // 8) Stability (1 unit)
    if (page3Data.stability) units.push('stab');
    // 9) Demographic (1 unit)
    if (page3Data.demographic) units.push('demo');
    // 10) Past grant (1 unit)
    if (page3Data.past_grant_experience === 'Yes') units.push('past');

    // Apply decreasing step series with slight jitter to feel organic
    const steps = [100, 90, 80, 70, 60, 55, 50, 45, 40, 38, 35, 32, 30, 28, 26, 24, 22, 20, 18, 15, 12, 10, 8, 6, 5];
    units.forEach((u, idx) => {
      if (idx < steps.length) {
        const jitter = Math.round((Math.random() - 0.5) * 6); // -3..+3
        let base = Math.max(1, steps[idx] + jitter);
        // Per-unit damping to avoid huge drops (esp. description)
        let factor = 1;
        if (typeof u === 'string') {
          if (u === 'desc') factor = 0.2;                       // description base very soft
          else if (u === 'desc2') factor = 0.25;                // richer desc still soft
          else if (u.startsWith('own:')) factor = 0.8;          // ownership moderate
          else if (u === 'fund') factor = 0.35;                 // funding base (softer)
          else if (u === 'fund2') factor = 0.45;                // bigger funding (softer)
          else if (u === 'fund3') factor = 0.5;                 // largest funding (softer)
          else if (u === 'rev') factor = 0.5;                   // revenue base
          else if (u === 'rev2') factor = 0.7;                  // higher revenue
          else if (u === 'rev3') factor = 0.8;                  // highest revenue
          else if (u === 'year') factor = 0.8;                  // year effect
          else if (u === 'year2') factor = 0.9;                 // older than 10 years
          else if (u === 'stab') factor = 0.6;                  // stability
          else if (u === 'demo') factor = 0.6;                  // demographic
          else if (u === 'past') factor = 0.7;                  // past grants
          else factor = 1;                                      // industry, stage keep base
        }
        const dec = Math.max(1, Math.round(base * factor));
        total -= dec;
      } else {
        total -= 4; // small tail reduction for very long unit lists
      }
    });

    const count = units.length;
    setSelectionCount(count);

    // Only enforce final window at the end, do not cap early
    if (count === 0) {
      total = totalGrantsBase;
    } else {
      // Keep within [0, base] during refinement
      total = Math.max(0, Math.min(total, totalGrantsBase));
      // Staged final mapping so Funding Need alone doesn't force 41
      if (count === 6) {
        // Early final: dynamic band 41–90 (pre-submit can vary)
        const minWindow = 41;
        const maxWindow = 90;
        const reduced = totalGrantsBase - total;
        const normDen = Math.max(1, (totalGrantsBase - 200));
        const severity = Math.max(0, Math.min(1, reduced / normDen));
        let mapped = maxWindow - severity * (maxWindow - minWindow);
        // Add small jitter influenced by revenue/funding for variety
        const jitter = ((Number(page3Data.revenue)||0) + (Number(page2Data.funding_need)||0)) % 7 - 3; // -3..+3
        mapped += jitter;
        total = Math.round(Math.max(minWindow, Math.min(maxWindow, mapped)));
      } else if (count === 7) {
        // Mid final: 45–92 (allow wider variety pre-submit)
        const minWindow = 45;
        const maxWindow = 92;
        const reduced = totalGrantsBase - total;
        const normDen = Math.max(1, (totalGrantsBase - 200));
        // Quality score to bias upward for strong profiles
        let qualityScore = 0;
        if (page3Data.stage === 'Growth/Scale-up' || page3Data.stage === 'Established') qualityScore += 1;
        if (page3Data.stability === 'Good') qualityScore += 1;
        if (page3Data.stability === 'Excellent') qualityScore += 2;
        if (page3Data.demographic === 'General' || page3Data.demographic === 'Youth-owned') qualityScore += 1;
        if (page3Data.past_grant_experience === 'No') qualityScore += 1;
        const severityBase = Math.max(0, Math.min(1, reduced / normDen));
        const severity = Math.max(0, Math.min(1, severityBase - 0.04 * qualityScore));
        let mapped = maxWindow - severity * (maxWindow - minWindow);
        // Jitter based on revenue/funding slider positions
        const jitter = (((Number(page3Data.revenue)||0) / 1000000) + ((Number(page2Data.funding_need)||0) / 1000000)) % 5 - 2; // ~-2..+2
        mapped += jitter;
        total = Math.round(Math.max(minWindow, Math.min(maxWindow, mapped)));
      } else if (count >= 8) {
        // Final pre-submit window: 41–95 (highly dynamic)
        const minWindow = 41;
        const maxWindow = 95;
        const reduced = totalGrantsBase - total; // how much reduced from base
        // Normalize severity against a reasonable span
        const normDen = Math.max(1, (totalGrantsBase - 200));
        // Include quality score to allow increases within final band as quality improves
        let qualityScore = 0;
        if (page3Data.stage === 'Growth/Scale-up' || page3Data.stage === 'Established') qualityScore += 1;
        if (page3Data.stability === 'Good') qualityScore += 1;
        if (page3Data.stability === 'Excellent') qualityScore += 2;
        if (page3Data.demographic === 'General' || page3Data.demographic === 'Youth-owned') qualityScore += 1;
        if (page3Data.past_grant_experience === 'No') qualityScore += 1;
        const severityBase = Math.max(0, Math.min(1, reduced / normDen));
        const severity = Math.max(0, Math.min(1, severityBase - 0.04 * qualityScore));
        let mapped = maxWindow - severity * (maxWindow - minWindow);
        // Jitter using both sliders and selection count for organic feel
        const jitterSeed = (((Number(page3Data.revenue)||0) / 5000000) + ((Number(page2Data.funding_need)||0) / 5000000) + count) % 7 - 3; // -3..+3
        mapped += jitterSeed;
        total = Math.round(Math.max(minWindow, Math.min(maxWindow, mapped)));
      }
    }

    const newTotal = Math.round(total);
    setTotalGrantsAvailable(newTotal);
    if (count > 0 && newTotal !== totalGrantsAvailable) {
      setAnimateCount(true);
      setTimeout(() => setAnimateCount(false), 250);
    }
  };

  useEffect(() => {
    recomputeTotalGrants();
  }, [page1Data.year_of_incorporation, page2Data.industry, page2Data.description, page2Data.ownership_type, page2Data.funding_need, page3Data.stage, page3Data.revenue, page3Data.stability, page3Data.demographic, page3Data.past_grant_experience]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  // Smooth simulated progress while backend processes
  useEffect(() => {
    if (!showProgress) return;
    let pct = 0;
    const interval = setInterval(() => {
      pct = Math.min(pct + Math.random() * 6 + 2, 95);
      setProgress(pct);
      // update step text
      const step = [...progressSteps].reverse().find(s => pct >= s.pct);
      if (step) setProgressText(step.text);
    }, 350);
    return () => clearInterval(interval);
  }, [showProgress]);

  const handlePage1Next = (e) => {
    e.preventDefault();
    setCurrentPage(2);
  };

  const handlePage2Next = (e) => {
    e.preventDefault();
    setCurrentPage(3);
  };

  const handlePage2Back = () => {
    setCurrentPage(1);
  };

  const handlePage3Back = () => {
    setCurrentPage(2);
  };

  const handlePage3Submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setShowProgress(true);
    setProgress(3);

    try {
      const token = localStorage.getItem('token');
      
      const payload = {
        ...page1Data,
        ...page2Data,
        ...page3Data,
        company_size: parseInt(page2Data.company_size),
        revenue: parseFloat(page3Data.revenue),
        track_record: parseInt(page3Data.track_record)
      };

      await axios.post(
        `${API}/screening/submit`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('Profile submitted! Finding your grant matches...');
      // Finish progress and navigate
      setProgressText('Finalizing results and redirecting...');
      const finish = () => {
        setProgress(100);
        setTimeout(() => navigate('/dashboard'), 900);
      };
      setTimeout(finish, 900);
      
      // Update local storage
      const user = JSON.parse(localStorage.getItem('user'));
      user.has_completed_screening = true;
      localStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Submission failed');
      setShowProgress(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-6">
      <div className="container mx-auto max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[#5d248f]/10 rounded-full flex items-center justify-center">
              <Award className="w-8 h-8 text-[#5d248f]" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2">Grant Screening Form</h1>
          <p className="text-gray-600">Help us find the perfect grants for your startup</p>
        </div>

        {/* Total Grants Available Banner */}
        <div className="mb-8">
          <Card className="relative overflow-hidden border-0 shadow-2xl ring-1 ring-white/20" style={{background: 'linear-gradient(135deg, #5d248f 0%, #4a1d73 100%)'}}>
            {/* Decorative gradients */}
            <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full blur-3xl opacity-40" style={{background:'radial-gradient(circle at center, #a78bfa 0%, transparent 60%)'}} />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full blur-3xl opacity-30" style={{background:'radial-gradient(circle at center, #60a5fa 0%, transparent 60%)'}} />
            <CardContent className="py-6 px-6 text-white relative">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-yellow-200" />
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/15 border border-white/25">Live AI Preview</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm opacity-90">
                    <Target className="w-4 h-4" />
                    <span>Total Grants Available</span>
                  </div>
                  <div className={`mt-1 text-5xl font-extrabold tracking-tight drop-shadow-sm leading-none transition-transform duration-300 ${animateCount ? 'scale-110' : 'scale-100'}`}>{totalGrantsAvailable}</div>
                  <div className="mt-2 flex gap-2">
                    <span className="text-[11px] px-2 py-1 rounded-full bg-white/10 border border-white/20">
                      Refined {Math.max(0, Math.min(100, Math.round((1 - (totalGrantsAvailable/totalGrantsBase)) * 100)))}%
                    </span>
                    <span className="text-[11px] px-2 py-1 rounded-full bg-white/10 border border-white/20">
                      Answered {selectionCount} fields
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-flex items-center gap-1 text-xs text-white/80">
                    <Gauge className="w-4 h-4" />
                    <span>Match quality</span>
                  </div>
                  <div className="mt-1 text-sm font-semibold">
                    {selectionCount < 3 && <span className="text-white/80">Exploring</span>}
                    {selectionCount >= 3 && selectionCount < 6 && <span className="text-white">Focused</span>}
                    {selectionCount >= 6 && <span className="text-green-200">Highly Targeted</span>}
                  </div>
                </div>
              </div>

              {/* Enhanced progress bar */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-blue-400"></div>
                    <span className="text-sm font-medium text-white/90">Grant Targeting</span>
                  </div>
                  <div className="text-sm font-semibold text-white">
                    {totalGrantsAvailable.toLocaleString()} grants
                  </div>
                </div>
                
                <div className="relative">
                  {/* Background track */}
                  <div className="h-4 w-full rounded-full bg-gradient-to-r from-slate-700/50 to-slate-600/50 border border-slate-600/30 overflow-hidden">
                    {/* Progress fill with improved gradient */}
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
                      style={{
                        width: `${Math.max(3, (totalGrantsAvailable / totalGrantsBase) * 100)}%`,
                        background: 'linear-gradient(90deg, #10b981 0%, #3b82f6 50%, #8b5cf6 100%)',
                        boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)'
                      }}
                    >
                      {/* Animated shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                    </div>
                  </div>
                  
                  {/* Progress indicator dot */}
                  <div
                    className="absolute -top-1 h-6 w-6 rounded-full bg-white shadow-xl border-2 border-blue-400 flex items-center justify-center transition-all duration-700 ease-out"
                    style={{ 
                      left: `calc(${Math.max(3, (totalGrantsAvailable / totalGrantsBase) * 100)}% - 12px)`,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3), 0 0 0 4px rgba(59, 130, 246, 0.2)'
                    }}
                  >
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                  </div>
                </div>
                
                {/* Labels */}
                <div className="flex justify-between text-xs text-white/70 mt-3">
                  <span className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                    <span>Broader Scope</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                    <span>Highly Targeted</span>
                  </span>
                </div>
              </div>

              {/* Dynamic encouragement */}
              <div className="mt-4 text-sm text-white/90">
                {selectionCount < 3 && (
                  <span>Great start! Keep answering to reveal the most relevant funding opportunities.</span>
                )}
                {selectionCount >= 3 && selectionCount < 6 && (
                  <span>Nice! Your inputs are sharpening the grant shortlist—just a few more details.</span>
                )}
                {selectionCount >= 6 && (
                  <span>Awesome! You’re now seeing a highly curated grant set tailored to your profile.</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-2 sm:space-x-4">
            <div className={`flex items-center ${currentPage === 1 ? 'text-[#5d248f]' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                currentPage === 1 ? 'bg-[#5d248f] text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Basic Info</span>
            </div>
            <div className="w-12 sm:w-20 h-1 bg-gray-300"></div>
            <div className={`flex items-center ${currentPage === 2 ? 'text-[#5d248f]' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                currentPage === 2 ? 'bg-[#5d248f] text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Details</span>
            </div>
            <div className="w-12 sm:w-20 h-1 bg-gray-300"></div>
            <div className={`flex items-center ${currentPage === 3 ? 'text-[#5d248f]' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                currentPage === 3 ? 'bg-[#5d248f] text-white' : 'bg-gray-200'
              }`}>
                3
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Eligibility</span>
            </div>
          </div>
        </div>

        <Card className="shadow-2xl rounded-2xl bg-white/70 backdrop-blur-xl ring-1 ring-gray-200/40" data-testid="screening-form-card">
          <CardHeader>
            <CardTitle className="text-2xl">
              {currentPage === 1 && (
                <span className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#5d248f]" /> Startup Basic Information
                </span>
              )}
              {currentPage === 2 && (
                <span className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#5d248f]" /> Industry & Company Details
                </span>
              )}
              {currentPage === 3 && (
                <span className="flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-[#5d248f]" /> Financial & Eligibility Information
                </span>
              )}
            </CardTitle>
            <CardDescription>
              {currentPage === 1 && 'Tell us about your company'}
              {currentPage === 2 && 'Share your industry, contact info and funding needs'}
              {currentPage === 3 && 'Share your startup\'s stage and financial details'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Page 1 */}
            {currentPage === 1 && (
              <form onSubmit={handlePage1Next} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="startup_name">Startup Name *</Label>
                    <Input
                      id="startup_name"
                      required
                      value={page1Data.startup_name}
                      onChange={(e) => setPage1Data({ ...page1Data, startup_name: e.target.value })}
                      data-testid="startup-name-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="founder_name">Founder Name *</Label>
                    <Input
                      id="founder_name"
                      required
                      value={page1Data.founder_name}
                      onChange={(e) => setPage1Data({ ...page1Data, founder_name: e.target.value })}
                      data-testid="founder-name-input"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Entity Type *</Label>
                    <RadioGroup
                      value={page1Data.entity_type}
                      onValueChange={(value) => setPage1Data({ ...page1Data, entity_type: value })}
                    >
                      {['For-profit','Non-profit','Academic','Individual'].map(opt => (
                        <div key={opt} className="flex items-center space-x-2">
                          <RadioGroupItem value={opt} id={`entity-${opt}`} />
                          <Label htmlFor={`entity-${opt}`} className="font-normal cursor-pointer">{opt}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Headquarters / Location *</Label>
                    <Input
                      id="location"
                      required
                      placeholder="e.g., Bangalore, India"
                      value={page1Data.location}
                      onChange={(e) => setPage1Data({ ...page1Data, location: e.target.value })}
                      data-testid="location-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year_of_incorporation">Year of Incorporation *</Label>
                  <Input
                    id="year_of_incorporation"
                    type="number"
                    required
                    min="1800"
                    max={new Date().getFullYear()}
                    placeholder="e.g., 2020"
                    value={page1Data.year_of_incorporation}
                    onChange={(e) => setPage1Data({ ...page1Data, year_of_incorporation: e.target.value })}
                    data-testid="year-incorporation-input"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-[#5d248f] to-[#4a1d73] hover:opacity-90 shadow-md"
                    data-testid="page1-next-btn"
                  >
                    Next <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </form>
            )}

            {/* Page 2 */}
            {currentPage === 2 && (
              <form onSubmit={handlePage2Next} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry / Sector *</Label>
                    <Select
                      value={page2Data.industry}
                      onValueChange={(value) => setPage2Data({ ...page2Data, industry: value })}
                      required
                    >
                      <SelectTrigger data-testid="industry-select">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Information Technology (IT)">Information Technology (IT)</SelectItem>
                        <SelectItem value="Artificial Intelligence (AI) / Machine Learning">Artificial Intelligence (AI) / Machine Learning</SelectItem>
                        <SelectItem value="Agriculture">Agriculture</SelectItem>
                        <SelectItem value="AgriTech">AgriTech</SelectItem>
                        <SelectItem value="Biotech / Life Sciences">Biotech / Life Sciences</SelectItem>
                        <SelectItem value="Healthcare">Healthcare</SelectItem>
                        <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="Fintech">Fintech</SelectItem>
                        <SelectItem value="EdTech">EdTech</SelectItem>
                        <SelectItem value="CleanTech / Renewable Energy">CleanTech / Renewable Energy</SelectItem>
                        <SelectItem value="E-commerce">E-commerce</SelectItem>
                        <SelectItem value="Social Enterprise">Social Enterprise</SelectItem>
                        <SelectItem value="Transportation / Logistics">Transportation / Logistics</SelectItem>
                        <SelectItem value="Real Estate / Construction">Real Estate / Construction</SelectItem>
                        <SelectItem value="Food & Beverages / FoodTech">Food & Beverages / FoodTech</SelectItem>
                        <SelectItem value="Media / Entertainment">Media / Entertainment</SelectItem>
                        <SelectItem value="Tourism / Hospitality">Tourism / Hospitality</SelectItem>
                        <SelectItem value="Fashion / Lifestyle">Fashion / Lifestyle</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company_size">Company Size (Employees) *</Label>
                    <input
                      id="company_size"
                      type="range"
                      min="1"
                      max="1000"
                      value={page2Data.company_size}
                      onChange={(e) => setPage2Data({ ...page2Data, company_size: parseInt(e.target.value) })}
                      className="w-full"
                      style={{ accentColor: '#5d248f' }}
                    />
                    <div className="text-xs text-gray-600">{page2Data.company_size} employees</div>
                  </div>
                </div>

                {page2Data.industry === 'Other' && (
                  <div className="space-y-2">
                    <Label htmlFor="industry_other">Please Specify Industry *</Label>
                    <Input
                      id="industry_other"
                      required
                      placeholder="Enter your industry"
                      value={page2Data.industry_other}
                      onChange={(e) => setPage2Data({ ...page2Data, industry_other: e.target.value })}
                      data-testid="industry-other-input"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="description">Company Description *</Label>
                  <Textarea
                    id="description"
                    required
                    rows={4}
                    placeholder="Brief description of your startup and what you do"
                    value={page2Data.description}
                    onChange={(e) => setPage2Data({ ...page2Data, description: e.target.value })}
                    data-testid="description-input"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Contact Email *</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      required
                      value={page2Data.contact_email}
                      onChange={(e) => setPage2Data({ ...page2Data, contact_email: e.target.value })}
                      data-testid="contact-email-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Contact Phone *</Label>
                    <Input
                      id="contact_phone"
                      type="tel"
                      required
                      placeholder="+91 XXXXX XXXXX"
                      value={page2Data.contact_phone}
                      onChange={(e) => setPage2Data({ ...page2Data, contact_phone: e.target.value })}
                      data-testid="contact-phone-input"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Ownership Type *</Label>
                    <RadioGroup
                      value={page2Data.ownership_type}
                      onValueChange={(value) => setPage2Data({ ...page2Data, ownership_type: value })}
                      data-testid="ownership-type-radio"
                    >
                      {ownershipTypeOptions.map(option => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.value} id={`ownership-${option.value}`} />
                          <Label htmlFor={`ownership-${option.value}`} className="font-normal cursor-pointer">{option.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="funding_need">Funding Need ($) *</Label>
                    <input
                      id="funding_need"
                      type="range"
                      min="0"
                      max="100000000"
                      step="10000"
                      value={page2Data.funding_need}
                      onChange={(e) => setPage2Data({ ...page2Data, funding_need: parseInt(e.target.value) })}
                      className="w-full"
                      style={{ accentColor: '#5d248f' }}
                      data-testid="funding-need-input"
                    />
                    <div className="text-xs text-gray-600">${Number(page2Data.funding_need).toLocaleString('en-US')}</div>
                  </div>
                </div>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePage2Back}
                    data-testid="page2-back-btn"
                  >
                    <ArrowLeft className="mr-2 w-4 h-4" /> Back
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-[#5d248f] to-[#4a1d73] hover:opacity-90 shadow-md"
                    data-testid="page2-next-btn"
                  >
                    Next <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </form>
            )}

            {/* Page 3 */}
            {currentPage === 3 && (
              <form onSubmit={handlePage3Submit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Stage of Startup *</Label>
                    <RadioGroup
                      value={page3Data.stage}
                      onValueChange={(value) => setPage3Data({ ...page3Data, stage: value })}
                    >
                      {['Ideation','Start-up','Growth/Scale-up','Established'].map(opt => (
                        <div key={opt} className="flex items-center space-x-2">
                          <RadioGroupItem value={opt} id={`stage-${opt}`} />
                          <Label htmlFor={`stage-${opt}`} className="font-normal cursor-pointer">{opt}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="revenue">Annual Revenue (USD) *</Label>
                    <input
                      id="revenue"
                      type="range"
                      min="0"
                      max="100000000"
                      step="10000"
                      value={page3Data.revenue}
                      onChange={(e) => setPage3Data({ ...page3Data, revenue: parseInt(e.target.value) })}
                      className="w-full"
                      style={{ accentColor: '#5d248f' }}
                    />
                    <div className="text-xs text-gray-600">${Number(page3Data.revenue).toLocaleString('en-US')}</div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Financial Stability *</Label>
                    <RadioGroup
                      value={page3Data.stability}
                      onValueChange={(value) => setPage3Data({ ...page3Data, stability: value })}
                    >
                      {['Poor','Average','Good','Excellent'].map(opt => (
                        <div key={opt} className="flex items-center space-x-2">
                          <RadioGroupItem value={opt} id={`stability-${opt}`} />
                          <Label htmlFor={`stability-${opt}`} className="font-normal cursor-pointer">{opt}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-2">
                    <Label>Demographic Ownership *</Label>
                    <RadioGroup
                      value={page3Data.demographic}
                      onValueChange={(value) => setPage3Data({ ...page3Data, demographic: value })}
                    >
                      {['Woman-owned','Minority-owned','Youth-owned','Veteran-owned','General'].map(opt => (
                        <div key={opt} className="flex items-center space-x-2">
                          <RadioGroupItem value={opt} id={`demo-${opt}`} />
                          <Label htmlFor={`demo-${opt}`} className="font-normal cursor-pointer">{opt}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="track_record">Track Record (Previous Projects) *</Label>
                  <Input
                    id="track_record"
                    type="number"
                    required
                    min="0"
                    placeholder="Number of completed projects"
                    value={page3Data.track_record}
                    onChange={(e) => setPage3Data({ ...page3Data, track_record: e.target.value })}
                    data-testid="track-record-input"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Past Grant Experience *</Label>
                  <RadioGroup
                    value={page3Data.past_grant_experience}
                    onValueChange={(value) => setPage3Data({ ...page3Data, past_grant_experience: value })}
                    data-testid="past-grant-radio"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Yes" id="grant-yes" />
                      <Label htmlFor="grant-yes" className="font-normal cursor-pointer">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="No" id="grant-no" />
                      <Label htmlFor="grant-no" className="font-normal cursor-pointer">No</Label>
                    </div>
                  </RadioGroup>
                </div>

                {page3Data.past_grant_experience === 'Yes' && (
                  <div className="space-y-2">
                    <Label htmlFor="past_grant_description">Describe Your Past Grant Experience</Label>
                    <Textarea
                      id="past_grant_description"
                      rows={3}
                      placeholder="Tell us about previous grants you've received"
                      value={page3Data.past_grant_description}
                      onChange={(e) => setPage3Data({ ...page3Data, past_grant_description: e.target.value })}
                      data-testid="past-grant-desc-input"
                    />
                  </div>
                )}

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handlePage3Back}
                    data-testid="page3-back-btn"
                  >
                    <ArrowLeft className="mr-2 w-4 h-4" /> Back
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-[#5d248f] to-[#4a1d73] hover:opacity-90 shadow-md"
                    disabled={loading}
                    data-testid="page3-submit-btn"
                  >
                    {loading ? 'Submitting...' : (
                      <>
                        Submit & Find Grants <CheckCircle className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Post-submit Progress Modal */}
      <Dialog open={showProgress}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Finding Your Best Grant Matches</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-700">{progressText}</div>
            <Progress value={progress} />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{Math.round(progress)}%</span>
              <span>AI Matching in progress</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScreeningForm;
