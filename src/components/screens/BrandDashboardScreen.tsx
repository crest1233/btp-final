import Layout from '../Layout';
import MetricCard from '../MetricCard';
import CreatorCard from '../CreatorCard';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Users, TrendingUp, Briefcase, Star, Filter } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AppState } from '../../App';

interface BrandDashboardScreenProps {
  navigate: (screen: string, updates?: any) => void;
  appState: AppState;
  addToShortlist: (creator: any) => void;
}

const mockCreators = [
  {
    id: '1',
    name: 'Sarah Miller',
    image: 'https://images.unsplash.com/photo-1749104953165-5d0ce2cc63e8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdG9yJTIwaW5mbHVlbmNlciUyMHBob25lfGVufDF8fHx8MTc2MDUzOTkyNXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    niche: 'Fashion',
    followers: '125K',
    engagement: '5.2%',
    rating: 4.8,
    rate: '$800/post',
  },
  {
    id: '2',
    name: 'Alex Chen',
    niche: 'Tech',
    followers: '89K',
    engagement: '6.1%',
    rating: 4.9,
    rate: '$650/post',
  },
  {
    id: '3',
    name: 'Emma Rodriguez',
    niche: 'Beauty',
    followers: '210K',
    engagement: '4.8%',
    rating: 4.7,
    rate: '$1,200/post',
  },
  {
    id: '4',
    name: 'James Wilson',
    niche: 'Fitness',
    followers: '156K',
    engagement: '7.3%',
    rating: 4.9,
    rate: '$900/post',
  },
];

export default function BrandDashboardScreen({ navigate, appState, addToShortlist }: BrandDashboardScreenProps) {
  const [selectedNiche, setSelectedNiche] = useState('all');
  const [selectedTab, setSelectedTab] = useState('all');

  const filteredCreators = selectedNiche === 'all' 
    ? mockCreators 
    : mockCreators.filter(c => c.niche.toLowerCase() === selectedNiche.toLowerCase());

  const handleShortlist = (creator: any) => {
    const isAlreadyShortlisted = appState.shortlistedCreators.some(c => c.id === creator.id);
    if (isAlreadyShortlisted) {
      toast.info('Creator already in shortlist');
    } else {
      addToShortlist(creator);
      toast.success('Added to shortlist!');
    }
  };

  return (
    <Layout navigate={navigate} userRole={appState.userRole} currentScreen="brandDashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-gray-900 mb-2">Brand Dashboard</h1>
          <p className="text-gray-600">
            Welcome back! Here's an overview of your campaigns and creator connections.
          </p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Active Campaigns"
            value="12"
            icon={Briefcase}
            trend={{ value: '+3 this month', isPositive: true }}
            iconColor="bg-blue-500"
          />
          <MetricCard
            title="Total Creators"
            value="48"
            icon={Users}
            trend={{ value: '+12 this week', isPositive: true }}
            iconColor="bg-purple-500"
          />
          <MetricCard
            title="Avg. Engagement"
            value="5.8%"
            icon={TrendingUp}
            trend={{ value: '+0.4%', isPositive: true }}
            iconColor="bg-green-500"
          />
          <MetricCard
            title="Shortlisted"
            value={appState.shortlistedCreators.length.toString()}
            icon={Star}
            iconColor="bg-yellow-500"
          />
        </div>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Campaign Performance</CardTitle>
                <Select defaultValue="7days">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Last 7 days</SelectItem>
                    <SelectItem value="30days">Last 30 days</SelectItem>
                    <SelectItem value="90days">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Summer Collection Launch', status: 'active', reach: '1.2M', engagement: '6.2%' },
                  { name: 'Product Review Series', status: 'active', reach: '890K', engagement: '5.8%' },
                  { name: 'Holiday Campaign', status: 'planning', reach: '—', engagement: '—' },
                ].map((campaign, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-gray-900 text-sm">{campaign.name}</p>
                      <p className="text-gray-600 text-xs mt-1">
                        Status: <span className={campaign.status === 'active' ? 'text-green-600' : 'text-blue-600'}>
                          {campaign.status}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">{campaign.reach} reach</p>
                      <p className="text-xs text-gray-600">{campaign.engagement} engagement</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => navigate('campaignManagement')}
              >
                View All Campaigns
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate('createCampaign')}
              >
                <Briefcase className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate('creatorSearch')}
              >
                <Users className="w-4 h-4 mr-2" />
                Discover Creators
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => navigate('shortlist')}
              >
                <Star className="w-4 h-4 mr-2" />
                View Shortlist ({appState.shortlistedCreators.length})
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recommended Creators */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recommended Creators</CardTitle>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Select defaultValue={selectedNiche} onValueChange={setSelectedNiche}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Niches</SelectItem>
                    <SelectItem value="fashion">Fashion</SelectItem>
                    <SelectItem value="tech">Tech</SelectItem>
                    <SelectItem value="beauty">Beauty</SelectItem>
                    <SelectItem value="fitness">Fitness</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList>
                <TabsTrigger value="all">All Creators</TabsTrigger>
                <TabsTrigger value="top">Top Rated</TabsTrigger>
                <TabsTrigger value="new">New</TabsTrigger>
              </TabsList>
              <TabsContent value={selectedTab} className="mt-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredCreators.map((creator) => (
                    <CreatorCard
                      key={creator.id}
                      creator={creator}
                      onShortlist={() => handleShortlist(creator)}
                      isShortlisted={appState.shortlistedCreators.some(c => c.id === creator.id)}
                    />
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <Button 
              variant="outline" 
              className="w-full mt-6"
              onClick={() => navigate('creatorSearch')}
            >
              Browse All Creators
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
