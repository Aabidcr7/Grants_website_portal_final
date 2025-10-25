import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Award, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL}/api`;

const ScreeningForm = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Page 1 data
  const [page1Data, setPage1Data] = useState({
    startup_name: '',
    founder_name: '',
    entity_type: '',
    location: '',
    industry: '',
    company_size: '',
    description: '',
    contact_email: '',
    contact_phone: ''
  });

  // Page 2 data
  const [page2Data, setPage2Data] = useState({
    stage: '',
    revenue: '',
    stability: '',
    demographic: '',
    track_record: '',
    past_grant_experience: 'No',
    past_grant_description: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handlePage1Next = (e) => {
    e.preventDefault();
    setCurrentPage(2);
  };

  const handlePage2Submit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      const payload = {
        ...page1Data,
        ...page2Data,
        company_size: parseInt(page1Data.company_size),
        revenue: parseFloat(page2Data.revenue),
        track_record: parseInt(page2Data.track_record)
      };

      await axios.post(
        `${API}/screening/submit`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('Profile submitted! Finding your grant matches...');
      
      // Update local storage
      const user = JSON.parse(localStorage.getItem('user'));
      user.has_completed_screening = true;
      localStorage.setItem('user', JSON.stringify(user));
      
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Submission failed');
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

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${currentPage === 1 ? 'text-[#5d248f]' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                currentPage === 1 ? 'bg-[#5d248f] text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Basic Info</span>
            </div>
            <div className="w-20 h-1 bg-gray-300"></div>
            <div className={`flex items-center ${currentPage === 2 ? 'text-[#5d248f]' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                currentPage === 2 ? 'bg-[#5d248f] text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Profile</span>
            </div>
          </div>
        </div>

        <Card className="glass shadow-2xl" data-testid="screening-form-card">
          <CardHeader>
            <CardTitle className="text-2xl">
              {currentPage === 1 ? 'Startup Basic Information' : 'Startup Profile & Eligibility'}
            </CardTitle>
            <CardDescription>
              {currentPage === 1 
                ? 'Tell us about your company' 
                : 'Share your startup\'s stage and financial details'
              }
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
                    <Label htmlFor="entity_type">Entity Type *</Label>
                    <Select
                      value={page1Data.entity_type}
                      onValueChange={(value) => setPage1Data({ ...page1Data, entity_type: value })}
                      required
                    >
                      <SelectTrigger data-testid="entity-type-select">
                        <SelectValue placeholder="Select entity type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="For-profit">For-profit</SelectItem>
                        <SelectItem value="Non-profit">Non-profit</SelectItem>
                        <SelectItem value="Academic">Academic</SelectItem>
                        <SelectItem value="Individual">Individual</SelectItem>
                      </SelectContent>
                    </Select>
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

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry / Sector *</Label>
                    <Select
                      value={page1Data.industry}
                      onValueChange={(value) => setPage1Data({ ...page1Data, industry: value })}
                      required
                    >
                      <SelectTrigger data-testid="industry-select">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Agriculture">Agriculture</SelectItem>
                        <SelectItem value="Biotech">Biotech</SelectItem>
                        <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="Fintech">Fintech</SelectItem>
                        <SelectItem value="Social Enterprise">Social Enterprise</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company_size">Company Size (Employees) *</Label>
                    <Input
                      id="company_size"
                      type="number"
                      required
                      min="0"
                      value={page1Data.company_size}
                      onChange={(e) => setPage1Data({ ...page1Data, company_size: e.target.value })}
                      data-testid="company-size-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Company Description *</Label>
                  <Textarea
                    id="description"
                    required
                    rows={4}
                    placeholder="Brief description of your startup and what you do"
                    value={page1Data.description}
                    onChange={(e) => setPage1Data({ ...page1Data, description: e.target.value })}
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
                      value={page1Data.contact_email}
                      onChange={(e) => setPage1Data({ ...page1Data, contact_email: e.target.value })}
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
                      value={page1Data.contact_phone}
                      onChange={(e) => setPage1Data({ ...page1Data, contact_phone: e.target.value })}
                      data-testid="contact-phone-input"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    className="bg-[#5d248f] hover:bg-[#4a1d73]"
                    data-testid="page1-next-btn"
                  >
                    Next <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </form>
            )}

            {/* Page 2 */}
            {currentPage === 2 && (
              <form onSubmit={handlePage2Submit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="stage">Stage of Startup *</Label>
                    <Select
                      value={page2Data.stage}
                      onValueChange={(value) => setPage2Data({ ...page2Data, stage: value })}
                      required
                    >
                      <SelectTrigger data-testid="stage-select">
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ideation">Ideation</SelectItem>
                        <SelectItem value="Start-up">Start-up</SelectItem>
                        <SelectItem value="Growth/Scale-up">Growth/Scale-up</SelectItem>
                        <SelectItem value="Established">Established</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="revenue">Annual Revenue (USD) *</Label>
                    <Input
                      id="revenue"
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      placeholder="0"
                      value={page2Data.revenue}
                      onChange={(e) => setPage2Data({ ...page2Data, revenue: e.target.value })}
                      data-testid="revenue-input"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="stability">Financial Stability *</Label>
                    <Select
                      value={page2Data.stability}
                      onValueChange={(value) => setPage2Data({ ...page2Data, stability: value })}
                      required
                    >
                      <SelectTrigger data-testid="stability-select">
                        <SelectValue placeholder="Select stability" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Poor">Poor</SelectItem>
                        <SelectItem value="Average">Average</SelectItem>
                        <SelectItem value="Good">Good</SelectItem>
                        <SelectItem value="Excellent">Excellent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="demographic">Demographic Ownership *</Label>
                    <Select
                      value={page2Data.demographic}
                      onValueChange={(value) => setPage2Data({ ...page2Data, demographic: value })}
                      required
                    >
                      <SelectTrigger data-testid="demographic-select">
                        <SelectValue placeholder="Select demographic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Woman-owned">Woman-owned</SelectItem>
                        <SelectItem value="General">General</SelectItem>
                      </SelectContent>
                    </Select>
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
                    value={page2Data.track_record}
                    onChange={(e) => setPage2Data({ ...page2Data, track_record: e.target.value })}
                    data-testid="track-record-input"
                  />
                </div>

                <div className="space-y-3">
                  <Label>Past Grant Experience *</Label>
                  <RadioGroup
                    value={page2Data.past_grant_experience}
                    onValueChange={(value) => setPage2Data({ ...page2Data, past_grant_experience: value })}
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

                {page2Data.past_grant_experience === 'Yes' && (
                  <div className="space-y-2">
                    <Label htmlFor="past_grant_description">Describe Your Past Grant Experience</Label>
                    <Textarea
                      id="past_grant_description"
                      rows={3}
                      placeholder="Tell us about previous grants you've received"
                      value={page2Data.past_grant_description}
                      onChange={(e) => setPage2Data({ ...page2Data, past_grant_description: e.target.value })}
                      data-testid="past-grant-desc-input"
                    />
                  </div>
                )}

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentPage(1)}
                    data-testid="page2-back-btn"
                  >
                    <ArrowLeft className="mr-2 w-4 h-4" /> Back
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#5d248f] hover:bg-[#4a1d73]"
                    disabled={loading}
                    data-testid="page2-submit-btn"
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
    </div>
  );
};

export default ScreeningForm;
