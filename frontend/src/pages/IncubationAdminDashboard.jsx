import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Building2, FileText, Plus, Eye, Link2, Users, Copy, ToggleLeft, ToggleRight } from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const IncubationAdminDashboard = ({ user, handleLogout }) => {
  const [activeTab, setActiveTab] = useState('startups');
  const [startups, setStartups] = useState([]);
  const [grants, setGrants] = useState([]);
  const [registrationLinks, setRegistrationLinks] = useState([]);
  const [startupsViaLinks, setStartupsViaLinks] = useState([]);
  const [isAddGrantDialogOpen, setIsAddGrantDialogOpen] = useState(false);
  const [isStartupDetailsDialogOpen, setIsStartupDetailsDialogOpen] = useState(false);
  const [selectedStartup, setSelectedStartup] = useState(null);
  
  const [newGrant, setNewGrant] = useState({
    name: '',
    funding_amount: '',
    deadline: '',
    sector: '',
    eligibility: '',
    application_link: '',
    stage: '',
    soft_approval: 'No'
  });
  
  useEffect(() => {
    if (user?.tier === 'incubation_admin') {
      fetchStartups();
      fetchGrants();
      fetchRegistrationLinks();
      fetchStartupsViaLinks();
    }
  }, [user]);
  
  const fetchStartups = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/incubation-admin/startups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStartups(response.data.startups);
    } catch (error) {
      console.error('Error fetching startups:', error);
      toast.error('Failed to fetch startups');
    }
  };
  
  const fetchGrants = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/incubation-admin/grants`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGrants(response.data.grants);
    } catch (error) {
      console.error('Error fetching grants:', error);
    }
  };

  const fetchRegistrationLinks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/incubation-admin/links`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRegistrationLinks(response.data.links);
    } catch (error) {
      console.error('Error fetching registration links:', error);
      toast.error('Failed to fetch registration links');
    }
  };

  const fetchStartupsViaLinks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/incubation-admin/startups-via-links`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStartupsViaLinks(response.data.startups);
    } catch (error) {
      console.error('Error fetching startups via links:', error);
      toast.error('Failed to fetch startups via links');
    }
  };
  
  const handleAddGrant = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/incubation-admin/grants`, newGrant, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Grant added successfully');
      
      setNewGrant({
        name: '',
        funding_amount: '',
        deadline: '',
        sector: '',
        eligibility: '',
        application_link: '',
        stage: '',
        soft_approval: 'No'
      });
      setIsAddGrantDialogOpen(false);
      fetchGrants();
    } catch (error) {
      console.error('Error adding grant:', error);
      toast.error('Failed to add grant');
    }
  };
  
  const getTierColor = (tier) => {
    const colors = { free: 'bg-gray-500', premium: 'bg-blue-500', expert: 'bg-purple-500' };
    return colors[tier] || 'bg-gray-500';
  };
  
  const getStatusColor = (status) => {
    const colors = {
      applied: 'bg-blue-500',
      approved: 'bg-green-500',
      disbursed: 'bg-emerald-500',
      rejected: 'bg-red-500',
      draft: 'bg-gray-500'
    };
    return colors[status?.toLowerCase()] || 'bg-gray-500';
  };

  const handleViewStartupDetails = (startup) => {
    setSelectedStartup(startup);
    setIsStartupDetailsDialogOpen(true);
  };

  const handleGenerateLink = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/incubation-admin/generate-link`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Registration link generated successfully');
      fetchRegistrationLinks();
    } catch (error) {
      console.error('Error generating link:', error);
      toast.error('Failed to generate registration link');
    }
  };

  const handleToggleLink = async (linkId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/incubation-admin/links/${linkId}/toggle`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Link status updated');
      fetchRegistrationLinks();
    } catch (error) {
      console.error('Error toggling link:', error);
      toast.error('Failed to update link status');
    }
  };

  const handleCopyLink = (url) => {
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Incubation Admin Dashboard</h1>
              <p className="text-gray-600">Manage assigned startups and grants</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="font-semibold text-gray-900">{user?.name}</p>
                <p className="text-sm text-gray-600">Incubation Admin</p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                Logout
              </Button>
            </div>
          </div>
          
          <div className="flex space-x-4 border-t pt-4">
            <Button
              variant={activeTab === 'startups' ? 'default' : 'outline'}
              onClick={() => setActiveTab('startups')}
              className={activeTab === 'startups' ? 'bg-[#5d248f] hover:bg-[#4a1d70]' : ''}
            >
              <Building2 className="w-4 h-4 mr-2" />
              Assigned Startups
            </Button>
            <Button
              variant={activeTab === 'via-links' ? 'default' : 'outline'}
              onClick={() => setActiveTab('via-links')}
              className={activeTab === 'via-links' ? 'bg-[#5d248f] hover:bg-[#4a1d70]' : ''}
            >
              <Users className="w-4 h-4 mr-2" />
              Startups via Links
            </Button>
            <Button
              variant={activeTab === 'links' ? 'default' : 'outline'}
              onClick={() => setActiveTab('links')}
              className={activeTab === 'links' ? 'bg-[#5d248f] hover:bg-[#4a1d70]' : ''}
            >
              <Link2 className="w-4 h-4 mr-2" />
              Registration Links
            </Button>
            <Button
              variant={activeTab === 'grants' ? 'default' : 'outline'}
              onClick={() => setActiveTab('grants')}
              className={activeTab === 'grants' ? 'bg-[#5d248f] hover:bg-[#4a1d70]' : ''}
            >
              <FileText className="w-4 h-4 mr-2" />
              Grants
            </Button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'startups' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Assigned Startups</h2>
            
            {startups.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-gray-600">No startups assigned yet</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {startups.map((startup) => (
                  <Card key={startup.id} className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{startup.name}</h3>
                          <Badge className={getTierColor(startup.tier)}>{startup.tier}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{startup.email}</p>
                        
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Matched Grants ({startup.matched_grants?.length || 0})
                          </p>
                          {startup.matched_grants?.map((grant, idx) => (
                            <div key={idx} className="text-sm text-gray-600 ml-4">
                              • {grant.name} - {grant.funding_amount}
                            </div>
                          ))}
                          {startup.matched_grants?.length === 0 && (
                            <p className="text-sm text-gray-500 ml-4">No grants matched yet</p>
                          )}
                        </div>
                        
                        {startup.tier === 'expert' && startup.tracking?.length > 0 && (
                          <div className="mt-4 border-t pt-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              Grant Applications & Tracking
                            </p>
                            {startup.tracking.map((track, idx) => (
                              <div key={idx} className="text-sm text-gray-600 ml-4 mb-1">
                                • Grant ID: {track.grant_id} - 
                                <Badge className={`ml-2 ${getStatusColor(track.status)}`}>
                                  {track.status}
                                </Badge>
                                <span className="ml-2">({track.progress})</span>
                                <span className="ml-2 text-gray-500">Applied by: {track.applied_by}</span>
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
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'via-links' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Startups Registered via Your Links</h2>
            
            {startupsViaLinks.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-gray-600">No startups have registered via your links yet</p>
                <p className="text-sm text-gray-500 mt-2">Generate registration links to start receiving startups</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {startupsViaLinks.map((startup) => (
                  <Card key={startup.id} className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{startup.name}</h3>
                          <Badge className={getTierColor(startup.tier)}>{startup.tier}</Badge>
                          <Badge variant="outline" className="text-blue-600">
                            Via Link: {startup.registration_source}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{startup.email}</p>
                        <p className="text-sm text-gray-500 mb-2">
                          Registered: {new Date(startup.created_at).toLocaleDateString()}
                        </p>
                        
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Matched Grants ({startup.matched_grants?.length || 0})
                          </p>
                          {startup.matched_grants?.map((grant, idx) => (
                            <div key={idx} className="text-sm text-gray-600 ml-4">
                              • {grant.name} - {grant.funding_amount}
                            </div>
                          ))}
                          {startup.matched_grants?.length === 0 && (
                            <p className="text-sm text-gray-500 ml-4">No grants matched yet</p>
                          )}
                        </div>
                        
                        {startup.tier === 'expert' && startup.tracking?.length > 0 && (
                          <div className="mt-4 border-t pt-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              Grant Applications & Tracking
                            </p>
                            {startup.tracking.map((track, idx) => (
                              <div key={idx} className="text-sm text-gray-600 ml-4 mb-1">
                                • Grant ID: {track.grant_id} - 
                                <Badge className={`ml-2 ${getStatusColor(track.status)}`}>
                                  {track.status}
                                </Badge>
                                <span className="ml-2">({track.progress})</span>
                                <span className="ml-2 text-gray-500">Applied by: {track.applied_by}</span>
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
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'links' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Registration Links</h2>
              <Button 
                onClick={handleGenerateLink}
                className="bg-[#5d248f] hover:bg-[#4a1d70]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Generate New Link
              </Button>
            </div>
            
            {registrationLinks.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-gray-600">No registration links created yet</p>
                <p className="text-sm text-gray-500 mt-2">Generate your first link to start receiving startups</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {registrationLinks.map((link) => (
                  <Card key={link.id} className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">Link Code: {link.link_code}</h3>
                          <Badge className={link.is_active ? 'bg-green-500' : 'bg-gray-500'}>
                            {link.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Created: {new Date(link.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          Usage Count: {link.usage_count} startups
                        </p>
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">Registration URL:</p>
                          <div className="flex items-center space-x-2">
                            <Input 
                              value={link.registration_url} 
                              readOnly 
                              className="font-mono text-sm"
                            />
                            <Button 
                              onClick={() => handleCopyLink(link.registration_url)}
                              variant="outline"
                              size="sm"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          onClick={() => handleToggleLink(link.id)}
                          variant="outline"
                          size="sm"
                          className={link.is_active ? 'text-red-600' : 'text-green-600'}
                        >
                          {link.is_active ? (
                            <>
                              <ToggleLeft className="w-4 h-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <ToggleRight className="w-4 h-4 mr-2" />
                              Activate
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'grants' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Grants Database</h2>
              <Button 
                onClick={() => setIsAddGrantDialogOpen(true)}
                className="bg-[#5d248f] hover:bg-[#4a1d70]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Grant
              </Button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {grants.map((grant) => (
                <Card key={grant.grant_id} className="p-6">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{grant.name}</h3>
                      {grant.soft_approval === 'Yes' && (
                        <Badge className="bg-green-500">Soft Approved</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Funding Amount:</span>
                        <p className="text-gray-600">{grant.funding_amount}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Deadline:</span>
                        <p className="text-gray-600">{grant.deadline}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Sector:</span>
                        <p className="text-gray-600">{grant.sector}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Stage:</span>
                        <p className="text-gray-600">{grant.stage}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className="font-medium text-gray-700 text-sm">Eligibility:</span>
                      <p className="text-gray-600 text-sm">{grant.eligibility}</p>
                    </div>
                    <div className="mt-2">
                      <a 
                        href={grant.application_link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Application Link →
                      </a>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Add Grant Dialog */}
      <Dialog open={isAddGrantDialogOpen} onOpenChange={setIsAddGrantDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Grant</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="grant-name">Grant Name</Label>
              <Input
                id="grant-name"
                value={newGrant.name}
                onChange={(e) => setNewGrant({...newGrant, name: e.target.value})}
                placeholder="Enter grant name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="grant-amount">Funding Amount</Label>
                <Input
                  id="grant-amount"
                  value={newGrant.funding_amount}
                  onChange={(e) => setNewGrant({...newGrant, funding_amount: e.target.value})}
                  placeholder="e.g., ₹5,00,000"
                />
              </div>
              <div>
                <Label htmlFor="grant-deadline">Deadline</Label>
                <Input
                  id="grant-deadline"
                  type="date"
                  value={newGrant.deadline}
                  onChange={(e) => setNewGrant({...newGrant, deadline: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="grant-sector">Sector</Label>
              <Input
                id="grant-sector"
                value={newGrant.sector}
                onChange={(e) => setNewGrant({...newGrant, sector: e.target.value})}
                placeholder="e.g., Technology, Healthcare"
              />
            </div>
            <div>
              <Label htmlFor="grant-eligibility">Eligibility Criteria</Label>
              <Input
                id="grant-eligibility"
                value={newGrant.eligibility}
                onChange={(e) => setNewGrant({...newGrant, eligibility: e.target.value})}
                placeholder="Enter eligibility criteria"
              />
            </div>
            <div>
              <Label htmlFor="grant-link">Application Link</Label>
              <Input
                id="grant-link"
                type="url"
                value={newGrant.application_link}
                onChange={(e) => setNewGrant({...newGrant, application_link: e.target.value})}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label htmlFor="grant-stage">Stage of Startup</Label>
              <Input
                id="grant-stage"
                value={newGrant.stage}
                onChange={(e) => setNewGrant({...newGrant, stage: e.target.value})}
                placeholder="e.g., Early-stage, Growth"
              />
            </div>
            <div>
              <Label htmlFor="grant-soft-approval">Soft Approval</Label>
              <select
                id="grant-soft-approval"
                value={newGrant.soft_approval}
                onChange={(e) => setNewGrant({...newGrant, soft_approval: e.target.value})}
                className="w-full border border-gray-300 rounded-md p-2"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            <Button 
              onClick={handleAddGrant} 
              className="w-full bg-[#5d248f] hover:bg-[#4a1d70]"
            >
              Add Grant
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Startup Details Dialog */}
      <Dialog open={isStartupDetailsDialogOpen} onOpenChange={setIsStartupDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Startup Details: {selectedStartup?.profile?.startup_name || selectedStartup?.name}</DialogTitle>
          </DialogHeader>
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
                          <p className="font-medium text-gray-900">Grant ID: {track.grant_id}</p>
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
    </div>
  );
};

export default IncubationAdminDashboard;
