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
import { Users, Building2, FileText, Plus, Link2, Copy, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const IncubationAdminDashboard = ({ user, handleLogout }) => {
  const [activeTab, setActiveTab] = useState('startups');
  const [startups, setStartups] = useState([]);
  const [grants, setGrants] = useState([]);
  const [registrationLinks, setRegistrationLinks] = useState([]);
  const [startupsViaLinks, setStartupsViaLinks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [viaLinksCurrentPage, setViaLinksCurrentPage] = useState(1);
  const [grantsCurrentPage, setGrantsCurrentPage] = useState(1);
  const startupsPerPage = 10;
  const grantsPerPage = 10;
  const [isAddGrantDialogOpen, setIsAddGrantDialogOpen] = useState(false);
  const [isStartupDetailsDialogOpen, setIsStartupDetailsDialogOpen] = useState(false);
  const [selectedStartup, setSelectedStartup] = useState(null);
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

  // Reset page to 1 when switching tabs
  useEffect(() => {
    if (activeTab === 'startups') {
      setCurrentPage(1);
    } else if (activeTab === 'via-links') {
      setViaLinksCurrentPage(1);
    } else if (activeTab === 'grants') {
      setGrantsCurrentPage(1);
    }
  }, [activeTab]);

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
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Assigned Startups</h2>
                {sortedStartups.length > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    Showing {indexOfFirstStartup + 1}-{Math.min(indexOfLastStartup, sortedStartups.length)} of {sortedStartups.length} startups
                  </p>
                )}
              </div>
              
              {sortedStartups.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-gray-600">No startups assigned yet</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {currentStartups.map((startup) => (
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
                                • {track.grant_name || 'Unknown Grant'} (ID: {track.grant_id}) - 
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

        {activeTab === 'via-links' && (() => {
          // Sort startups by created_at (newest first)
          const sortedStartupsViaLinks = [...startupsViaLinks].sort((a, b) => 
            new Date(b.created_at) - new Date(a.created_at)
          );
          
          // Pagination logic
          const indexOfLastStartup = viaLinksCurrentPage * startupsPerPage;
          const indexOfFirstStartup = indexOfLastStartup - startupsPerPage;
          const currentStartupsViaLinks = sortedStartupsViaLinks.slice(indexOfFirstStartup, indexOfLastStartup);
          const totalPages = Math.ceil(sortedStartupsViaLinks.length / startupsPerPage);
          
          return (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Startups Registered via Your Links</h2>
                {sortedStartupsViaLinks.length > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    Showing {indexOfFirstStartup + 1}-{Math.min(indexOfLastStartup, sortedStartupsViaLinks.length)} of {sortedStartupsViaLinks.length} startups
                  </p>
                )}
              </div>
              
              {sortedStartupsViaLinks.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-gray-600">No startups have registered via your links yet</p>
                  <p className="text-sm text-gray-500 mt-2">Generate registration links to start receiving startups</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {currentStartupsViaLinks.map((startup) => (
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
                                • {track.grant_name || 'Unknown Grant'} (ID: {track.grant_id}) - 
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
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setViaLinksCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={viaLinksCurrentPage === 1}
                  className="px-4"
                >
                  Previous
                </Button>
                
                <div className="flex space-x-1">
                  {[...Array(totalPages)].map((_, idx) => (
                    <Button
                      key={idx}
                      variant={viaLinksCurrentPage === idx + 1 ? 'default' : 'outline'}
                      onClick={() => setViaLinksCurrentPage(idx + 1)}
                      className={viaLinksCurrentPage === idx + 1 ? 'bg-[#5d248f] hover:bg-[#4a1d70]' : ''}
                    >
                      {idx + 1}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => setViaLinksCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={viaLinksCurrentPage === totalPages}
                  className="px-4"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        );
        })()}

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
                <Button 
                  onClick={() => setIsAddGrantDialogOpen(true)}
                  className="bg-[#5d248f] hover:bg-[#4a1d70]"
                >
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
                      {grant.soft_approval === 'Yes' && (
                        <Badge className="bg-green-500">Soft Approved</Badge>
                      )}
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
                  {grant.eligibility && (
                    <div className="mt-3">
                      <span className="font-medium text-gray-700 text-sm">Eligibility:</span>
                      <p className="text-gray-600 text-sm">{grant.eligibility.substring(0, 150)}{grant.eligibility.length > 150 ? '...' : ''}</p>
                    </div>
                  )}
                  <div className="mt-2">
                    {grant.application_link && (
                      <a 
                        href={grant.application_link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Application Link →
                      </a>
                    )}
                  </div>
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
                      {['Technology', 'Healthcare', 'Fintech', 'E-commerce', 'Education', 'Manufacturing', 'Agriculture', 'Clean Energy', 'Biotech', 'AI/Machine Learning', 'Other'].map((sector) => (
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

export default IncubationAdminDashboard;
