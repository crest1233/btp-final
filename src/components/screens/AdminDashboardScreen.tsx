import Layout from '../Layout';
import MetricCard from '../MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Users, Briefcase, TrendingUp, DollarSign, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface AdminDashboardScreenProps {
  navigate: (screen: string, updates?: any) => void;
}

const platformStats = {
  totalUsers: 1247,
  creators: 856,
  brands: 391,
  campaigns: 423,
  activeCampaigns: 156,
  totalRevenue: '$487,320',
  monthlyGrowth: '+12.5%',
};

const recentUsers = [
  { id: '1', name: 'Sarah Miller', role: 'Creator', joined: '2025-10-14', status: 'active' },
  { id: '2', name: 'TechBrand Inc', role: 'Brand', joined: '2025-10-13', status: 'active' },
  { id: '3', name: 'Alex Chen', role: 'Creator', joined: '2025-10-12', status: 'pending' },
  { id: '4', name: 'Fashion Co', role: 'Brand', joined: '2025-10-11', status: 'active' },
];

const recentCampaigns = [
  { id: '1', name: 'Summer Collection Launch', brand: 'StyleCo', creators: 8, status: 'active', budget: '$12,000' },
  { id: '2', name: 'Product Review Series', brand: 'TechBrand', creators: 5, status: 'active', budget: '$8,500' },
  { id: '3', name: 'Fitness Challenge', brand: 'FitLife', creators: 12, status: 'completed', budget: '$15,000' },
];

const systemHealth = [
  { metric: 'API Response Time', value: '145ms', status: 'good' },
  { metric: 'User Satisfaction', value: '94%', status: 'excellent' },
  { metric: 'Campaign Success Rate', value: '87%', status: 'good' },
  { metric: 'Platform Uptime', value: '99.9%', status: 'excellent' },
];

export default function AdminDashboardScreen({ navigate }: AdminDashboardScreenProps) {
  const handleAction = (action: string, item?: any) => {
    toast.success(`${action} action triggered`);
  };

  return (
    <Layout navigate={navigate} userRole="admin" currentScreen="adminDashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">
            Platform overview and management tools
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Users"
            value={platformStats.totalUsers.toLocaleString()}
            icon={Users}
            trend={{ value: platformStats.monthlyGrowth, isPositive: true }}
            iconColor="bg-purple-500"
          />
          <MetricCard
            title="Active Campaigns"
            value={platformStats.activeCampaigns.toString()}
            icon={Briefcase}
            trend={{ value: '+23 this month', isPositive: true }}
            iconColor="bg-blue-500"
          />
          <MetricCard
            title="Platform Revenue"
            value={platformStats.totalRevenue}
            icon={DollarSign}
            trend={{ value: '+18.2%', isPositive: true }}
            iconColor="bg-green-500"
          />
          <MetricCard
            title="Avg. Match Rate"
            value="92%"
            icon={TrendingUp}
            trend={{ value: '+4%', isPositive: true }}
            iconColor="bg-yellow-500"
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="system">System Health</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>User Distribution</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => navigate('userManagement')}>
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Creators</span>
                        <span className="text-sm text-gray-900">{platformStats.creators} ({((platformStats.creators / platformStats.totalUsers) * 100).toFixed(0)}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${(platformStats.creators / platformStats.totalUsers) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Brands</span>
                        <span className="text-sm text-gray-900">{platformStats.brands} ({((platformStats.brands / platformStats.totalUsers) * 100).toFixed(0)}%)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(platformStats.brands / platformStats.totalUsers) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="p-3 bg-purple-50 rounded-lg text-center">
                      <p className="text-purple-900">{platformStats.creators}</p>
                      <p className="text-xs text-purple-600 mt-1">Creators</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg text-center">
                      <p className="text-blue-900">{platformStats.brands}</p>
                      <p className="text-xs text-blue-600 mt-1">Brands</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { type: 'user', message: 'New creator signup: Sarah Miller', time: '5 min ago' },
                      { type: 'campaign', message: 'Campaign "Summer Launch" went live', time: '1 hour ago' },
                      { type: 'payment', message: 'Payment processed: $1,200', time: '2 hours ago' },
                      { type: 'user', message: 'Brand verified: TechBrand Inc', time: '3 hours ago' },
                    ].map((activity, i) => (
                      <div key={i} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          activity.type === 'user' ? 'bg-purple-100' :
                          activity.type === 'campaign' ? 'bg-blue-100' :
                          'bg-green-100'
                        }`}>
                          {activity.type === 'user' && <Users className="w-4 h-4 text-purple-600" />}
                          {activity.type === 'campaign' && <Briefcase className="w-4 h-4 text-blue-600" />}
                          {activity.type === 'payment' && <DollarSign className="w-4 h-4 text-green-600" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{activity.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Users</CardTitle>
                  <Button size="sm" onClick={() => navigate('userManagement')}>
                    Manage All Users
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full" />
                        <div>
                          <p className="text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.role} • Joined {user.joined}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                          {user.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns">
            <Card>
              <CardHeader>
                <CardTitle>Recent Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentCampaigns.map((campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-gray-900">{campaign.name}</p>
                          <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                            {campaign.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{campaign.brand} • {campaign.creators} creators • {campaign.budget}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <p className="text-gray-600">Growth chart would be displayed here</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Revenue Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <p className="text-gray-600">Revenue chart would be displayed here</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Health Tab */}
          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>System Health Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {systemHealth.map((item, i) => (
                    <div key={i} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">{item.metric}</p>
                          <p className="text-gray-900 mt-1">{item.value}</p>
                        </div>
                        <Badge variant={item.status === 'excellent' ? 'default' : 'secondary'}>
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-sm text-green-900 mb-2">✓ All Systems Operational</h4>
                  <p className="text-xs text-green-700">
                    All platform services are running smoothly with no reported issues.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
