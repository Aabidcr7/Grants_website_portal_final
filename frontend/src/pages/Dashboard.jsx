import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Award, LogOut, Crown, Sparkles, ExternalLink, Calendar, BadgeCheck, Gift, TrendingUp, DollarSign, FileText, Search, Bell, Download, Users, Target, BarChart3, Clock, CheckCircle2, Zap, MessageSquare, Video, XCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import VentureAnalystDashboard from './VentureAnalystDashboard';
import AdminDashboard from './AdminDashboard';
import IncubationAdminDashboard from './IncubationAdminDashboard';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    // Admin, incubation admin, and venture analysts don't need to complete screening
    const adminTiers = ['admin', 'incubation_admin', 'venture_analyst'];
    if (!parsedUser.has_completed_screening && !adminTiers.includes(parsedUser.tier)) {
      navigate('/screening');
      return;
    }

    setUser(parsedUser);
    fetchGrants(token, parsedUser);
  }, [navigate]);

  const fetchGrants = async (token, userData = user) => {
    try {
      // Admin and incubation admin handle their own data, skip grant fetching
      if (userData?.tier === 'admin' || userData?.tier === 'incubation_admin') {
        setLoading(false);
        return;
      }
      
      // Venture analysts get all grants, others get matched grants
      const endpoint = userData?.tier === 'venture_analyst' ? '/grants/all' : '/grants/matches';
      const response = await axios.get(`${API}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (userData?.tier === 'venture_analyst') {
        // For venture analysts, extract grants from response.data.grants
        const grantsData = response.data.grants || [];
        setGrants(grantsData);
      } else {
        setGrants(response.data.grants || []);
      }
    } catch (error) {
      toast.error('Failed to load grants');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleCouponSubmit = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/coupon/validate`,
        { code: couponCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(response.data.message);
      
      const updatedUser = { ...user, tier: response.data.tier };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      fetchGrants(token);
      setCouponCode('');
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadAllPDF = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to download PDF');
        return;
      }

      setIsDownloading(true);
      toast.success('Generating professional PDF report...', {
        description: 'Creating landscape-format report with enhanced design'
      });
      
      const response = await axios.get(`${API}/grants/download-pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'grant_matches.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF Report Downloaded! 🎉', {
        description: 'Your professional grant matches report is ready'
      });
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error('Download Failed', {
        description: 'Unable to generate PDF. Please try again or contact support.'
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const filteredGrants = (grants || []).filter(grant => 
    grant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    grant.sector?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#5d248f] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your grants...</p>
        </div>
      </div>
    );
  }

  // Render different dashboard based on tier
  if (user?.tier === 'admin') {
    return <AdminDashboard user={user} handleLogout={handleLogout} />;
  } else if (user?.tier === 'incubation_admin') {
    return <IncubationAdminDashboard user={user} handleLogout={handleLogout} />;
  } else if (user?.tier === 'venture_analyst') {
    return <VentureAnalystDashboard user={user} handleLogout={handleLogout} />;
  } else if (user?.tier === 'free') {
    return <FreeTierDashboard user={user} grants={filteredGrants} searchTerm={searchTerm} setSearchTerm={setSearchTerm} handleLogout={handleLogout} handleCouponSubmit={handleCouponSubmit} couponCode={couponCode} setCouponCode={setCouponCode} couponLoading={couponLoading} />;
  } else if (user?.tier === 'premium') {
    return <PremiumTierDashboard user={user} grants={filteredGrants} searchTerm={searchTerm} setSearchTerm={setSearchTerm} handleLogout={handleLogout} handleCouponSubmit={handleCouponSubmit} couponCode={couponCode} setCouponCode={setCouponCode} couponLoading={couponLoading} handleDownloadAllPDF={handleDownloadAllPDF} isDownloading={isDownloading} />;
  } else if (user?.tier === 'expert') {
    return <ExpertTierDashboard user={user} grants={filteredGrants} searchTerm={searchTerm} setSearchTerm={setSearchTerm} handleLogout={handleLogout} handleDownloadAllPDF={handleDownloadAllPDF} isDownloading={isDownloading} />;
  }

  return null;
};

// FREE TIER DASHBOARD
const FreeTierDashboard = ({ user, grants, searchTerm, setSearchTerm, handleLogout, handleCouponSubmit, couponCode, setCouponCode, couponLoading }) => {
  const [trackingData, setTrackingData] = useState([]);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // Load tracking data for free tier startup
  const loadTrackingData = async () => {
    try {
      setTrackingLoading(true);
      const token = localStorage.getItem('token');
      
      // Get the current user's startup data directly
      const startupResponse = await axios.get(`${API}/startups/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!startupResponse.data || !startupResponse.data.ID) {
        console.log('📊 No startup found for this free tier user');
        setTrackingData([]);
        return;
      }
      
      const startupId = startupResponse.data.ID;
      console.log('📊 Free Tier - Loading tracking for startup ID:', startupId);
      
      // Get tracking data for this startup from grant_tracking.csv
      const trackingResponse = await axios.get(`${API}/tracking/expert/${startupId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const trackingList = trackingResponse.data.tracking || [];
      console.log('📊 Free Tier - Loaded tracking data:', trackingList.length, 'entries');
      setTrackingData(trackingList);
    } catch (error) {
      console.error('❌ Free Tier - Error loading tracking data:', error);
      setTrackingData([]);
    } finally {
      setTrackingLoading(false);
    }
  };

  useEffect(() => {
    loadTrackingData();
    
    // Auto-refresh tracking data every 10 seconds for real-time updates
    const refreshInterval = setInterval(() => {
      loadTrackingData();
    }, 10000);
    
    return () => clearInterval(refreshInterval);
  }, [user]);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="bg-gradient-to-r from-gray-50 to-gray-100 border-b shadow-sm" data-testid="dashboard-nav">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Award className="w-8 h-8 text-[#5d248f]" />
              <h1 className="text-2xl font-bold gradient-text">MyProBuddy</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge className="bg-gray-600 text-white flex items-center space-x-1 px-3 py-1" data-testid="tier-badge">
                <Gift className="w-4 h-4" />
                <span>Free</span>
              </Badge>
              <span className="text-gray-700 font-medium" data-testid="user-name">{user?.name}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="logout-btn">
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Welcome Message */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome, {user?.name}!</h2>
          <p className="text-gray-600">Here are your top 3 grant matches. Upgrade to see more!</p>
        </div>

        {/* Upgrade Banner */}
        <Card className="mb-8 bg-gradient-to-r from-[#5d248f] to-[#4a1d73] text-white border-none shadow-xl" data-testid="upgrade-banner">
          <CardContent className="py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start space-x-3 mb-4">
                  <Sparkles className="w-10 h-10" />
                  <h3 className="text-2xl font-bold">Unlock Your Full Potential</h3>
                </div>
                <p className="text-white/90 mb-4">You're viewing only 3 out of {(grants || []).length > 3 ? (grants || []).length : '10+'} matched grants!</p>
                <ul className="text-sm text-white/80 space-y-2">
                  <li className="flex items-center justify-center md:justify-start">
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Access to top 10 grants
                  </li>
                  <li className="flex items-center justify-center md:justify-start">
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Email notifications for new grants
                  </li>
                  <li className="flex items-center justify-center md:justify-start">
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Download all grants as PDF
                  </li>
                </ul>
              </div>
              <div className="flex-shrink-0">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="lg" className="bg-white text-[#5d248f] hover:bg-gray-100 font-semibold px-8" data-testid="upgrade-now-btn">
                      <Crown className="w-5 h-5 mr-2" /> Upgrade to Premium
                    </Button>
                  </DialogTrigger>
                  <DialogContent data-testid="upgrade-dialog">
                    <DialogHeader>
                      <DialogTitle className="text-2xl">Upgrade Your Tier</DialogTitle>
                      <DialogDescription>Enter coupon code to unlock premium features</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          data-testid="coupon-input"
                        />
                        <Button onClick={handleCouponSubmit} disabled={couponLoading} className="bg-[#5d248f] hover:bg-[#4a1d73]" data-testid="coupon-submit-btn">
                          {couponLoading ? 'Validating...' : 'Apply'}
                        </Button>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <p className="font-semibold text-gray-900">Available Coupons:</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-semibold text-[#f46d19]">GRANT199</span>
                            <span className="text-gray-600">Premium Tier (₹199)</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-semibold text-[#5d248f]">EXPERT30K</span>
                            <span className="text-gray-600">Expert Tier (₹30,000)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="card" data-testid="grants-found-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Visible Grants</p>
                  <p className="text-3xl font-bold text-[#5d248f] mt-1">3 / {(grants || []).length}</p>
                </div>
                <Target className="w-12 h-12 text-[#5d248f]/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="card" data-testid="soft-approvals-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Soft Approvals</p>
                  <p className="text-3xl font-bold text-[#f46d19] mt-1">
                    {grants.slice(0, 3).filter(g => g.soft_approval === 'Yes').length}
                  </p>
                </div>
                <BadgeCheck className="w-12 h-12 text-[#f46d19]/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="card bg-gradient-to-br from-[#f46d19] to-[#ef3e25] text-white shadow-lg border-0" data-testid="cta-card" style={{background: 'linear-gradient(135deg, #f46d19 0%, #ef3e25 100%)'}}>
            <CardContent className="pt-6">
              <div className="text-center">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-90" />
                <p className="text-sm mb-3 text-white">Need Expert Help?</p>
                <Button variant="secondary" size="sm" className="bg-white text-[#f46d19] hover:bg-gray-100 w-full" data-testid="expert-consult-btn">
                  Book Consultation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grants List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Your Top 3 Grant Matches</h2>
          
          {grants.slice(0, 3).map((grant, idx) => (
            <Card key={idx} className="card hover:shadow-lg transition-all border-l-4 border-l-[#5d248f]" data-testid={`grant-card-${idx}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <CardTitle className="text-xl">{grant.name}</CardTitle>
                      {grant.soft_approval === 'Yes' && (
                        <Badge className="bg-green-500 text-white flex items-center space-x-1" data-testid={`soft-approval-badge-${idx}`}>
                          <BadgeCheck className="w-3 h-3" />
                          <span>Soft Approval</span>
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-semibold text-[#5d248f]">{grant.funding_amount}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Due: {grant.deadline}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600 mb-1">Match</div>
                    <div className="text-2xl font-bold text-[#5d248f]">{Math.round(grant.relevance_score)}%</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Why This Matches:</p>
                    <p className="text-gray-600">{grant.reason}</p>
                  </div>
                  <Button size="sm" className="bg-[#5d248f] hover:bg-[#4a1d73]" onClick={() => window.open(grant.application_link, '_blank')} data-testid={`apply-btn-${idx}`}>
                    <ExternalLink className="w-4 h-4 mr-2" /> Apply Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Locked Grants Preview */}
          <Card className="card bg-gray-50 border-dashed border-2 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-100 flex items-center justify-center">
              <div className="text-center">
                <Crown className="w-16 h-16 text-[#5d248f] mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Unlock 10+ More Grants</h3>
                <p className="text-gray-600 mb-4">Upgrade to Premium to access all your matches</p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-[#5d248f] hover:bg-[#4a1d73]" data-testid="unlock-grants-btn">
                      Upgrade Now - ₹199
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upgrade to Premium</DialogTitle>
                      <DialogDescription>Use code <strong className="text-[#f46d19]">GRANT199</strong></DialogDescription>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <CardContent className="py-20 blur-sm">
              <p className="text-gray-400">More amazing grants waiting for you...</p>
            </CardContent>
          </Card>
        </div>

        {/* Grant Tracking Section */}
        {trackingData.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">📊 Grant Tracking by Venture Analysts</h2>
            <div className="space-y-6">
              {trackingData.map((tracking) => (
                <Card key={tracking.id} className="overflow-hidden border-l-4" style={{
                  borderLeftColor: 
                    tracking.status === 'Draft' ? '#3b82f6' :
                    tracking.status === 'Applied' ? '#eab308' :
                    tracking.status === 'Approved' ? '#22c55e' :
                    tracking.status === 'Disbursed' ? '#a855f7' :
                    '#ef4444'
                }}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          tracking.status === 'Draft' ? 'bg-gray-500' :
                          tracking.status === 'Applied' ? 'bg-blue-500' :
                          tracking.status === 'Approved' ? 'bg-green-500' :
                          tracking.status === 'Disbursed' ? 'bg-purple-500' :
                          'bg-red-500'
                        }`}>
                          {tracking.status === 'Draft' ? <FileText className="w-6 h-6 text-white" /> :
                           tracking.status === 'Applied' ? <Clock className="w-6 h-6 text-white" /> :
                           tracking.status === 'Approved' ? <CheckCircle2 className="w-6 h-6 text-white" /> :
                           tracking.status === 'Disbursed' ? <DollarSign className="w-6 h-6 text-white" /> :
                           <XCircle className="w-6 h-6 text-white" />}
                        </div>
                        <div>
                          <p className="font-semibold">{tracking.grant_name}</p>
                          <p className="text-sm text-gray-600">Progress: {tracking.progress}</p>
                          <p className="text-sm text-gray-600">Analyst: {tracking.analyst_name}</p>
                          {tracking.disbursed_amount && (
                            <p className="text-sm text-green-600 font-medium">Amount: Rs. {tracking.disbursed_amount}</p>
                          )}
                          {tracking.notes && (
                            <p className="text-sm text-gray-500 mt-1">{tracking.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={`${
                          tracking.status === 'Draft' ? 'bg-gray-500 text-white' :
                          tracking.status === 'Applied' ? 'bg-blue-500 text-white' :
                          tracking.status === 'Approved' ? 'bg-green-500 text-white' :
                          tracking.status === 'Disbursed' ? 'bg-purple-500 text-white' :
                          'bg-red-500 text-white'
                        }`}>
                          {tracking.status}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(tracking.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Screenshot Preview for Applied Status */}
                    {tracking.status === 'Applied' && tracking.screenshot_path && (
                      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mt-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold text-yellow-900 flex items-center">
                            <FileText className="w-4 h-4 mr-2" />
                            Application Screenshot
                          </p>
                          <a 
                            href={`http://localhost:8000/${tracking.screenshot_path.replace(/\\/g, '/')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-yellow-700 hover:text-yellow-900 font-medium underline"
                          >
                            Open Full Size
                          </a>
                        </div>
                        <div className="relative rounded-lg overflow-hidden border-2 border-yellow-300">
                          <img 
                            src={`http://localhost:8000/${tracking.screenshot_path.replace(/\\/g, '/')}`}
                            alt="Application Screenshot"
                            className="w-full h-auto max-h-96 object-contain bg-white"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="hidden items-center justify-center h-48 bg-gray-100">
                            <p className="text-gray-500 text-sm">Screenshot not available</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// PREMIUM TIER DASHBOARD
const PremiumTierDashboard = ({ user, grants, searchTerm, setSearchTerm, handleLogout, handleCouponSubmit, couponCode, setCouponCode, couponLoading, handleDownloadAllPDF, isDownloading }) => {
  const [trackingData, setTrackingData] = useState([]);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // Load tracking data for premium tier startup
  const loadTrackingData = async () => {
    try {
      setTrackingLoading(true);
      const token = localStorage.getItem('token');
      
      // Get the current user's startup data directly
      const startupResponse = await axios.get(`${API}/startups/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!startupResponse.data || !startupResponse.data.ID) {
        console.log('📊 No startup found for this premium tier user');
        setTrackingData([]);
        return;
      }
      
      const startupId = startupResponse.data.ID;
      console.log('📊 Premium Tier - Loading tracking for startup ID:', startupId);
      
      // Get tracking data for this startup from grant_tracking.csv
      const trackingResponse = await axios.get(`${API}/tracking/expert/${startupId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const trackingList = trackingResponse.data.tracking || [];
      console.log('📊 Premium Tier - Loaded tracking data:', trackingList.length, 'entries');
      setTrackingData(trackingList);
    } catch (error) {
      console.error('❌ Premium Tier - Error loading tracking data:', error);
      setTrackingData([]);
    } finally {
      setTrackingLoading(false);
    }
  };

  useEffect(() => {
    loadTrackingData();
    
    // Auto-refresh tracking data every 10 seconds for real-time updates
    const refreshInterval = setInterval(() => {
      loadTrackingData();
    }, 10000);
    
    return () => clearInterval(refreshInterval);
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50">
      {/* Header */}
      <nav className="bg-white border-b shadow-sm" data-testid="dashboard-nav">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Award className="w-8 h-8 text-[#f46d19]" />
              <h1 className="text-2xl font-bold" style={{ background: 'linear-gradient(135deg, #f46d19 0%, #ef3e25 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>MyProBuddy Premium</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="relative" data-testid="notifications-btn">
                <Bell className="w-5 h-5" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>
              <Badge className="bg-[#f46d19] text-white flex items-center space-x-1 px-3 py-1" data-testid="tier-badge">
                <Sparkles className="w-4 h-4" />
                <span>Premium</span>
              </Badge>
              <span className="text-gray-700 font-medium" data-testid="user-name">{user?.name}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="logout-btn">
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Premium Dashboard</h2>
          <p className="text-gray-600">Access to top 10 grants with advanced features</p>
        </div>

        {/* Stats Row */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="card bg-gradient-to-br from-[#f46d19] to-[#ef3e25] text-white shadow-lg border-0" style={{background: 'linear-gradient(135deg, #f46d19 0%, #ef3e25 100%)'}}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm">Total Grants</p>
                  <p className="text-3xl font-bold mt-1 text-white">{(grants || []).length}</p>
                </div>
                <Target className="w-12 h-12 text-white opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Soft Approvals</p>
                  <p className="text-3xl font-bold text-[#f46d19] mt-1">
                    {(grants || []).filter(g => g.soft_approval === 'Yes').length}
                  </p>
                </div>
                <BadgeCheck className="w-12 h-12 text-[#f46d19]/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Avg Match Score</p>
                  <p className="text-3xl font-bold text-[#5d248f] mt-1">
                    {(grants || []).length > 0 ? Math.round((grants || []).reduce((acc, g) => acc + (g.relevance_score || 0), 0) / (grants || []).length) : 0}%
                  </p>
                </div>
                <TrendingUp className="w-12 h-12 text-[#5d248f]/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="card bg-gradient-to-br from-[#5d248f] to-[#4a1d73] text-white shadow-lg border-0" style={{background: 'linear-gradient(135deg, #5d248f 0%, #4a1d73 100%)'}}>
            <CardContent className="pt-6">
              <div className="text-center">
                <Crown className="w-10 h-10 mx-auto mb-2 text-white" />
                <p className="text-sm mb-2 text-white">Want More?</p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="secondary" size="sm" className="bg-white text-[#5d248f] hover:bg-gray-100 w-full" data-testid="upgrade-expert-btn">
                      Go Expert
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upgrade to Expert Tier</DialogTitle>
                      <DialogDescription>Use code <strong className="text-[#5d248f]">EXPERT30K</strong> for full CRM, consultation & support</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="flex space-x-2">
                        <Input placeholder="Enter EXPERT30K" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} data-testid="coupon-input" />
                        <Button onClick={handleCouponSubmit} disabled={couponLoading} className="bg-[#5d248f]" data-testid="coupon-submit-btn">
                          {couponLoading ? 'Validating...' : 'Apply'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Bar */}
        <Card className="mb-6 bg-white shadow-sm">
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input placeholder="Search grants by name or sector..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} data-testid="search-grants-input" />
              </div>
              <Button 
                className="bg-[#f46d19] hover:bg-[#d85e15] w-full md:w-auto transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl" 
                onClick={handleDownloadAllPDF} 
                disabled={isDownloading}
                data-testid="download-all-pdf-btn"
              >
                {isDownloading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" /> 
                    Download Professional Report (PDF)
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Grants Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {grants.map((grant, idx) => (
            <Card key={idx} className="card hover:shadow-xl transition-all" data-testid={`grant-card-${idx}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <CardTitle className="text-lg flex-1">{grant.name}</CardTitle>
                  <Badge variant="outline" className="text-xs">{grant.sector.split('|')[0]}</Badge>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  {grant.soft_approval === 'Yes' && (
                    <Badge className="bg-green-500 text-white text-xs" data-testid={`soft-approval-badge-${idx}`}>
                      <BadgeCheck className="w-3 h-3 mr-1" /> Soft Approved
                    </Badge>
                  )}
                  <span className="text-[#f46d19] font-bold">{grant.funding_amount}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Match Score</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={grant.relevance_score} className="w-20 h-2" />
                      <span className="font-bold text-[#5d248f]">{Math.round(grant.relevance_score)}%</span>
                    </div>
                  </div>
                  <div className="text-sm">
                    <p className="text-gray-700 font-medium mb-1">Why it matches:</p>
                    <p className={`text-gray-600 text-xs ${user?.tier === 'premium' ? '' : 'line-clamp-2'}`}>{grant.reason}</p>
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span>Deadline: {grant.deadline}</span>
                  </div>
                  <div className="flex space-x-2 pt-2">
                    <Button size="sm" className="bg-[#5d248f] hover:bg-[#4a1d73] w-full" onClick={() => window.open(grant.application_link, '_blank')} data-testid={`apply-btn-${idx}`}>
                      <ExternalLink className="w-3 h-3 mr-1" /> Apply
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Grant Tracking Section */}
        {trackingData.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">📊 Grant Tracking by Venture Analysts</h2>
            <div className="space-y-6">
              {trackingData.map((tracking) => (
                <Card key={tracking.id} className="overflow-hidden border-l-4" style={{
                  borderLeftColor: 
                    tracking.status === 'Draft' ? '#3b82f6' :
                    tracking.status === 'Applied' ? '#eab308' :
                    tracking.status === 'Approved' ? '#22c55e' :
                    tracking.status === 'Disbursed' ? '#a855f7' :
                    '#ef4444'
                }}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          tracking.status === 'Draft' ? 'bg-gray-500' :
                          tracking.status === 'Applied' ? 'bg-blue-500' :
                          tracking.status === 'Approved' ? 'bg-green-500' :
                          tracking.status === 'Disbursed' ? 'bg-purple-500' :
                          'bg-red-500'
                        }`}>
                          {tracking.status === 'Draft' ? <FileText className="w-6 h-6 text-white" /> :
                           tracking.status === 'Applied' ? <Clock className="w-6 h-6 text-white" /> :
                           tracking.status === 'Approved' ? <CheckCircle2 className="w-6 h-6 text-white" /> :
                           tracking.status === 'Disbursed' ? <DollarSign className="w-6 h-6 text-white" /> :
                           <XCircle className="w-6 h-6 text-white" />}
                        </div>
                        <div>
                          <p className="font-semibold">{tracking.grant_name}</p>
                          <p className="text-sm text-gray-600">Progress: {tracking.progress}</p>
                          <p className="text-sm text-gray-600">Analyst: {tracking.analyst_name}</p>
                          {tracking.disbursed_amount && (
                            <p className="text-sm text-green-600 font-medium">Amount: Rs. {tracking.disbursed_amount}</p>
                          )}
                          {tracking.notes && (
                            <p className="text-sm text-gray-500 mt-1">{tracking.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={`${
                          tracking.status === 'Draft' ? 'bg-gray-500 text-white' :
                          tracking.status === 'Applied' ? 'bg-blue-500 text-white' :
                          tracking.status === 'Approved' ? 'bg-green-500 text-white' :
                          tracking.status === 'Disbursed' ? 'bg-purple-500 text-white' :
                          'bg-red-500 text-white'
                        }`}>
                          {tracking.status}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(tracking.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Screenshot Preview for Applied Status */}
                    {tracking.status === 'Applied' && tracking.screenshot_path && (
                      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mt-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold text-yellow-900 flex items-center">
                            <FileText className="w-4 h-4 mr-2" />
                            Application Screenshot
                          </p>
                          <a 
                            href={`http://localhost:8000/${tracking.screenshot_path.replace(/\\/g, '/')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-yellow-700 hover:text-yellow-900 font-medium underline"
                          >
                            Open Full Size
                          </a>
                        </div>
                        <div className="relative rounded-lg overflow-hidden border-2 border-yellow-300">
                          <img 
                            src={`http://localhost:8000/${tracking.screenshot_path.replace(/\\/g, '/')}`}
                            alt="Application Screenshot"
                            className="w-full h-auto max-h-96 object-contain bg-white"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="hidden items-center justify-center h-48 bg-gray-100">
                            <p className="text-gray-500 text-sm">Screenshot not available</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// EXPERT TIER DASHBOARD
const ExpertTierDashboard = ({ user, grants, searchTerm, setSearchTerm, handleLogout, handleDownloadAllPDF, isDownloading }) => {
  const [activeTab, setActiveTab] = useState('grants');
  const [trackingData, setTrackingData] = useState([]);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // Load tracking data for expert's startup
  const loadTrackingData = async () => {
    try {
      setTrackingLoading(true);
      const token = localStorage.getItem('token');
      
      // Get the current user's startup data directly
      const startupResponse = await axios.get(`${API}/startups/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!startupResponse.data || !startupResponse.data.ID) {
        console.log('📊 No startup found for this expert user');
        setTrackingData([]);
        return;
      }
      
      const startupId = startupResponse.data.ID;
      console.log('📊 Loading tracking for startup ID:', startupId);
      
      // Get tracking data for this startup from grant_tracking.csv
      const trackingResponse = await axios.get(`${API}/tracking/expert/${startupId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const trackingList = trackingResponse.data.tracking || [];
      console.log('📊 Loaded tracking data:', trackingList.length, 'entries');
      setTrackingData(trackingList);
    } catch (error) {
      console.error('❌ Error loading tracking data:', error);
      setTrackingData([]);
    } finally {
      setTrackingLoading(false);
    }
  };

  // Load tracking data when tracking tab is selected and set up auto-refresh
  useEffect(() => {
    if (activeTab === 'tracking' && user) {
      loadTrackingData();
      
      // Auto-refresh tracking data every 5 seconds for real-time updates
      const refreshInterval = setInterval(() => {
        loadTrackingData();
      }, 5000);
      
      return () => clearInterval(refreshInterval);
    }
  }, [activeTab, user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Header */}
      <nav className="bg-gradient-to-r from-[#5d248f] to-[#4a1d73] text-white shadow-lg" data-testid="dashboard-nav">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Crown className="w-8 h-8" />
              <h1 className="text-2xl font-bold">MyProBuddy Expert CRM</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" data-testid="notifications-btn">
                <Bell className="w-5 h-5" />
              </Button>
              <Badge className="bg-white text-[#5d248f] flex items-center space-x-1 px-3 py-1 font-semibold" data-testid="tier-badge">
                <Crown className="w-4 h-4" />
                <span>Expert</span>
              </Badge>
              <span className="font-medium" data-testid="user-name">{user?.name}</span>
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={handleLogout} data-testid="logout-btn">
                <LogOut className="w-4 h-4 mr-2" /> Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Expert Dashboard & CRM</h2>
          <p className="text-gray-600">Complete grant management with expert consultation and application support</p>
        </div>

        {/* Key Metrics */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <Card className="card bg-gradient-to-br from-[#5d248f] to-[#4a1d73] text-white shadow-lg border-0" style={{background: 'linear-gradient(135deg, #5d248f 0%, #4a1d73 100%)'}}>
            <CardContent className="pt-6 text-center">
              <Target className="w-10 h-10 mx-auto mb-2 text-white" />
              <p className="text-2xl font-bold text-white">{(grants || []).length}</p>
              <p className="text-sm text-white">Total Grants</p>
            </CardContent>
          </Card>

          <Card className="card">
            <CardContent className="pt-6 text-center">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold text-green-600">{(grants || []).filter(g => g.soft_approval === 'Yes').length}</p>
              <p className="text-sm text-gray-600">Soft Approvals</p>
            </CardContent>
          </Card>

          <Card className="card">
            <CardContent className="pt-6 text-center">
              <Clock className="w-10 h-10 mx-auto mb-2 text-[#f46d19]" />
              <p className="text-2xl font-bold text-[#f46d19]">5</p>
              <p className="text-sm text-gray-600">In Progress</p>
            </CardContent>
          </Card>

          <Card className="card">
            <CardContent className="pt-6 text-center">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold text-blue-600">3</p>
              <p className="text-sm text-gray-600">Consultations</p>
            </CardContent>
          </Card>

          <Card className="card">
            <CardContent className="pt-6 text-center">
              <TrendingUp className="w-10 h-10 mx-auto mb-2 text-[#5d248f]" />
              <p className="text-2xl font-bold text-[#5d248f]">{(grants || []).length > 0 ? Math.round((grants || []).reduce((acc, g) => acc + (g.relevance_score || 0), 0) / (grants || []).length) : 0}%</p>
              <p className="text-sm text-gray-600">Avg Match</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm p-1 rounded-lg">
            <TabsTrigger value="grants" className="data-[state=active]:bg-[#5d248f] data-[state=active]:text-white" data-testid="grants-tab">
              <Target className="w-4 h-4 mr-2" /> Grants
            </TabsTrigger>
            <TabsTrigger value="tracking" className="data-[state=active]:bg-[#5d248f] data-[state=active]:text-white" data-testid="tracking-tab">
              <BarChart3 className="w-4 h-4 mr-2" /> Tracking
            </TabsTrigger>
            <TabsTrigger value="consultation" className="data-[state=active]:bg-[#5d248f] data-[state=active]:text-white" data-testid="consultation-tab">
              <Video className="w-4 h-4 mr-2" /> Consultation
            </TabsTrigger>
            <TabsTrigger value="crm" className="data-[state=active]:bg-[#5d248f] data-[state=active]:text-white" data-testid="crm-tab">
              <Users className="w-4 h-4 mr-2" /> CRM
            </TabsTrigger>
          </TabsList>

          {/* Grants Tab */}
          <TabsContent value="grants" className="space-y-6">
            <Card>
              <CardContent className="py-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input placeholder="Search grants..." className="pl-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} data-testid="search-grants-input" />
                  </div>
                  <Button 
                    className="bg-[#5d248f] hover:bg-[#4a1d73] w-full md:w-auto transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl" 
                    onClick={handleDownloadAllPDF} 
                    disabled={isDownloading}
                    data-testid="download-all-pdf-btn"
                  >
                    {isDownloading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating PDF...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" /> 
                        Download Professional Report (PDF)
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {grants.map((grant, idx) => (
                <Card key={idx} className="card hover:shadow-lg transition-all" data-testid={`grant-card-${idx}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <CardTitle className="text-xl">{grant.name}</CardTitle>
                          {grant.soft_approval === 'Yes' && (
                            <Badge className="bg-green-500 text-white" data-testid={`soft-approval-badge-${idx}`}>
                              <BadgeCheck className="w-3 h-3 mr-1" /> Soft Approved
                            </Badge>
                          )}
                          <Badge variant="outline">{grant.sector.split('|')[0]}</Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="font-bold text-[#5d248f]">{grant.funding_amount}</span>
                          <span>•</span>
                          <span>Deadline: {grant.deadline}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-[#5d248f]">{Math.round(grant.relevance_score)}%</div>
                        <div className="text-xs text-gray-500">Match Score</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">Why This Matches:</p>
                        <p className="text-gray-600 text-sm">{grant.reason}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">Eligibility:</p>
                        <p className="text-gray-600 text-sm">{grant.eligibility}</p>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" className="bg-[#5d248f] hover:bg-[#4a1d73]" onClick={() => window.open(grant.application_link, '_blank')} data-testid={`apply-btn-${idx}`}>
                          <ExternalLink className="w-4 h-4 mr-2" /> Apply Now
                        </Button>
                        <Button size="sm" variant="outline" data-testid={`track-btn-${idx}`}>
                          <Target className="w-4 h-4 mr-2" /> Add to Tracking
                        </Button>
                        <Button size="sm" variant="outline" data-testid={`expert-help-${idx}`}>
                          <MessageSquare className="w-4 h-4 mr-2" /> Request Expert Help
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Grant Tracking Tab */}
          <TabsContent value="tracking" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Tracking</CardTitle>
                <CardDescription>Monitor grant applications created by venture analysts for your startup</CardDescription>
              </CardHeader>
              <CardContent>
                {trackingLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5d248f] mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading tracking data...</p>
                  </div>
                ) : trackingData.length === 0 ? (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No tracking entries found for your startup.</p>
                    <p className="text-sm text-gray-500 mt-2">Venture analysts will create tracking entries for your grants.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {trackingData.map((tracking) => (
                      <Card key={tracking.id} className="overflow-hidden border-l-4" style={{
                        borderLeftColor: 
                          tracking.status === 'Draft' ? '#3b82f6' :
                          tracking.status === 'Applied' ? '#eab308' :
                          tracking.status === 'Approved' ? '#22c55e' :
                          tracking.status === 'Disbursed' ? '#a855f7' :
                          '#ef4444'
                      }}>
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start space-x-4">
                              <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-md ${
                                tracking.status === 'Draft' ? 'bg-blue-500' :
                                tracking.status === 'Applied' ? 'bg-yellow-500' :
                                tracking.status === 'Approved' ? 'bg-green-500' :
                                tracking.status === 'Disbursed' ? 'bg-purple-500' :
                                'bg-red-500'
                              }`}>
                                {tracking.status === 'Draft' ? <FileText className="w-7 h-7 text-white" /> :
                                 tracking.status === 'Applied' ? <Clock className="w-7 h-7 text-white" /> :
                                 tracking.status === 'Approved' ? <CheckCircle2 className="w-7 h-7 text-white" /> :
                                 tracking.status === 'Disbursed' ? <DollarSign className="w-7 h-7 text-white" /> :
                                 <XCircle className="w-7 h-7 text-white" />}
                              </div>
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900">{tracking.grant_name}</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                  Managed by <span className="font-medium text-gray-700">{tracking.analyst_name}</span>
                                </p>
                              </div>
                            </div>
                            <Badge className={`${
                              tracking.status === 'Draft' ? 'bg-blue-500 text-white' :
                              tracking.status === 'Applied' ? 'bg-yellow-500 text-white' :
                              tracking.status === 'Approved' ? 'bg-green-500 text-white' :
                              tracking.status === 'Disbursed' ? 'bg-purple-500 text-white' :
                              'bg-red-500 text-white'
                            } px-3 py-1 text-sm font-semibold`}>
                              {tracking.status}
                            </Badge>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">Progress</span>
                              <span className="text-sm font-bold text-gray-900">{tracking.progress}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className={`h-2.5 rounded-full ${
                                  tracking.status === 'Draft' ? 'bg-blue-500' :
                                  tracking.status === 'Applied' ? 'bg-yellow-500' :
                                  tracking.status === 'Approved' ? 'bg-green-500' :
                                  tracking.status === 'Disbursed' ? 'bg-purple-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${parseInt(tracking.progress) || 0}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            {tracking.applied_date && (
                              <div className="bg-blue-50 p-3 rounded-lg">
                                <p className="text-xs text-blue-600 font-medium mb-1">Applied Date</p>
                                <p className="text-sm text-gray-900 font-semibold">
                                  {new Date(tracking.applied_date).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                            {tracking.approved_date && (
                              <div className="bg-green-50 p-3 rounded-lg">
                                <p className="text-xs text-green-600 font-medium mb-1">Approved Date</p>
                                <p className="text-sm text-gray-900 font-semibold">
                                  {new Date(tracking.approved_date).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                            {tracking.disbursed_date && (
                              <div className="bg-purple-50 p-3 rounded-lg">
                                <p className="text-xs text-purple-600 font-medium mb-1">Disbursed Date</p>
                                <p className="text-sm text-gray-900 font-semibold">
                                  {new Date(tracking.disbursed_date).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                            {tracking.disbursed_amount && (
                              <div className="bg-purple-50 p-3 rounded-lg">
                                <p className="text-xs text-purple-600 font-medium mb-1">Disbursed Amount</p>
                                <p className="text-lg text-purple-700 font-bold">
                                  ₹ {parseFloat(tracking.disbursed_amount).toLocaleString('en-IN')}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Notes */}
                          {tracking.notes && (
                            <div className="bg-gray-50 p-4 rounded-lg mb-4">
                              <p className="text-xs text-gray-600 font-medium mb-1">📝 Notes from Analyst</p>
                              <p className="text-sm text-gray-800">{tracking.notes}</p>
                            </div>
                          )}

                          {/* Screenshot Preview for Applied Status */}
                          {tracking.status === 'Applied' && tracking.screenshot_path && (
                            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                              <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-semibold text-yellow-900 flex items-center">
                                  <FileText className="w-4 h-4 mr-2" />
                                  Application Screenshot
                                </p>
                                <a 
                                  href={`http://localhost:8000/${tracking.screenshot_path.replace(/\\/g, '/')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-yellow-700 hover:text-yellow-900 font-medium underline"
                                >
                                  Open Full Size
                                </a>
                              </div>
                              <div className="relative rounded-lg overflow-hidden border-2 border-yellow-300">
                                <img 
                                  src={`http://localhost:8000/${tracking.screenshot_path.replace(/\\/g, '/')}`}
                                  alt="Application Screenshot"
                                  className="w-full h-auto max-h-96 object-contain bg-white"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                                <div className="hidden items-center justify-center h-48 bg-gray-100">
                                  <p className="text-gray-500 text-sm">Screenshot not available</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Footer */}
                          <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <p className="text-xs text-gray-500">
                              Created: {new Date(tracking.created_at).toLocaleString()}
                            </p>
                            {tracking.updated_at && tracking.updated_at !== tracking.created_at && (
                              <p className="text-xs text-gray-500">
                                Updated: {new Date(tracking.updated_at).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Consultation Tab */}
          <TabsContent value="consultation" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="card">
                <CardHeader>
                  <CardTitle>Schedule Expert Consultation</CardTitle>
                  <CardDescription>Book a 1-on-1 session with grant experts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full bg-[#5d248f] hover:bg-[#4a1d73]" data-testid="schedule-consultation-btn">
                    <Video className="w-4 h-4 mr-2" /> Book Video Call
                  </Button>
                  <Button variant="outline" className="w-full" data-testid="request-callback-btn">
                    <MessageSquare className="w-4 h-4 mr-2" /> Request Callback
                  </Button>
                </CardContent>
              </Card>

              <Card className="card bg-gradient-to-br from-[#5d248f] to-[#4a1d73] text-white">
                <CardHeader>
                  <CardTitle className="text-white">Your Expert Team</CardTitle>
                  <CardDescription className="text-white/80">Dedicated support for 3 months</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold">Grant Specialist</p>
                      <p className="text-sm opacity-80">Application guidance</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold">Document Expert</p>
                      <p className="text-sm opacity-80">Proposal writing support</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold">Success Manager</p>
                      <p className="text-sm opacity-80">End-to-end tracking</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-[#5d248f]" />
                      <div>
                        <p className="font-semibold">Grant Application Review</p>
                        <p className="text-sm text-gray-600">Tomorrow, 10:00 AM</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">Join Call</Button>
                  </div>
                  <div className="text-center py-8 text-gray-500">
                    <p>No more scheduled sessions</p>
                    <Button className="mt-4 bg-[#5d248f] hover:bg-[#4a1d73]">Schedule New Session</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CRM Tab */}
          <TabsContent value="crm" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Grant Management CRM</CardTitle>
                <CardDescription>Comprehensive tools to manage your grant pipeline</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <CardContent className="pt-6 text-center">
                      <Target className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                      <p className="text-2xl font-bold text-blue-700">12</p>
                      <p className="text-sm text-blue-600">Active Opportunities</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                    <CardContent className="pt-6 text-center">
                      <Clock className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
                      <p className="text-2xl font-bold text-yellow-700">5</p>
                      <p className="text-sm text-yellow-600">Pending Actions</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardContent className="pt-6 text-center">
                      <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                      <p className="text-2xl font-bold text-green-700">3</p>
                      <p className="text-sm text-green-600">Completed</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-6 space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" /> Document Repository
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <BarChart3 className="w-4 h-4 mr-2" /> Analytics & Reports
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Bell className="w-4 h-4 mr-2" /> Notification Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
