import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { 
  User, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Award, 
  Users, 
  Crown,
  FileText,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  UserCheck
} from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const UserProfile = ({ user, onProfileUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/auth/profile-complete`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfileData(response.data);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProfileData();
    }
  }, [isOpen]);

  const getTierColor = (tier) => {
    switch (tier) {
      case 'expert': return 'bg-gradient-to-r from-purple-500 to-indigo-600';
      case 'premium': return 'bg-gradient-to-r from-orange-500 to-red-600';
      case 'free': return 'bg-gray-500';
      case 'venture_analyst': return 'bg-gradient-to-r from-blue-500 to-cyan-600';
      case 'incubation_admin': return 'bg-gradient-to-r from-green-500 to-emerald-600';
      case 'admin': return 'bg-gradient-to-r from-red-500 to-pink-600';
      default: return 'bg-gray-500';
    }
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'expert': return <Crown className="w-4 h-4" />;
      case 'premium': return <Award className="w-4 h-4" />;
      case 'free': return <User className="w-4 h-4" />;
      case 'venture_analyst': return <Users className="w-4 h-4" />;
      case 'incubation_admin': return <Building2 className="w-4 h-4" />;
      case 'admin': return <UserCheck className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (!profileData && !loading) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="text-white hover:bg-white/20">
            <User className="w-4 h-4 mr-2" />
            Profile
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-gray-500">Failed to load profile data</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-white hover:bg-white/20">
          <User className="w-4 h-4 mr-2" />
          Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Complete Profile Information</span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5d248f] mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading profile data...</p>
          </div>
        ) : profileData ? (
          <div className="space-y-6">
            {/* User Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Basic Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{profileData.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Member Since</p>
                      <p className="font-medium">{formatDate(profileData.user.created_at)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Badge className={`${getTierColor(profileData.user.tier)} text-white flex items-center space-x-1`}>
                    {getTierIcon(profileData.user.tier)}
                    <span className="capitalize">{profileData.user.tier.replace('_', ' ')}</span>
                  </Badge>
                  {profileData.user.screening_completed_at && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Screening Completed
                    </Badge>
                  )}
                </div>

                {profileData.user.upgraded_at && (
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="text-sm text-gray-500">Upgraded On</p>
                      <p className="font-medium text-green-600">{formatDate(profileData.user.upgraded_at)}</p>
                    </div>
                  </div>
                )}

                {profileData.user.coupon_used && (
                  <div className="flex items-center space-x-3">
                    <Award className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-500">Coupon Used</p>
                      <p className="font-medium font-mono">{profileData.user.coupon_used}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Startup Information */}
            {profileData.screening_data && Object.keys(profileData.screening_data).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="w-5 h-5" />
                    <span>Startup Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Startup Details */}
                  <div>
                    <h4 className="font-semibold mb-3 text-gray-700">Company Details</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">Startup Name</p>
                          <p className="font-medium">{profileData.screening_data.startup_name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Founder Name</p>
                          <p className="font-medium">{profileData.screening_data.founder_name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Entity Type</p>
                          <p className="font-medium">{profileData.screening_data.entity_type || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Industry</p>
                          <p className="font-medium">
                            {profileData.screening_data.industry === 'Other' && profileData.screening_data.industry_other
                              ? profileData.screening_data.industry_other
                              : profileData.screening_data.industry || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">Location</p>
                          <p className="font-medium flex items-center">
                            <MapPin className="w-3 h-3 mr-1" />
                            {profileData.screening_data.location || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Company Size</p>
                          <p className="font-medium">{profileData.screening_data.company_size || 'N/A'} employees</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Year of Incorporation</p>
                          <p className="font-medium">{profileData.screening_data.year_of_incorporation || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Stage</p>
                          <p className="font-medium">{profileData.screening_data.stage || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Financial Information */}
                  <div>
                    <h4 className="font-semibold mb-3 text-gray-700">Financial Information</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">Annual Revenue</p>
                          <p className="font-medium flex items-center">
                            <DollarSign className="w-3 h-3 mr-1" />
                            {formatCurrency(profileData.screening_data.revenue)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Funding Need</p>
                          <p className="font-medium flex items-center">
                            <DollarSign className="w-3 h-3 mr-1" />
                            {formatCurrency(profileData.screening_data.funding_need)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Financial Stability</p>
                          <p className="font-medium">{profileData.screening_data.stability || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-500">Track Record</p>
                          <p className="font-medium">{profileData.screening_data.track_record || 'N/A'} projects</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Demographic</p>
                          <p className="font-medium">{profileData.screening_data.demographic || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Past Grant Experience</p>
                          <p className="font-medium">{profileData.screening_data.past_grant_experience || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Contact Information */}
                  <div>
                    <h4 className="font-semibold mb-3 text-gray-700">Contact Information</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Contact Email</p>
                          <p className="font-medium">{profileData.screening_data.contact_email || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-500">Contact Phone</p>
                          <p className="font-medium">{profileData.screening_data.contact_phone || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ownership Type */}
                  {profileData.screening_data.ownership_type && profileData.screening_data.ownership_type.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-semibold mb-3 text-gray-700">Ownership Type</h4>
                        <div className="flex flex-wrap gap-2">
                          {profileData.screening_data.ownership_type.map((type, index) => (
                            <Badge key={index} variant="outline">{type}</Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Description */}
                  {profileData.screening_data.description && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-semibold mb-3 text-gray-700">Company Description</h4>
                        <p className="text-gray-700 leading-relaxed">{profileData.screening_data.description}</p>
                      </div>
                    </>
                  )}

                  {/* Past Grant Experience Description */}
                  {profileData.screening_data.past_grant_experience === 'Yes' && profileData.screening_data.past_grant_description && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-semibold mb-3 text-gray-700">Past Grant Experience</h4>
                        <p className="text-gray-700 leading-relaxed">{profileData.screening_data.past_grant_description}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Assignments */}
            {profileData.assignments && profileData.assignments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Assigned Team Members</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profileData.assignments.map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            assignment.assigned_to_type === 'venture_analyst' 
                              ? 'bg-blue-100 text-blue-600' 
                              : 'bg-green-100 text-green-600'
                          }`}>
                            {assignment.assigned_to_type === 'venture_analyst' ? (
                              <Users className="w-5 h-5" />
                            ) : (
                              <Building2 className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold">{assignment.assigned_to_name}</p>
                            <p className="text-sm text-gray-600">{assignment.assigned_to_email}</p>
                            <p className="text-xs text-gray-500">
                              Assigned on {formatDate(assignment.assigned_at)}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          className={
                            assignment.assigned_to_type === 'venture_analyst' 
                              ? 'bg-blue-100 text-blue-700 border-blue-200' 
                              : 'bg-green-100 text-green-700 border-green-200'
                          }
                        >
                          {assignment.assigned_to_type === 'venture_analyst' ? 'Venture Analyst' : 'Incubation Admin'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Assignments Message */}
            {(!profileData.assignments || profileData.assignments.length === 0) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Assigned Team Members</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No team members assigned yet</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Your venture analyst and incubation admin will be assigned by the system administrator
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No profile data available</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default UserProfile;
