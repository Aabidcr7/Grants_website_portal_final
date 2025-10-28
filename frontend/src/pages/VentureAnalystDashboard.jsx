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
  const [startups, setStartups] = useState([]);
  const [selectedStartup, setSelectedStartup] = useState('');
  const [trackingData, setTrackingData] = useState([]);
  const [allTrackingData, setAllTrackingData] = useState([]);
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTracking, setEditingTracking] = useState(null);
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
      const response = await axios.get(`${API}/grants/all`, {
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Venture Analyst Dashboard</h1>
              <p className="text-gray-600">Track startup grant applications and progress</p>
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

        {/* All Tracking Entries */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>All My Tracking Entries ({allTrackingData.length})</span>
              <div className="flex gap-2">
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
                            <SelectItem key={grant['Grant ID']} value={grant['Grant ID']}>
                              {grant.Name}
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
            {allTrackingData.length === 0 ? (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No tracking entries created yet.</p>
                <p className="text-sm text-gray-500 mt-2">Click "Add Grant Tracking" to create your first entry.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {allTrackingData.map((tracking) => (
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
            )}
          </CardContent>
        </Card>

        {/* Startup Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>View by Startup (Optional)</span>
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
                            <SelectItem key={grant['Grant ID']} value={grant['Grant ID']}>
                              {grant.Name}
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
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedStartup} onValueChange={setSelectedStartup}>
              <SelectTrigger>
                <SelectValue placeholder="Select a startup to view their grant tracking" />
              </SelectTrigger>
              <SelectContent>
                {startups.map((startup) => (
                  <SelectItem key={startup.id} value={startup.id}>
                    {startup.name} - {startup.founder_name} ({startup.industry}, {startup.location})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Tracking Data */}
        {selectedStartup && (
          <Card>
            <CardHeader>
              <CardTitle>
                Grant Tracking for {selectedStartupData?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5d248f] mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading tracking data...</p>
                </div>
              ) : trackingData.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No grant tracking data found for this startup.</p>
                  <p className="text-sm text-gray-500 mt-2">Click "Add Grant Tracking" to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {trackingData.map((tracking) => (
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
                            <p className="text-sm text-gray-600 mb-2">Grant ID: {tracking.grant_id}</p>
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
              )}
            </CardContent>
          </Card>
        )}

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
      </div>
    </div>
  );
};

export default VentureAnalystDashboard;
