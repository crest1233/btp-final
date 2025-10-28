import Layout from '../Layout';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Briefcase, Search, Calendar, Users, TrendingUp, MoreVertical, Eye } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AppState } from '../../App';
import { get, del } from '../../system/api';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface CampaignManagementScreenProps {
  navigate: (screen: string, updates?: any) => void;
  appState: AppState;
}

export default function CampaignManagementScreen({ navigate, appState }: CampaignManagementScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [remoteCampaigns, setRemoteCampaigns] = useState([] as any[]);
  const brandId: string | number | undefined = (appState as any)?.user?.brand?.id || (appState as any)?.user?.brandId || (appState as any)?.brandId;

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        const qs = brandId ? `?brandId=${brandId}` : '';
        const res = await get(`/api/campaigns${qs}`);
        const items: any[] = Array.isArray(res)
          ? res
          : Array.isArray((res as any)?.items)
          ? (res as any).items
          : Array.isArray((res as any)?.campaigns)
          ? (res as any).campaigns
          : [];
        const normalized = items.map((c: any) => ({
          id: c.id,
          name: c.title || c.name || 'Untitled Campaign',
          status: (c.status || 'active').toLowerCase(),
          startDate: c.startDate ? String(c.startDate).slice(0, 10) : '—',
          endDate: c.endDate ? String(c.endDate).slice(0, 10) : '—',
          creators: (c._count?.applications as any) || c.creators || 0,
          budget: typeof c.budget === 'number' ? `$${Number(c.budget).toLocaleString()}` : (c.budget || '—'),
          reach: '—',
          engagement: '—',
        }));
        setRemoteCampaigns(normalized);
      } catch (e: any) {
        console.warn('Failed to load campaigns', e?.message || e);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId]);

  const allCampaigns = [...remoteCampaigns, ...(appState.campaigns || [])];

  const filteredCampaigns = allCampaigns.filter(campaign => {
    if (searchQuery && !String(campaign.name || '').toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (activeTab === 'all') return true;
    return campaign.status === activeTab;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'planning':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'draft':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'completed':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    try {
      await del(`/api/campaigns/${id}`);
      setRemoteCampaigns(prev => prev.filter(c => c.id !== id));
      toast.success('Campaign deleted');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete campaign');
    }
  };

  const handleEditCampaign = (campaign: any) => {
    navigate('createCampaign', { editingCampaign: campaign });
  };

  return (
    <Layout navigate={navigate} userRole={appState.userRole} currentScreen="campaignManagement">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-gray-900 mb-2">Campaign Management</h1>
            <p className="text-gray-600">
              Manage and track all your creator campaigns
            </p>
          </div>
          <Button onClick={() => navigate('createCampaign')} className="gap-2 hidden md:inline-flex">
            <Briefcase className="w-4 h-4" />
            New Campaign
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Campaigns</p>
                  <p className="text-gray-900 mt-1">{allCampaigns.length}</p>
                </div>
                <Briefcase className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="text-gray-900 mt-1">
                    {allCampaigns.filter(c => c.status === 'active').length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Planning</p>
                  <p className="text-gray-900 mt-1">
                    {allCampaigns.filter(c => c.status === 'planning').length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-gray-900 mt-1">
                    {allCampaigns.filter(c => c.status === 'completed').length}
                  </p>
                </div>
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Tabs */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="planning">Planning</TabsTrigger>
                <TabsTrigger value="draft">Draft</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Campaigns List */}
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-6">Loading campaigns...</CardContent>
            </Card>
          ) : filteredCampaigns.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No campaigns found</p>
                <Button onClick={() => navigate('createCampaign')}>
                  Create Your First Campaign
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredCampaigns.map((campaign) => (
              <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-gray-900">{campaign.name}</h3>
                        <Badge variant="outline" className={getStatusColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{campaign.startDate}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>{campaign.creators} creators</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Briefcase className="w-4 h-4" />
                          <span>{campaign.budget}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <TrendingUp className="w-4 h-4" />
                          <span>{campaign.reach} reach</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="text-gray-900">{campaign.engagement}</span>
                          <span>engagement</span>
                        </div>
                      </div>
                      {/* Mobile action buttons for better usability */}
                      <div className="flex gap-2 mt-4 md:hidden">
                        <Button variant="outline" onClick={() => navigate('campaignDetails', { selectedCampaignId: campaign.id })}>
                          View
                        </Button>
                        <Button variant="secondary" onClick={() => handleEditCampaign(campaign)}>
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => handleDeleteCampaign(campaign.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate('campaignDetails', { selectedCampaign: campaign })}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditCampaign(campaign)}>Edit Campaign</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditCampaign(campaign)}>Duplicate</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteCampaign(campaign.id)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
