import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Users, Building2, FileText, BarChart3, Plus, UserPlus, Link2 } from 'lucide-react';
import axios from 'axios';
import { MultiSelect } from '../components/ui/multi-select';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const AdminDashboard = ({ user, handleLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [kpis, setKpis] = useState({});
  const [startups, setStartups] = useState([]);
  const [grants, setGrants] = useState([]);
  const [ventureAnalysts, setVentureAnalysts] = useState([]);
  const [incubationAdmins, setIncubationAdmins] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [grantsCurrentPage, setGrantsCurrentPage] = useState(1);
  const startupsPerPage = 10;
  const grantsPerPage = 10;
  
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [isAssignStartupsDialogOpen, setIsAssignStartupsDialogOpen] = useState(false);
  const [isAddGrantDialogOpen, setIsAddGrantDialogOpen] = useState(false);
  const [isStartupDetailsDialogOpen, setIsStartupDetailsDialogOpen] = useState(false);
  const [selectedStartup, setSelectedStartup] = useState(null);
  
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', tier: 'venture_analyst' });
  const [assignmentData, setAssignmentData] = useState({ user_id: '', startup_ids: [], assigned_to_type: 'venture_analyst' });
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
  
  useEffect(() => {
    if (user?.tier === 'admin') {
      fetchKPIs();
      fetchStartups();
      fetchGrants();
      fetchUsers();
    }
  }, [user]);
  
  // Reset page to 1 when switching tabs
  useEffect(() => {
    if (activeTab === 'startups') {
      setCurrentPage(1);
    } else if (activeTab === 'grants') {
      setGrantsCurrentPage(1);
    }
  }, [activeTab]);
  
  const fetchKPIs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin/kpis`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setKpis(response.data);
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    }
  };
  
  const fetchStartups = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin/all-startups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Fetched startups:', response.data.startups);
      setStartups(response.data.startups);
    } catch (error) {
      console.error('Error fetching startups:', error);
    }
  };
  
  const fetchGrants = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin/grants`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGrants(response.data.grants);
    } catch (error) {
      console.error('Error fetching grants:', error);
    }
  };
  
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Fetched users:', response.data);
      setVentureAnalysts(response.data.venture_analysts || []);
      setIncubationAdmins(response.data.incubation_admins || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    }
  };
  
  const handleCreateUser = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/admin/create-user`, newUser, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('User created successfully');
      setNewUser({ name: '', email: '', password: '', tier: 'venture_analyst' });
      setIsCreateUserDialogOpen(false);
      fetchUsers();
      fetchKPIs();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create user');
    }
  };
  
  const handleAssignStartups = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/admin/assign-startups`, assignmentData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Assigned ${assignmentData.startup_ids.length} startup(s)`);
      setAssignmentData({ user_id: '', startup_ids: [], assigned_to_type: 'venture_analyst' });
      setIsAssignStartupsDialogOpen(false);
      fetchStartups();
    } catch (error) {
      toast.error('Failed to assign startups');
    }
  };
  
  const handleAddGrant = async () => {
    try {
      const token = localStorage.getItem('token');
      const grantData = {
        ...newGrant,
        sector: newGrant.sector === 'Other' ? newGrant.sector_other : newGrant.sector
      };
      delete grantData.sector_other;
      
      await axios.post(`${API}/admin/grants`, grantData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Grant added successfully');
      setNewGrant({ name: '', funding_amount: '', deadline: '', sector: '', eligibility: '', application_link: '', stage: '', soft_approval: 'No', sector_other: '' });
      setIsAddGrantDialogOpen(false);
      fetchGrants();
    } catch (error) {
      toast.error('Failed to add grant');
    }
  };
  
  const handleViewStartupDetails = (startup) => {
    setSelectedStartup(startup);
    setIsStartupDetailsDialogOpen(true);
  };
  
  const getTierColor = (tier) => {
    const colors = { free: 'bg-gray-500', premium: 'bg-blue-500', expert: 'bg-purple-500' };
    return colors[tier] || 'bg-gray-500';
  };
  
  const getStatusColor = (status) => {
    const colors = { applied: 'bg-blue-500', approved: 'bg-green-500', disbursed: 'bg-emerald-500', rejected: 'bg-red-500', draft: 'bg-gray-500' };
    return colors[status?.toLowerCase()] || 'bg-gray-500';
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
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
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">Manage startups, users, and grants</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-semibold text-gray-900">{user?.name}</p>
                <p className="text-sm text-gray-600">Administrator</p>
              </div>
              <Button variant="outline" onClick={handleLogout} className="border-red-300 text-red-600 hover:bg-red-50">
                Logout
              </Button>
            </div>
          </div>
          
          <div className="flex space-x-4 border-t pt-4">
            {['overview', 'startups', 'users', 'grants'].map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? 'default' : 'outline'}
                onClick={() => setActiveTab(tab)}
                className={activeTab === tab ? 'bg-[#5d248f] hover:bg-[#4a1d70]' : ''}
              >
                {tab === 'overview' && <BarChart3 className="w-4 h-4 mr-2" />}
                {tab === 'startups' && <Building2 className="w-4 h-4 mr-2" />}
                {tab === 'users' && <Users className="w-4 h-4 mr-2" />}
                {tab === 'grants' && <FileText className="w-4 h-4 mr-2" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Key Performance Indicators</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { label: 'Total Startups', value: kpis.total_startups || 0, icon: Building2, color: 'blue' },
                { label: 'Venture Analysts', value: kpis.total_analysts || 0, icon: Users, color: 'purple' },
                { label: 'Incubation Admins', value: kpis.total_incubation_admins || 0, icon: Users, color: 'green' },
                { label: 'Total Applications', value: kpis.total_applications || 0, icon: FileText, color: 'orange' }
              ].map((kpi, idx) => (
                <Card key={idx} className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 bg-${kpi.color}-100 rounded-lg`}>
                      <kpi.icon className={`w-6 h-6 text-${kpi.color}-600`} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{kpi.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tier Distribution</h3>
                <div className="space-y-3">
                  {kpis.tier_distribution && Object.entries(kpis.tier_distribution).map(([tier, count]) => (
                    <div key={tier} className="flex justify-between items-center">
                      <span className="text-gray-700 capitalize">{tier}</span>
                      <Badge className={getTierColor(tier)}>{count}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Status</h3>
                <div className="space-y-3">
                  {kpis.application_status && Object.entries(kpis.application_status).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center">
                      <span className="text-gray-700 capitalize">{status}</span>
                      <Badge className={getStatusColor(status)}>{count}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}
        
        {activeTab === 'startups' && (() => {
          // Sort startups by created_at (newest first)
          const sortedStartups = [...startups].sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
          );
          
          // Pagination logic
          const indexOfLastStartup = currentPage * startupsPerPage;
          const indexOfFirstStartup = indexOfLastStartup - startupsPerPage;
          const currentStartups = sortedStartups.slice(indexOfFirstStartup, indexOfLastStartup);
          const totalPages = Math.ceil(sortedStartups.length / startupsPerPage);
          
          return (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">All Startups</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Showing {indexOfFirstStartup + 1}-{Math.min(indexOfLastStartup, sortedStartups.length)} of {sortedStartups.length} startups
                  </p>
                </div>
                <Button onClick={() => setIsAssignStartupsDialogOpen(true)} className="bg-[#5d248f] hover:bg-[#4a1d70]">
                  <Link2 className="w-4 h-4 mr-2" />
                  Assign Startups
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {currentStartups.map((startup) => (
                <Card key={startup.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{startup.name}</h3>
                        <Badge className={getTierColor(startup.tier)}>{startup.tier}</Badge>
                        {startup.assigned_analyst?.type === 'incubation_admin' && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                            📍 {startup.assigned_analyst.name}
                          </Badge>
                        )}
                        {startup.registration_source_info && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                            🔗 Via {startup.registration_source_info.name}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{startup.email}</p>
                      {startup.assigned_analyst && (
                        <p className="text-sm text-gray-700 mb-2">
                          <span className="font-medium">Assigned to:</span> {startup.assigned_analyst.name}
                          <Badge variant="outline" className="ml-2">{startup.assigned_analyst.type}</Badge>
                        </p>
                      )}
                      <div className="mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2">Matched Grants ({startup.matched_grants?.length || 0})</p>
                        {startup.matched_grants?.slice(0, 3).map((grant, idx) => (
                          <div key={idx} className="text-sm text-gray-600 ml-4">• {grant.name} - {grant.funding_amount}</div>
                        ))}
                      </div>
                      {startup.tier === 'expert' && startup.tracking?.length > 0 && (
                        <div className="mt-4 border-t pt-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Grant Applications</p>
                          {startup.tracking.map((track, idx) => (
                            <div key={idx} className="text-sm text-gray-600 ml-4 mb-1">
                              • {track.grant_name || 'Unknown Grant'} (ID: {track.grant_id}) - <Badge className={getStatusColor(track.status)}>{track.status}</Badge>
                              <span className="ml-2">({track.progress})</span>
                              <span className="ml-2 text-gray-500">by: {track.applied_by}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button 
                      onClick={() => handleViewStartupDetails(startup)} 
                      variant="outline" 
                      size="sm"
                      className="ml-4"
                    >
                      View Details
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4"
                >
                  Previous
                </Button>
                
                <div className="flex space-x-1">
                  {[...Array(totalPages)].map((_, idx) => (
                    <Button
                      key={idx}
                      variant={currentPage === idx + 1 ? 'default' : 'outline'}
                      onClick={() => setCurrentPage(idx + 1)}
                      className={currentPage === idx + 1 ? 'bg-[#5d248f] hover:bg-[#4a1d70]' : ''}
                    >
                      {idx + 1}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        );
        })()}
        
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Users Management</h2>
              <Button onClick={() => setIsCreateUserDialogOpen(true)} className="bg-[#5d248f] hover:bg-[#4a1d70]">
                <UserPlus className="w-4 h-4 mr-2" />
                Create User
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Venture Analysts ({ventureAnalysts.length})</h3>
                <div className="space-y-3">
                  {ventureAnalysts.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No venture analysts created yet</p>
                  ) : (
                    ventureAnalysts.map((analyst) => (
                      <div key={analyst.id} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-gray-900">{analyst.name}</p>
                        <p className="text-sm text-gray-600">{analyst.email}</p>
                        <p className="text-xs text-gray-500 mt-1">Created: {new Date(analyst.created_at).toLocaleDateString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </Card>
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Incubation Admins ({incubationAdmins.length})</h3>
                <div className="space-y-3">
                  {incubationAdmins.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No incubation admins created yet</p>
                  ) : (
                    incubationAdmins.map((admin) => (
                      <div key={admin.id} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-gray-900">{admin.name}</p>
                        <p className="text-sm text-gray-600">{admin.email}</p>
                        <p className="text-xs text-gray-500 mt-1">Created: {new Date(admin.created_at).toLocaleDateString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>
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
                  <p className="text-sm text-gray-600 mt-1">
                    Showing {indexOfFirstGrant + 1}-{Math.min(indexOfLastGrant, grants.length)} of {grants.length} grants
                  </p>
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
      </div>
      
      {/* Dialogs */}
      <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Create User</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name</Label><Input value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} /></div>
            <div><Label>Email</Label><Input type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} /></div>
            <div><Label>Password</Label><Input type="password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} /></div>
            <div>
              <Label>User Type</Label>
              <select value={newUser.tier} onChange={(e) => setNewUser({...newUser, tier: e.target.value})} className="w-full border border-gray-300 rounded-md p-2">
                <option value="venture_analyst">Venture Analyst</option>
                <option value="incubation_admin">Incubation Admin</option>
              </select>
            </div>
            <Button onClick={handleCreateUser} className="w-full bg-[#5d248f]">Create User</Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isAssignStartupsDialogOpen} onOpenChange={setIsAssignStartupsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Assign Startups</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Assign To</Label>
              <select value={assignmentData.assigned_to_type} onChange={(e) => setAssignmentData({...assignmentData, assigned_to_type: e.target.value, user_id: ''})} className="w-full border rounded-md p-2">
                <option value="venture_analyst">Venture Analyst</option>
                <option value="incubation_admin">Incubation Admin</option>
              </select>
            </div>
            <div>
              <Label>Select User</Label>
              <select value={assignmentData.user_id} onChange={(e) => setAssignmentData({...assignmentData, user_id: e.target.value})} className="w-full border rounded-md p-2">
                <option value="">Select a user</option>
                {(assignmentData.assigned_to_type === 'venture_analyst' ? ventureAnalysts : incubationAdmins).map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Select Startups</Label>
              <MultiSelect
                options={startups.map(s => ({ value: s.id, label: s.name }))}
                value={assignmentData.startup_ids}
                onChange={(selected) => setAssignmentData({...assignmentData, startup_ids: selected})}
                placeholder="Select startups..."
              />
            </div>
            <Button onClick={handleAssignStartups} className="w-full bg-[#5d248f]" disabled={!assignmentData.user_id || !assignmentData.startup_ids.length}>
              Assign Startups
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
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

            <Button onClick={handleAddGrant} className="w-full">
              Add Grant
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isStartupDetailsDialogOpen} onOpenChange={setIsStartupDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Startup Details: {selectedStartup?.profile?.startup_name || selectedStartup?.name}</DialogTitle></DialogHeader>
          {selectedStartup && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Email</p>
                    <p className="text-sm text-gray-900">{selectedStartup.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Name (Account Name)</p>
                    <p className="text-sm text-gray-900">{selectedStartup.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Tier</p>
                    <Badge className={getTierColor(selectedStartup.tier)}>{selectedStartup.tier}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Registration Date</p>
                    <p className="text-sm text-gray-900">{new Date(selectedStartup.created_at).toLocaleDateString()}</p>
                  </div>
                  {selectedStartup.assigned_analyst?.type === 'incubation_admin' && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-gray-700">Assigned Incubation Admin</p>
                      <Badge className="bg-green-50 text-green-700 border-green-300">
                        📍 {selectedStartup.assigned_analyst.name}
                      </Badge>
                    </div>
                  )}
                  {selectedStartup.registration_source_info && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-gray-700">Registered Via Incubation Link</p>
                      <Badge className="bg-blue-50 text-blue-700 border-blue-300">
                        🔗 {selectedStartup.registration_source_info.name} (Link: {selectedStartup.registration_source_info.link_code})
                      </Badge>
                    </div>
                  )}
                  {selectedStartup.password_hash && (
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-gray-700">Password Hash</p>
                      <p className="text-xs text-gray-600 font-mono break-all bg-gray-50 p-2 rounded">{selectedStartup.password_hash}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Profile Information */}
              {selectedStartup.profile && (
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Profile Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedStartup.profile.startup_name && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Startup Name</p>
                        <p className="text-sm text-gray-900 font-semibold">{selectedStartup.profile.startup_name}</p>
                      </div>
                    )}
                    {selectedStartup.profile.founder_name && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Founder Name</p>
                        <p className="text-sm text-gray-900">{selectedStartup.profile.founder_name}</p>
                      </div>
                    )}
                    {selectedStartup.profile.entity_type && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Entity Type</p>
                        <p className="text-sm text-gray-900">{selectedStartup.profile.entity_type}</p>
                      </div>
                    )}
                    {selectedStartup.profile.location && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Location</p>
                        <p className="text-sm text-gray-900">{selectedStartup.profile.location}</p>
                      </div>
                    )}
                    {selectedStartup.profile.industry && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Industry</p>
                        <p className="text-sm text-gray-900">{selectedStartup.profile.industry}</p>
                      </div>
                    )}
                    {selectedStartup.profile.company_size && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Company Size</p>
                        <p className="text-sm text-gray-900">{selectedStartup.profile.company_size} employees</p>
                      </div>
                    )}
                    {selectedStartup.profile.stage && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Stage</p>
                        <p className="text-sm text-gray-900">{selectedStartup.profile.stage}</p>
                      </div>
                    )}
                    {selectedStartup.profile.revenue && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Revenue</p>
                        <p className="text-sm text-gray-900">₹{selectedStartup.profile.revenue.toLocaleString()}</p>
                      </div>
                    )}
                    {selectedStartup.profile.stability && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Financial Stability</p>
                        <p className="text-sm text-gray-900">{selectedStartup.profile.stability}</p>
                      </div>
                    )}
                    {selectedStartup.profile.demographic && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Demographic</p>
                        <p className="text-sm text-gray-900">{selectedStartup.profile.demographic}</p>
                      </div>
                    )}
                    {selectedStartup.profile.track_record && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Track Record (years)</p>
                        <p className="text-sm text-gray-900">{selectedStartup.profile.track_record}</p>
                      </div>
                    )}
                    {selectedStartup.profile.contact_phone && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Contact Phone</p>
                        <p className="text-sm text-gray-900">{selectedStartup.profile.contact_phone}</p>
                      </div>
                    )}
                    {selectedStartup.profile.contact_email && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Contact Email</p>
                        <p className="text-sm text-gray-900">{selectedStartup.profile.contact_email}</p>
                      </div>
                    )}
                    {selectedStartup.profile.year_of_incorporation && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Year of Incorporation</p>
                        <p className="text-sm text-gray-900">{selectedStartup.profile.year_of_incorporation}</p>
                      </div>
                    )}
                    {selectedStartup.profile.ownership_type && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Ownership Type</p>
                        <p className="text-sm text-gray-900">
                          {Array.isArray(selectedStartup.profile.ownership_type) 
                            ? selectedStartup.profile.ownership_type.join(', ') 
                            : selectedStartup.profile.ownership_type}
                        </p>
                      </div>
                    )}
                    {selectedStartup.profile.funding_need && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Funding Need</p>
                        <p className="text-sm text-gray-900">₹{selectedStartup.profile.funding_need.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                  {selectedStartup.profile.description && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700">Description</p>
                      <p className="text-sm text-gray-900 mt-1">{selectedStartup.profile.description}</p>
                    </div>
                  )}
                  {selectedStartup.profile.past_grant_experience && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700">Past Grant Experience</p>
                      <p className="text-sm text-gray-900 mt-1">{selectedStartup.profile.past_grant_experience}</p>
                      {selectedStartup.profile.past_grant_description && (
                        <p className="text-sm text-gray-600 mt-1">{selectedStartup.profile.past_grant_description}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Assignment Information */}
              {selectedStartup.assigned_analyst && (
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Assignment</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Assigned To</p>
                      <p className="text-sm text-gray-900">{selectedStartup.assigned_analyst.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Role</p>
                      <Badge variant="outline">{selectedStartup.assigned_analyst.type}</Badge>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Matched Grants */}
              {selectedStartup.matched_grants && selectedStartup.matched_grants.length > 0 && (
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Matched Grants ({selectedStartup.matched_grants.length})</h3>
                  <div className="space-y-2">
                    {selectedStartup.matched_grants.map((grant, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-gray-900">{grant.name}</p>
                        <p className="text-sm text-gray-600">Funding: {grant.funding_amount}</p>
                        {grant.match_percentage && (
                          <p className="text-sm text-green-600">Match: {grant.match_percentage}%</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Grant Applications (for Expert tier) */}
              {selectedStartup.tier === 'expert' && selectedStartup.tracking && selectedStartup.tracking.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Grant Applications</h3>
                  <div className="space-y-2">
                    {selectedStartup.tracking.map((track, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-900">{track.grant_name || 'Unknown Grant'}</p>
                            <p className="text-xs text-gray-500">Grant ID: {track.grant_id}</p>
                          </div>
                          <Badge className={getStatusColor(track.status)}>{track.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Progress: {track.progress}</p>
                        <p className="text-sm text-gray-500">Applied by: {track.applied_by}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
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
  );
};

export default AdminDashboard;
