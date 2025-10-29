import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { useToast } from '../hooks/use-toast';
import { 
  Users, 
  Target, 
  Plus, 
  Edit, 
  Trash2, 
  Upload, 
  Calendar,
  DollarSign,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Bell
} from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

// Helper to get full photo URL
const getPhotoUrl = (photoUrl) => {
  if (!photoUrl) return '';
  if (photoUrl.startsWith('http')) return photoUrl;
  return `${BACKEND_URL}${photoUrl}`;
};

const VentureAnalystDashboard = ({ user, handleLogout }) => {
  const [activeTab, setActiveTab] = useState('tracking');
  const [startups, setStartups] = useState([]);
  const [selectedStartup, setSelectedStartup] = useState('');
  const [trackingData, setTrackingData] = useState([]);
  const [allTrackingData, setAllTrackingData] = useState([]);
  const [grants, setGrants] = useState([]);
  const [grantsCurrentPage, setGrantsCurrentPage] = useState(1);
  const grantsPerPage = 10;
  const [loading, setLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTracking, setEditingTracking] = useState(null);
  const [isAddGrantDialogOpen, setIsAddGrantDialogOpen] = useState(false);
  const [selectedGrantDetails, setSelectedGrantDetails] = useState(null);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [newGrant, setNewGrant] = useState({
    name: '',
    sector: '',
    sector_other: '',
    eligibility: '',
    funding_amount: '',
    funding_type: '',
    funding_ratio: '',
    application_link: '',
    documents_required: '',
    deadline: '',
    region_focus: '',
    contact_info: '',
    place: '',
    soft_approval: 'No',
    stage: '',
    sector_focus: '',
    gender_focus: '',
    innovation_type: '',
    trl: '',
    impact_criteria: '',
    co_investment_requirement: '',
    matching_investment: '',
    repayment_terms: '',
    disbursement_schedule: '',
    mentorship_training: '',
    program_duration: '',
    success_metrics: ''
  });

  const SECTORS = [
    'Technology',
    'Healthcare',
    'Fintech',
    'E-commerce',
    'Education',
    'Manufacturing',
    'Agriculture',
    'Clean Energy',
    'Biotech',
    'AI/Machine Learning',
    'Other'
  ];
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    photo_url: user?.photo_url || '',
    calendly_link: user?.calendly_link || ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(user?.photo_url ? getPhotoUrl(user.photo_url) : '');
  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const { toast } = useToast();

  // Form states
  const [newTracking, setNewTracking] = useState({
    startup_id: '',
    grant_id: '',
    status: 'Draft',
    progress: '',
    notes: ''
  });

  const [updateTracking, setUpdateTracking] = useState({
    status: '',
    progress: '',
    notes: '',
    disbursed_amount: '',
    screenshot: null,
    screenshot_path: ''
  });

  useEffect(() => {
    loadStartups();
    loadGrants();
    loadAllTrackingData();
    loadNotifications();
  }, []);
  
  // Reset page to 1 when switching to grants tab
  useEffect(() => {
    if (activeTab === 'grants') {
      setGrantsCurrentPage(1);
    }
    
    // Auto-refresh tracking data every 5 seconds for real-time updates
    const refreshInterval = setInterval(() => {
      loadAllTrackingData();
      if (selectedStartup) {
        loadTrackingData(selectedStartup);
      }
      loadNotifications();
    }, 5000);
    
    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval);
  }, [selectedStartup]);

  // Manual refresh function
  const handleRefresh = async () => {
    await loadAllTrackingData();
    if (selectedStartup) {
      await loadTrackingData(selectedStartup);
    }
    toast({
      title: "Refreshed",
      description: "Tracking data updated successfully"
    });
  };

  const loadStartups = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/venture-analyst/assigned-startups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStartups(response.data.startups);
    } catch (error) {
      console.error('Error loading startups:', error);
      toast({
        title: "Error",
        description: "Failed to load assigned startups",
        variant: "destructive"
      });
    }
  };

  const loadGrants = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/venture-analyst/grants`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Extract grants array from response.data.grants
      const grantsArray = response.data.grants || [];
      setGrants(grantsArray);
    } catch (error) {
      console.error('Error loading grants:', error);
      // Set empty array on error to prevent crashes
      setGrants([]);
    }
  };

  const handleCreateGrant = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/venture-analyst/grants`, newGrant, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast({
        title: "Success",
        description: "Grant created successfully"
      });
      
      setIsAddGrantDialogOpen(false);
      setNewGrant({
        name: '',
        funding_amount: '',
        deadline: '',
        sector: '',
        eligibility: '',
        application_link: '',
        stage: '',
        soft_approval: 'No',
        sector_other: ''
      });
      
      // Reload grants
      await loadGrants();
    } catch (error) {
      console.error('Error creating grant:', error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to create grant",
        variant: "destructive"
      });
    }
  };

  const loadAllTrackingData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/tracking/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const trackingList = response.data.tracking || [];
      console.log('📊 Loaded all tracking data:', trackingList.length, 'entries');
      setAllTrackingData(trackingList);
    } catch (error) {
      console.error('❌ Error loading all tracking data:', error);
    }
  };

  const loadTrackingData = async (startupId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/tracking/grants/${startupId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrackingData(response.data.tracking);
    } catch (error) {
      console.error('Error loading tracking data:', error);
      toast({
        title: "Error",
        description: "Failed to load tracking data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/notifications/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const list = response.data.notifications || [];
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.read).length);
    } catch (error) {
      // Silently ignore, don't spam user
      console.error('Error loading notifications:', error);
    }
  };

  const markNotificationRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleCreateTracking = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/tracking/create`, newTracking, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast({
        title: "Success",
        description: "Grant tracking created successfully"
      });
      
      setIsCreateDialogOpen(false);
      setNewTracking({
        startup_id: '',
        grant_id: '',
        status: 'Draft',
        progress: '',
        notes: ''
      });
      
      // Force reload all tracking data
      await loadAllTrackingData();
      if (selectedStartup) {
        await loadTrackingData(selectedStartup);
      }
    } catch (error) {
      console.error('Error creating tracking:', error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to create tracking",
        variant: "destructive"
      });
    }
  };

  const handleUpdateTracking = async () => {
    try {
      // Validation for Applied status - screenshot is required
      if (updateTracking.status === 'Applied' && !updateTracking.screenshot && !updateTracking.screenshot_path) {
        toast({
          title: "Error",
          description: "Screenshot is required when status is Applied",
          variant: "destructive"
        });
        return;
      }
      
      // Validation for Approved/Disbursed status - amount is required
      if ((updateTracking.status === 'Approved' || updateTracking.status === 'Disbursed') && !updateTracking.disbursed_amount) {
        toast({
          title: "Error",
          description: "Disbursed amount is required when status is Approved or Disbursed",
          variant: "destructive"
        });
        return;
      }
      
      const token = localStorage.getItem('token');
      // First update the tracking data
      const updateData = {
        status: updateTracking.status,
        progress: updateTracking.progress,
        notes: updateTracking.notes,
        disbursed_amount: updateTracking.disbursed_amount ? parseFloat(updateTracking.disbursed_amount) : null
      };
      
      console.log('🔄 Updating tracking:', editingTracking.id, updateData);
      
      await axios.put(`${API}/tracking/${editingTracking.id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Tracking updated successfully');
      
      // If there's a screenshot file, upload it
      if (updateTracking.screenshot) {
        const formData = new FormData();
        formData.append('file', updateTracking.screenshot);
        
        await axios.post(`${API}/tracking/${editingTracking.id}/screenshot`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      
      toast({
        title: "Success",
        description: "Grant tracking updated successfully"
      });
      
      setIsEditDialogOpen(false);
      setEditingTracking(null);
      setUpdateTracking({
        status: '',
        progress: '',
        notes: '',
        disbursed_amount: '',
        screenshot: null,
        screenshot_path: ''
      });
      
      // Force reload all tracking data
      await loadAllTrackingData();
      if (selectedStartup) {
        await loadTrackingData(selectedStartup);
      }
    } catch (error) {
      console.error('Error updating tracking:', error);
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to update tracking",
        variant: "destructive"
      });
    }
  };

  const handleDeleteTracking = async (trackingId) => {
    if (!window.confirm('Are you sure you want to delete this tracking entry?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/tracking/${trackingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast({
        title: "Success",
        description: "Grant tracking deleted successfully"
      });
      
      // Force reload all tracking data
      await loadAllTrackingData();
      if (selectedStartup) {
        await loadTrackingData(selectedStartup);
      }
    } catch (error) {
      console.error('Error deleting tracking:', error);
      toast({
        title: "Error",
        description: "Failed to delete tracking",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (tracking) => {
    setEditingTracking(tracking);
    setUpdateTracking({
      status: tracking.status,
      progress: tracking.progress,
      notes: tracking.notes || '',
      disbursed_amount: tracking.disbursed_amount || '',
      screenshot: null,
      screenshot_path: tracking.screenshot_path || ''
    });
    setIsEditDialogOpen(true);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      let updatedPhotoUrl = profileForm.photo_url;
      
      // Upload photo if a file was selected
      if (photoFile) {
        const formData = new FormData();
        formData.append('file', photoFile);
        
        const uploadResponse = await axios.post(`${API}/auth/upload-photo`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        
        updatedPhotoUrl = uploadResponse.data.photo_url;
      }
      
      // Update profile with photo URL
      const response = await axios.put(`${API}/auth/profile`, {
        name: profileForm.name,
        photo_url: updatedPhotoUrl,
        calendly_link: profileForm.calendly_link
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update user in localStorage
      const updatedUser = response.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully"
      });
      
      setIsProfileDialogOpen(false);
      setPhotoFile(null);
      
      // Reload page to reflect changes
      window.location.reload();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Applied': return 'bg-blue-100 text-blue-800';
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Disbursed': return 'bg-emerald-100 text-emerald-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Draft': return <FileText className="w-4 h-4" />;
      case 'Applied': return <Clock className="w-4 h-4" />;
      case 'Approved': return <CheckCircle className="w-4 h-4" />;
      case 'Disbursed': return <DollarSign className="w-4 h-4" />;
      case 'Rejected': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const selectedStartupData = startups.find(s => s.id === selectedStartup);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <img 
                src="/myprobuddy-logo.png" 
                alt="MyProBuddy Logo" 
                className="h-12 w-auto"
              />
              <div className="border-l border-gray-300 pl-4">
                <h1 className="text-2xl font-bold text-gray-900">Venture Analyst Dashboard</h1>
                <p className="text-gray-600">Track startup grant applications and progress</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Notifications Bell */}
              <button
                type="button"
                className="relative p-2 rounded-lg border border-gray-200 hover:border-[#5d248f] hover:text-[#5d248f] bg-white"
                onClick={() => setShowNotifications((v) => !v)}
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              {/* Venture Analyst Profile */}
              <div className="flex items-center space-x-3 bg-white rounded-lg p-3 shadow-sm border border-gray-200">
                {user?.photo_url ? (
                  <img 
                    src={getPhotoUrl(user.photo_url)} 
                    alt={user.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#5d248f]"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                {!user?.photo_url ? (
                  <div className="w-12 h-12 rounded-full bg-[#5d248f] flex items-center justify-center text-white font-bold text-lg">
                    {user?.name?.charAt(0)?.toUpperCase() || 'V'}
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#5d248f] items-center justify-center text-white font-bold text-lg" style={{display: 'none'}}>
                    {user?.name?.charAt(0)?.toUpperCase() || 'V'}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-900">{user?.name}</span>
                  <span className="text-xs text-gray-500">Venture Analyst</span>
                </div>
              </div>
              
              {/* Edit Profile Button */}
              <Button 
                variant="outline" 
                className="border-gray-300 hover:border-[#5d248f] hover:text-[#5d248f]"
                onClick={() => {
                  setProfileForm({
                    name: user?.name || '',
                    photo_url: user?.photo_url || '',
                    calendly_link: user?.calendly_link || ''
                  });
                  setPhotoFile(null);
                  setPhotoPreview(user?.photo_url ? getPhotoUrl(user.photo_url) : '');
                  setIsProfileDialogOpen(true);
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
              
              {/* Calendly Link Button */}
              {user?.calendly_link && (
                <Button 
                  variant="outline" 
                  className="border-[#5d248f] text-[#5d248f] hover:bg-[#5d248f] hover:text-white"
                  onClick={() => window.open(user.calendly_link, '_blank')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Meeting
                </Button>
              )}
              
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notifications Panel */}
        {showNotifications && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Notifications {unreadCount > 0 ? `( ${unreadCount} unread )` : ''}</CardTitle>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <div className="text-center py-6 text-gray-600">No notifications</div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((n) => (
                    <div key={n.id} className={`flex items-start justify-between p-3 rounded-lg border ${n.read ? 'bg-white' : 'bg-purple-50 border-purple-200'}`}>
                      <div>
                        <div className="font-semibold text-gray-900">{n.title || 'Notification'}</div>
                        <div className="text-sm text-gray-700">{n.message}</div>
                        <div className="text-xs text-gray-500 mt-1">{new Date(n.created_at).toLocaleString()}</div>
                      </div>
                      {!n.read && (
                        <Button size="sm" variant="outline" onClick={() => markNotificationRead(n.id)}>
                          Mark read
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="card bg-gradient-to-br from-[#5d248f] to-[#4a1d73] text-white shadow-lg border-0" style={{background: 'linear-gradient(135deg, #5d248f 0%, #4a1d73 100%)'}}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm">Total Startups</p>
                  <p className="text-3xl font-bold mt-1 text-white">{startups.length}</p>
                </div>
                <Users className="w-12 h-12 text-white opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Tracking</p>
                  <p className="text-3xl font-bold mt-1 text-blue-600">{allTrackingData.length}</p>
                </div>
                <Target className="w-12 h-12 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Applied</p>
                  <p className="text-3xl font-bold mt-1 text-blue-600">
                    {allTrackingData.filter(t => t.status === 'Applied').length}
                  </p>
                </div>
                <Clock className="w-12 h-12 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Disbursed</p>
                  <p className="text-3xl font-bold mt-1 text-green-600">
                    {allTrackingData.filter(t => t.status === 'Disbursed').length}
                  </p>
                </div>
                <DollarSign className="w-12 h-12 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-2 border-b border-gray-200">
            <Button
              variant={activeTab === 'tracking' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('tracking')}
              className={activeTab === 'tracking' ? 'bg-[#5d248f] hover:bg-[#4a1d73] text-white' : 'text-gray-600 hover:text-[#5d248f]'}
            >
              <Target className="w-4 h-4 mr-2" />
              Grant Tracking
            </Button>
            <Button
              variant={activeTab === 'grants' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('grants')}
              className={activeTab === 'grants' ? 'bg-[#5d248f] hover:bg-[#4a1d73] text-white' : 'text-gray-600 hover:text-[#5d248f]'}
            >
              <FileText className="w-4 h-4 mr-2" />
              Grants Management
            </Button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'tracking' && (
          <>
            {/* All Tracking Entries */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>All My Tracking Entries ({allTrackingData.length})</span>
              <div className="flex gap-2 items-center">
                <Select value={selectedStartup} onValueChange={(value) => setSelectedStartup(value === 'all' ? '' : value)}>
                  <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="Filter by startup..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Startups</SelectItem>
                    {startups.map((startup) => (
                      <SelectItem key={startup.id} value={startup.id}>
                        {startup.name} - {startup.founder_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  className="border-[#5d248f] text-[#5d248f] hover:bg-[#5d248f] hover:text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#5d248f] hover:bg-[#4a1d73]">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Grant Tracking
                    </Button>
                  </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create Grant Tracking</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="startup">Startup</Label>
                      <Select 
                        value={newTracking.startup_id} 
                        onValueChange={(value) => setNewTracking({...newTracking, startup_id: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select startup" />
                        </SelectTrigger>
                        <SelectContent>
                          {startups.map((startup) => (
                            <SelectItem key={startup.id} value={startup.id}>
                              {startup.name} - {startup.founder_name} ({startup.industry})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="grant">Grant</Label>
                      <Select 
                        value={newTracking.grant_id} 
                        onValueChange={(value) => setNewTracking({...newTracking, grant_id: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select grant" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(grants) ? grants.map((grant) => (
                            <SelectItem key={grant.grant_id} value={grant.grant_id}>
                              {grant.name}
                            </SelectItem>
                          )) : []}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={newTracking.status} 
                        onValueChange={(value) => setNewTracking({...newTracking, status: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Draft">Draft</SelectItem>
                          <SelectItem value="Applied">Applied</SelectItem>
                          <SelectItem value="Approved">Approved</SelectItem>
                          <SelectItem value="Disbursed">Disbursed</SelectItem>
                          <SelectItem value="Rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="progress">Progress</Label>
                      <Input
                        id="progress"
                        value={newTracking.progress}
                        onChange={(e) => setNewTracking({...newTracking, progress: e.target.value})}
                        placeholder="e.g., 25% complete"
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={newTracking.notes}
                        onChange={(e) => setNewTracking({...newTracking, notes: e.target.value})}
                        placeholder="Additional notes..."
                      />
                    </div>
                    <Button onClick={handleCreateTracking} className="w-full">
                      Create Tracking
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              // Filter tracking data based on selected startup
              const displayData = selectedStartup 
                ? allTrackingData.filter(tracking => tracking.startup_id === selectedStartup)
                : allTrackingData;
              
              return displayData.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {selectedStartup ? 'No tracking entries found for this startup.' : 'No tracking entries created yet.'}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">Click "Add Grant Tracking" to create your first entry.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayData.map((tracking) => (
                  <Card key={tracking.id} className="border-l-4 border-l-[#5d248f]">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold">{tracking.grant_name}</h3>
                            <Badge className={getStatusColor(tracking.status)}>
                              {getStatusIcon(tracking.status)}
                              <span className="ml-1">{tracking.status}</span>
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="font-semibold">Startup:</span> {tracking.startup_name}
                          </p>
                          <p className="text-sm text-gray-600 mb-1">Grant ID: {tracking.grant_id}</p>
                          <p className="text-sm text-gray-600 mb-2">Progress: {tracking.progress}</p>
                          {tracking.notes && (
                            <p className="text-sm text-gray-700 mb-2">{tracking.notes}</p>
                          )}
                          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                            {tracking.applied_date && (
                              <span className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                Applied: {new Date(tracking.applied_date).toLocaleDateString()}
                              </span>
                            )}
                            {tracking.approved_date && (
                              <span className="flex items-center">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Approved: {new Date(tracking.approved_date).toLocaleDateString()}
                              </span>
                            )}
                            {tracking.disbursed_date && (
                              <span className="flex items-center">
                                <DollarSign className="w-3 h-3 mr-1" />
                                Disbursed: {new Date(tracking.disbursed_date).toLocaleDateString()}
                              </span>
                            )}
                            {tracking.disbursed_amount && (
                              <span className="flex items-center">
                                <DollarSign className="w-3 h-3 mr-1" />
                                Amount: Rs. {tracking.disbursed_amount}
                              </span>
                            )}
                          </div>

                          {/* Screenshot Preview for Applied Status */}
                          {tracking.status === 'Applied' && tracking.screenshot_path && (
                            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mt-4">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold text-yellow-900 flex items-center">
                                  <FileText className="w-3 h-3 mr-1" />
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
                                  className="w-full h-auto max-h-64 object-contain bg-white"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                                <div className="hidden items-center justify-center h-32 bg-gray-100">
                                  <p className="text-gray-500 text-xs">Screenshot not available</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(tracking)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteTracking(tracking.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
            })()}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update Grant Tracking</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  value={updateTracking.status} 
                  onValueChange={(value) => setUpdateTracking({...updateTracking, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Applied">Applied</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Disbursed">Disbursed</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-progress">Progress</Label>
                <Input
                  id="edit-progress"
                  value={updateTracking.progress}
                  onChange={(e) => setUpdateTracking({...updateTracking, progress: e.target.value})}
                  placeholder="e.g., 50% complete"
                />
              </div>
              {updateTracking.status === 'Applied' && (
                <div>
                  <Label htmlFor="screenshot">Upload Screenshot <span className="text-red-500">*</span> (Required)</Label>
                  <Input
                    id="screenshot"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setUpdateTracking({...updateTracking, screenshot: e.target.files[0]})}
                    required
                  />
                  {updateTracking.screenshot_path && (
                    <p className="text-sm text-green-600 mt-1">✓ Screenshot already uploaded</p>
                  )}
                  {updateTracking.screenshot && (
                    <p className="text-sm text-blue-600 mt-1">✓ New screenshot selected: {updateTracking.screenshot.name}</p>
                  )}
                </div>
              )}
              {(updateTracking.status === 'Approved' || updateTracking.status === 'Disbursed') && (
                <div>
                  <Label htmlFor="disbursed-amount">Disbursed Amount (Rs.) <span className="text-red-500">*</span> (Required)</Label>
                  <Input
                    id="disbursed-amount"
                    type="number"
                    value={updateTracking.disbursed_amount}
                    onChange={(e) => setUpdateTracking({...updateTracking, disbursed_amount: e.target.value})}
                    placeholder="Enter disbursed amount"
                    required
                  />
                </div>
              )}
              <div>
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={updateTracking.notes}
                  onChange={(e) => setUpdateTracking({...updateTracking, notes: e.target.value})}
                  placeholder="Additional notes..."
                />
              </div>
              <Button onClick={handleUpdateTracking} className="w-full">
                Update Tracking
              </Button>
            </div>
          </DialogContent>
        </Dialog>
          </>
        )}

        {activeTab === 'grants' && (() => {
          // Pagination logic for grants
          const indexOfLastGrant = grantsCurrentPage * grantsPerPage;
          const indexOfFirstGrant = indexOfLastGrant - grantsPerPage;
          const currentGrants = grants.slice(indexOfFirstGrant, indexOfLastGrant);
          const totalGrantsPages = Math.ceil(grants.length / grantsPerPage);
          
          return (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Grants Database</h2>
                  {grants.length > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      Showing {indexOfFirstGrant + 1}-{Math.min(indexOfLastGrant, grants.length)} of {grants.length} grants
                    </p>
                  )}
                </div>
                <Button onClick={() => setIsAddGrantDialogOpen(true)} className="bg-[#5d248f] hover:bg-[#4a1d70]">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Grant
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {currentGrants.map((grant) => (
                <Card key={grant.grant_id} className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-gray-900">{grant.name}</h3>
                      {grant.soft_approval === 'Yes' && <Badge className="bg-green-500">Soft Approved</Badge>}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedGrantDetails(grant);
                        setIsViewDetailsOpen(true);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Funding:</span> {grant.funding_amount}</div>
                    <div><span className="font-medium">Deadline:</span> {grant.deadline}</div>
                    <div><span className="font-medium">Sector:</span> {grant.sector}</div>
                    <div><span className="font-medium">Stage:</span> {grant.stage}</div>
                  </div>
                  <div className="mt-2">
                    {grant.application_link && (
                      <a href={grant.application_link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                        Application Link →
                      </a>
                    )}
                  </div>
                  {grant.eligibility && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600"><span className="font-medium">Eligibility:</span> {grant.eligibility.substring(0, 150)}{grant.eligibility.length > 150 ? '...' : ''}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>
            
            {/* Pagination Controls */}
            {totalGrantsPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setGrantsCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={grantsCurrentPage === 1}
                  className="px-4"
                >
                  Previous
                </Button>
                
                <div className="flex space-x-1">
                  {[...Array(totalGrantsPages)].map((_, idx) => (
                    <Button
                      key={idx}
                      variant={grantsCurrentPage === idx + 1 ? 'default' : 'outline'}
                      onClick={() => setGrantsCurrentPage(idx + 1)}
                      className={grantsCurrentPage === idx + 1 ? 'bg-[#5d248f] hover:bg-[#4a1d70]' : ''}
                    >
                      {idx + 1}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => setGrantsCurrentPage(prev => Math.min(prev + 1, totalGrantsPages))}
                  disabled={grantsCurrentPage === totalGrantsPages}
                  className="px-4"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        );
        })()}

        {/* Add Grant Dialog */}
        <Dialog open={isAddGrantDialogOpen} onOpenChange={setIsAddGrantDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Grant</DialogTitle>
              <p className="text-sm text-gray-500">* Required fields</p>
            </DialogHeader>
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="grant-name">Grant Name *</Label>
                    <Input
                      id="grant-name"
                      value={newGrant.name}
                      onChange={(e) => setNewGrant({...newGrant, name: e.target.value})}
                      placeholder="Enter grant name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="sector">Sector *</Label>
                    <Select 
                      value={newGrant.sector} 
                      onValueChange={(value) => setNewGrant({...newGrant, sector: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select sector" />
                      </SelectTrigger>
                      <SelectContent>
                        {SECTORS.map((sector) => (
                          <SelectItem key={sector} value={sector}>
                            {sector}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {newGrant.sector === 'Other' && (
                      <Input
                        className="mt-2"
                        value={newGrant.sector_other}
                        onChange={(e) => setNewGrant({...newGrant, sector_other: e.target.value})}
                        placeholder="Specify other sector"
                      />
                    )}
                  </div>
                </div>
                <div>
                  <Label htmlFor="eligibility">Eligibility Criteria</Label>
                  <Textarea
                    id="eligibility"
                    value={newGrant.eligibility}
                    onChange={(e) => setNewGrant({...newGrant, eligibility: e.target.value})}
                    placeholder="Enter eligibility criteria"
                  />
                </div>
              </div>

              {/* Funding Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Funding Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="funding-amount">Funding Amount</Label>
                    <Input
                      id="funding-amount"
                      value={newGrant.funding_amount}
                      onChange={(e) => setNewGrant({...newGrant, funding_amount: e.target.value})}
                      placeholder="e.g., ₹10,00,000"
                    />
                  </div>
                  <div>
                    <Label htmlFor="funding-type">Funding Type</Label>
                    <Input
                      id="funding-type"
                      value={newGrant.funding_type}
                      onChange={(e) => setNewGrant({...newGrant, funding_type: e.target.value})}
                      placeholder="e.g., Grant, Loan, Equity"
                    />
                  </div>
                  <div>
                    <Label htmlFor="funding-ratio">Funding Ratio</Label>
                    <Input
                      id="funding-ratio"
                      value={newGrant.funding_ratio}
                      onChange={(e) => setNewGrant({...newGrant, funding_ratio: e.target.value})}
                      placeholder="e.g., 100%, 80%"
                    />
                  </div>
                  <div>
                    <Label htmlFor="co-investment">Co-investment Requirement</Label>
                    <Input
                      id="co-investment"
                      value={newGrant.co_investment_requirement}
                      onChange={(e) => setNewGrant({...newGrant, co_investment_requirement: e.target.value})}
                      placeholder="e.g., Yes, No"
                    />
                  </div>
                  <div>
                    <Label htmlFor="matching-investment">Matching Investment</Label>
                    <Input
                      id="matching-investment"
                      value={newGrant.matching_investment}
                      onChange={(e) => setNewGrant({...newGrant, matching_investment: e.target.value})}
                      placeholder="e.g., 20%, 30%"
                    />
                  </div>
                  <div>
                    <Label htmlFor="repayment-terms">Repayment Terms</Label>
                    <Input
                      id="repayment-terms"
                      value={newGrant.repayment_terms}
                      onChange={(e) => setNewGrant({...newGrant, repayment_terms: e.target.value})}
                      placeholder="e.g., 5 years @ 8%"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="disbursement">Disbursement Schedule</Label>
                  <Input
                    id="disbursement"
                    value={newGrant.disbursement_schedule}
                    onChange={(e) => setNewGrant({...newGrant, disbursement_schedule: e.target.value})}
                    placeholder="e.g., Milestone-based, Quarterly"
                  />
                </div>
              </div>

              {/* Application Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Application Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="application-link">Application Link</Label>
                    <Input
                      id="application-link"
                      value={newGrant.application_link}
                      onChange={(e) => setNewGrant({...newGrant, application_link: e.target.value})}
                      placeholder="https://example.com/apply"
                    />
                  </div>
                  <div>
                    <Label htmlFor="deadline">Deadline</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={newGrant.deadline}
                      onChange={(e) => setNewGrant({...newGrant, deadline: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="documents">Documents Required</Label>
                    <Input
                      id="documents"
                      value={newGrant.documents_required}
                      onChange={(e) => setNewGrant({...newGrant, documents_required: e.target.value})}
                      placeholder="e.g., Business Plan, Pitch Deck"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-info">Contact Info</Label>
                    <Input
                      id="contact-info"
                      value={newGrant.contact_info}
                      onChange={(e) => setNewGrant({...newGrant, contact_info: e.target.value})}
                      placeholder="contact@example.com"
                    />
                  </div>
                </div>
              </div>

              {/* Location & Focus */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Location & Focus Areas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="region">Region/Focus</Label>
                    <Input
                      id="region"
                      value={newGrant.region_focus}
                      onChange={(e) => setNewGrant({...newGrant, region_focus: e.target.value})}
                      placeholder="e.g., National, Regional"
                    />
                  </div>
                  <div>
                    <Label htmlFor="place">Place</Label>
                    <Input
                      id="place"
                      value={newGrant.place}
                      onChange={(e) => setNewGrant({...newGrant, place: e.target.value})}
                      placeholder="e.g., Mumbai, Delhi"
                    />
                  </div>
                  <div>
                    <Label htmlFor="stage">Stage of Startup</Label>
                    <Select 
                      value={newGrant.stage} 
                      onValueChange={(value) => setNewGrant({...newGrant, stage: value})}
                    >
                      <SelectTrigger>
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
                  <div>
                    <Label htmlFor="sector-focus">Sector Focus</Label>
                    <Input
                      id="sector-focus"
                      value={newGrant.sector_focus}
                      onChange={(e) => setNewGrant({...newGrant, sector_focus: e.target.value})}
                      placeholder="e.g., Technology, Healthcare"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender-focus">Gender Focus</Label>
                    <Input
                      id="gender-focus"
                      value={newGrant.gender_focus}
                      onChange={(e) => setNewGrant({...newGrant, gender_focus: e.target.value})}
                      placeholder="e.g., Woman-owned, General"
                    />
                  </div>
                </div>
              </div>

              {/* Innovation & Impact */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Innovation & Impact</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="innovation-type">Innovation Type</Label>
                    <Input
                      id="innovation-type"
                      value={newGrant.innovation_type}
                      onChange={(e) => setNewGrant({...newGrant, innovation_type: e.target.value})}
                      placeholder="e.g., Product, Process, Social"
                    />
                  </div>
                  <div>
                    <Label htmlFor="trl">TRL (Technology Readiness Level)</Label>
                    <Input
                      id="trl"
                      value={newGrant.trl}
                      onChange={(e) => setNewGrant({...newGrant, trl: e.target.value})}
                      placeholder="e.g., 5-7, 3-5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="impact-criteria">Impact Criteria</Label>
                    <Input
                      id="impact-criteria"
                      value={newGrant.impact_criteria}
                      onChange={(e) => setNewGrant({...newGrant, impact_criteria: e.target.value})}
                      placeholder="e.g., Social Impact, Economic Impact"
                    />
                  </div>
                  <div>
                    <Label htmlFor="success-metrics">Success Metrics</Label>
                    <Input
                      id="success-metrics"
                      value={newGrant.success_metrics}
                      onChange={(e) => setNewGrant({...newGrant, success_metrics: e.target.value})}
                      placeholder="e.g., Revenue Growth, User Acquisition"
                    />
                  </div>
                </div>
              </div>

              {/* Program Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Program Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="program-duration">Program Duration</Label>
                    <Input
                      id="program-duration"
                      value={newGrant.program_duration}
                      onChange={(e) => setNewGrant({...newGrant, program_duration: e.target.value})}
                      placeholder="e.g., 12 months, 18 months"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mentorship">Mentorship/Training</Label>
                    <Input
                      id="mentorship"
                      value={newGrant.mentorship_training}
                      onChange={(e) => setNewGrant({...newGrant, mentorship_training: e.target.value})}
                      placeholder="e.g., Yes, No"
                    />
                  </div>
                  <div>
                    <Label htmlFor="soft-approval">Soft Approval</Label>
                    <Select 
                      value={newGrant.soft_approval} 
                      onValueChange={(value) => setNewGrant({...newGrant, soft_approval: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Yes">Yes</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button onClick={handleCreateGrant} className="w-full">
                Create Grant
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Profile Edit Dialog */}
        <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="profile-name">Name</Label>
                <Input
                  id="profile-name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                  placeholder="Your full name"
                />
              </div>
              
              {/* Photo Upload Section */}
              <div>
                <Label htmlFor="profile-photo">Profile Photo</Label>
                <div className="flex items-center space-x-4 mt-2">
                  {/* Photo Preview */}
                  <div className="flex-shrink-0">
                    {photoPreview ? (
                      <img 
                        src={photoPreview} 
                        alt="Profile preview"
                        className="w-20 h-20 rounded-full object-cover border-2 border-[#5d248f]"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-2xl font-bold">
                        {profileForm.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  
                  {/* Upload Button */}
                  <div className="flex-1">
                    <Input
                      id="profile-photo"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 mt-1">Upload your profile photo (JPG, PNG, GIF, WEBP)</p>
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="profile-calendly">Calendly Link</Label>
                <Input
                  id="profile-calendly"
                  value={profileForm.calendly_link}
                  onChange={(e) => setProfileForm({...profileForm, calendly_link: e.target.value})}
                  placeholder="https://calendly.com/your-link"
                />
                <p className="text-xs text-gray-500 mt-1">Your Calendly scheduling link</p>
              </div>
              <Button 
                onClick={handleProfileUpdate} 
                className="w-full bg-[#5d248f] hover:bg-[#4a1d73]"
              >
                Save Profile
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Grant Details Dialog */}
        <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Grant Details</DialogTitle>
            </DialogHeader>
            {selectedGrantDetails && (
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg border-b pb-2">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Grant Name:</span> <span className="text-gray-700">{selectedGrantDetails.name || 'N/A'}</span></div>
                    <div><span className="font-medium">Grant ID:</span> <span className="text-gray-700">{selectedGrantDetails.grant_id || 'N/A'}</span></div>
                    <div><span className="font-medium">Sector:</span> <span className="text-gray-700">{selectedGrantDetails.sector || 'N/A'}</span></div>
                    <div><span className="font-medium">Soft Approval:</span> <Badge className={selectedGrantDetails.soft_approval === 'Yes' ? 'bg-green-500' : 'bg-gray-500'}>{selectedGrantDetails.soft_approval || 'No'}</Badge></div>
                  </div>
                  {selectedGrantDetails.eligibility && (
                    <div className="mt-2">
                      <span className="font-medium">Eligibility Criteria:</span>
                      <p className="text-gray-700 mt-1">{selectedGrantDetails.eligibility}</p>
                    </div>
                  )}
                </div>

                {/* Funding Details */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg border-b pb-2">Funding Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Funding Amount:</span> <span className="text-gray-700">{selectedGrantDetails.funding_amount || 'N/A'}</span></div>
                    <div><span className="font-medium">Funding Type:</span> <span className="text-gray-700">{selectedGrantDetails.funding_type || 'N/A'}</span></div>
                    <div><span className="font-medium">Funding Ratio:</span> <span className="text-gray-700">{selectedGrantDetails.funding_ratio || 'N/A'}</span></div>
                    <div><span className="font-medium">Co-investment Required:</span> <span className="text-gray-700">{selectedGrantDetails.co_investment_requirement || 'N/A'}</span></div>
                    <div><span className="font-medium">Matching Investment:</span> <span className="text-gray-700">{selectedGrantDetails.matching_investment || 'N/A'}</span></div>
                    <div><span className="font-medium">Repayment Terms:</span> <span className="text-gray-700">{selectedGrantDetails.repayment_terms || 'N/A'}</span></div>
                    <div className="col-span-2"><span className="font-medium">Disbursement Schedule:</span> <span className="text-gray-700">{selectedGrantDetails.disbursement_schedule || 'N/A'}</span></div>
                  </div>
                </div>

                {/* Application Details */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg border-b pb-2">Application Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Deadline:</span> <span className="text-gray-700">{selectedGrantDetails.deadline || 'N/A'}</span></div>
                    <div><span className="font-medium">Contact Info:</span> <span className="text-gray-700">{selectedGrantDetails.contact_info || 'N/A'}</span></div>
                    <div className="col-span-2"><span className="font-medium">Documents Required:</span> <span className="text-gray-700">{selectedGrantDetails.documents_required || 'N/A'}</span></div>
                    <div className="col-span-2">
                      <span className="font-medium">Application Link:</span>{' '}
                      {selectedGrantDetails.application_link ? (
                        <a href={selectedGrantDetails.application_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {selectedGrantDetails.application_link}
                        </a>
                      ) : (
                        <span className="text-gray-700">N/A</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Location & Focus */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg border-b pb-2">Location & Focus Areas</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Region/Focus:</span> <span className="text-gray-700">{selectedGrantDetails.region_focus || 'N/A'}</span></div>
                    <div><span className="font-medium">Place:</span> <span className="text-gray-700">{selectedGrantDetails.place || 'N/A'}</span></div>
                    <div><span className="font-medium">Stage of Startup:</span> <span className="text-gray-700">{selectedGrantDetails.stage || 'N/A'}</span></div>
                    <div><span className="font-medium">Sector Focus:</span> <span className="text-gray-700">{selectedGrantDetails.sector_focus || 'N/A'}</span></div>
                    <div><span className="font-medium">Gender Focus:</span> <span className="text-gray-700">{selectedGrantDetails.gender_focus || 'N/A'}</span></div>
                  </div>
                </div>

                {/* Innovation & Impact */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg border-b pb-2">Innovation & Impact</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Innovation Type:</span> <span className="text-gray-700">{selectedGrantDetails.innovation_type || 'N/A'}</span></div>
                    <div><span className="font-medium">TRL:</span> <span className="text-gray-700">{selectedGrantDetails.trl || 'N/A'}</span></div>
                    <div><span className="font-medium">Impact Criteria:</span> <span className="text-gray-700">{selectedGrantDetails.impact_criteria || 'N/A'}</span></div>
                    <div><span className="font-medium">Success Metrics:</span> <span className="text-gray-700">{selectedGrantDetails.success_metrics || 'N/A'}</span></div>
                  </div>
                </div>

                {/* Program Details */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg border-b pb-2">Program Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Program Duration:</span> <span className="text-gray-700">{selectedGrantDetails.program_duration || 'N/A'}</span></div>
                    <div><span className="font-medium">Mentorship/Training:</span> <span className="text-gray-700">{selectedGrantDetails.mentorship_training || 'N/A'}</span></div>
                    <div><span className="font-medium">Created At:</span> <span className="text-gray-700">{selectedGrantDetails.created_at || 'N/A'}</span></div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default VentureAnalystDashboard;
