import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useEffect, useState } from 'react';
import { get } from '../../system/api';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { BarChart3, TrendingUp, TrendingDown, Eye, Heart, Bookmark, MessageCircle, MousePointerClick } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface MetricData {
  label: string;
  value: number;
  change: number;
  isPositive: boolean;
}

const platformMetrics = {
  instagram: {
    reels: { reach: 45000, likes: 3200, saves: 890, comments: 245, ctr: 6.8 },
    posts: { reach: 28000, likes: 1800, saves: 450, comments: 120, ctr: 4.2 },
    stories: { reach: 15000, likes: 800, saves: 120, comments: 45, ctr: 3.1 }
  },
  youtube: {
    shorts: { reach: 62000, likes: 4500, saves: 1200, comments: 380, ctr: 8.2 },
    videos: { reach: 38000, likes: 2400, saves: 680, comments: 290, ctr: 5.6 }
  },
  tiktok: {
    videos: { reach: 78000, likes: 5600, saves: 1500, comments: 520, ctr: 9.1 }
  }
};

// Remove hardcoded default usage; keep as fallback reference only
const overviewMetrics: MetricData[] = [
  { label: 'Total Reach', value: 266000, change: 12.5, isPositive: true },
  { label: 'Engagement Rate', value: 6.8, change: 0.8, isPositive: true },
  { label: 'Avg. Watch Time', value: 45, change: -2.3, isPositive: false },
  { label: 'New Followers', value: 2450, change: 18.2, isPositive: true }
];

export default function AnalyticsDashboard() {
  // Start with empty data; prefer backend, then custom, then sample
  const [overview, setOverview] = useState<MetricData[]>([]);
  const [dataSource, setDataSource] = useState<'backend' | 'custom' | 'sample'>('backend');
  const [customOpen, setCustomOpen] = useState(false);
  const [customValues, setCustomValues] = useState({
    totalReach: '',
    engagementRate: '',
    avgWatchTime: '',
    newFollowers: ''
  });

  useEffect(() => {
    let mounted = true;
    async function fetchAnalytics() {
      try {
        const me = await get('/api/auth/me');
        const creatorId = me?.creator?.id || me?.user?.creatorId;
        if (!creatorId) throw new Error('No creator ID');
        const res = await get(`/api/creators/${creatorId}/analytics`);
        const snapshots = Array.isArray((res as any)?.items) ? (res as any).items : [];
        if (mounted && snapshots.length > 0) {
          const totalReach = snapshots.reduce((sum: number, s: any) => sum + (s.metrics?.reach || 0), 0);
          const engagementRate = snapshots.reduce((sum: number, s: any) => sum + (s.metrics?.engagementRate || 0), 0) / snapshots.length || 0;
          const newFollowers = snapshots.reduce((sum: number, s: any) => sum + (s.metrics?.followers || 0), 0);
          setOverview([
            { label: 'Total Reach', value: totalReach, change: 0, isPositive: true },
            { label: 'Engagement Rate', value: parseFloat(engagementRate.toFixed(1)), change: 0, isPositive: true },
            { label: 'Avg. Watch Time', value: 45, change: 0, isPositive: true },
            { label: 'New Followers', value: newFollowers, change: 0, isPositive: true },
          ]);
          setDataSource('backend');
          return;
        }
        // Fallback to locally customized values
        const saved = localStorage.getItem('custom_analytics');
        if (saved) {
          const parsed = JSON.parse(saved);
          setOverview([
            { label: 'Total Reach', value: Number(parsed.totalReach) || 0, change: 0, isPositive: true },
            { label: 'Engagement Rate', value: Number(parsed.engagementRate) || 0, change: 0, isPositive: true },
            { label: 'Avg. Watch Time', value: Number(parsed.avgWatchTime) || 0, change: 0, isPositive: true },
            { label: 'New Followers', value: Number(parsed.newFollowers) || 0, change: 0, isPositive: true },
          ]);
          setDataSource('custom');
        } else {
          // Final fallback to sample values with explicit flag
          setOverview(overviewMetrics);
          setDataSource('sample');
        }
      } catch (err: any) {
        // On error, try custom, then sample
        const saved = localStorage.getItem('custom_analytics');
        if (saved) {
          const parsed = JSON.parse(saved);
          setOverview([
            { label: 'Total Reach', value: Number(parsed.totalReach) || 0, change: 0, isPositive: true },
            { label: 'Engagement Rate', value: Number(parsed.engagementRate) || 0, change: 0, isPositive: true },
            { label: 'Avg. Watch Time', value: Number(parsed.avgWatchTime) || 0, change: 0, isPositive: true },
            { label: 'New Followers', value: Number(parsed.newFollowers) || 0, change: 0, isPositive: true },
          ]);
          setDataSource('custom');
        } else {
          setOverview(overviewMetrics);
          setDataSource('sample');
        }
      }
    }
    fetchAnalytics();
    return () => { mounted = false; };
  }, []);

  const handleSaveCustom = () => {
    const payload = {
      totalReach: customValues.totalReach,
      engagementRate: customValues.engagementRate,
      avgWatchTime: customValues.avgWatchTime,
      newFollowers: customValues.newFollowers,
    };
    localStorage.setItem('custom_analytics', JSON.stringify(payload));
    setOverview([
      { label: 'Total Reach', value: Number(payload.totalReach) || 0, change: 0, isPositive: true },
      { label: 'Engagement Rate', value: Number(payload.engagementRate) || 0, change: 0, isPositive: true },
      { label: 'Avg. Watch Time', value: Number(payload.avgWatchTime) || 0, change: 0, isPositive: true },
      { label: 'New Followers', value: Number(payload.newFollowers) || 0, change: 0, isPositive: true },
    ]);
    setDataSource('custom');
    setCustomOpen(false);
    toast.success('Analytics updated');
  };

  const getFormatComparison = () => {
    const formats = [
      { name: 'Reels', value: platformMetrics.instagram.reels.reach, color: 'bg-purple-500' },
      { name: 'Posts', value: platformMetrics.instagram.posts.reach, color: 'bg-blue-500' },
      { name: 'Stories', value: platformMetrics.instagram.stories.reach, color: 'bg-green-500' },
      { name: 'Shorts', value: platformMetrics.youtube.shorts.reach, color: 'bg-red-500' },
      { name: 'TikTok', value: platformMetrics.tiktok.videos.reach, color: 'bg-pink-500' }
    ];

    const maxValue = Math.max(...formats.map(f => f.value));
    
    return formats.map(format => ({
      ...format,
      percentage: (format.value / maxValue) * 100
    }));
  };

  const topPerforming = getFormatComparison().sort((a, b) => b.value - a.value)[0];
  const needsAttention = getFormatComparison().sort((a, b) => a.value - b.value)[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Analytics Dashboard</h2>
          <p className="text-sm text-gray-600 mt-1">Track your content performance across platforms</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setCustomOpen(true)}>Customize Metrics</Button>
          <Badge variant="outline" className="whitespace-nowrap">
            {dataSource === 'backend' ? 'Live Data' : dataSource === 'custom' ? 'Custom Data' : 'Sample Data'}
          </Badge>
        </div>
      </div>

      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Customize Analytics</DialogTitle>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label>Total Reach</Label>
              <Input value={customValues.totalReach} onChange={(e) => setCustomValues({ ...customValues, totalReach: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Engagement Rate (%)</Label>
              <Input value={customValues.engagementRate} onChange={(e) => setCustomValues({ ...customValues, engagementRate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Avg. Watch Time (s)</Label>
              <Input value={customValues.avgWatchTime} onChange={(e) => setCustomValues({ ...customValues, avgWatchTime: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>New Followers</Label>
              <Input value={customValues.newFollowers} onChange={(e) => setCustomValues({ ...customValues, newFollowers: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setCustomOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveCustom}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Overview Metrics */}
      <div className="grid md:grid-cols-4 gap-6">
        {overview.map((metric, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm text-gray-600">{metric.label}</span>
                {metric.isPositive ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
              </div>
              <div className="text-2xl text-gray-900 mb-1">
                {metric.label.includes('Rate') || metric.label.includes('Time') 
                  ? `${metric.value}${metric.label.includes('Rate') ? '%' : 's'}`
                  : metric.value.toLocaleString()}
              </div>
              <div className={`text-sm ${metric.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {metric.isPositive ? '+' : ''}{metric.change}% from last week
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* What's Working Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-2 border-green-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <TrendingUp className="w-5 h-5" />
              What's Working
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-900">{topPerforming.name}</span>
                  <Badge className="bg-green-100 text-green-700">Top Performer</Badge>
                </div>
                <div className="text-2xl text-gray-900 mb-1">
                  {topPerforming.value.toLocaleString()} reach
                </div>
                <p className="text-sm text-gray-600">
                  Your best performing format this month
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-900">Key Insights:</p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">•</span>
                    <span>High engagement during evening posts (6-8 PM)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">•</span>
                    <span>Lifestyle content performs 40% better</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600">•</span>
                    <span>Tutorial-style content has 3x save rate</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <TrendingDown className="w-5 h-5" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-900">{needsAttention.name}</span>
                  <Badge className="bg-orange-100 text-orange-700">Needs Improvement</Badge>
                </div>
                <div className="text-2xl text-gray-900 mb-1">
                  {needsAttention.value.toLocaleString()} reach
                </div>
                <p className="text-sm text-gray-600">
                  Consider optimizing this format
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-900">Recommendations:</p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600">•</span>
                    <span>Experiment with different posting times</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600">•</span>
                    <span>Try using trending audio or hashtags</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-600">•</span>
                    <span>Add more calls-to-action in content</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Detailed Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="platform">By Platform</TabsTrigger>
              <TabsTrigger value="format">By Format</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div>
                <h4 className="text-sm text-gray-900 mb-4">Format Comparison</h4>
                <div className="space-y-3">
                  {getFormatComparison().map((format, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">{format.name}</span>
                        <span className="text-sm text-gray-900">{format.value.toLocaleString()} reach</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${format.color} transition-all duration-500`}
                          style={{ width: `${format.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-5 gap-4 pt-6 border-t">
                {[
                  { icon: Eye, label: 'Total Views', value: '266K', color: 'text-blue-600' },
                  { icon: Heart, label: 'Total Likes', value: '18.3K', color: 'text-red-600' },
                  { icon: Bookmark, label: 'Total Saves', value: '4.8K', color: 'text-purple-600' },
                  { icon: MessageCircle, label: 'Comments', value: '1.6K', color: 'text-green-600' },
                  { icon: MousePointerClick, label: 'Avg. CTR', value: '6.2%', color: 'text-orange-600' }
                ].map((metric, i) => (
                  <div key={i} className="text-center">
                    <metric.icon className={`w-6 h-6 mx-auto mb-2 ${metric.color}`} />
                    <div className="text-sm text-gray-900 mb-1">{metric.value}</div>
                    <div className="text-xs text-gray-600">{metric.label}</div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="platform" className="space-y-6">
              {[
                { name: 'Instagram', data: platformMetrics.instagram, color: 'from-purple-500 to-pink-500' },
                { name: 'YouTube', data: platformMetrics.youtube, color: 'from-red-500 to-red-600' },
                { name: 'TikTok', data: platformMetrics.tiktok, color: 'from-pink-500 to-purple-500' }
              ].map((platform, i) => (
                <Card key={i} className="border-2">
                  <CardContent className="p-6">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r ${platform.color} text-white text-sm mb-4`}>
                      {platform.name}
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      {Object.entries(platform.data).map(([format, metrics]: any) => (
                        <div key={format} className="p-4 bg-gray-50 rounded-lg">
                          <h5 className="text-sm text-gray-900 mb-3 capitalize">{format}</h5>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Reach</span>
                              <span className="text-gray-900">{metrics.reach.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Likes</span>
                              <span className="text-gray-900">{metrics.likes.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">CTR</span>
                              <span className="text-gray-900">{metrics.ctr}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="format" className="space-y-4">
              {getFormatComparison().map((format, i) => {
                const allMetrics = Object.values(platformMetrics).flatMap(p => Object.values(p));
                const formatData = allMetrics.find((m: any) => true); // Simplified for demo
                
                return (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-3 h-3 rounded-full ${format.color}`} />
                        <h4 className="text-gray-900">{format.name}</h4>
                        <Badge variant="outline">{format.value.toLocaleString()} reach</Badge>
                      </div>
                      <div className="grid md:grid-cols-5 gap-4">
                        {[
                          { label: 'Reach', value: format.value },
                          { label: 'Engagement', value: Math.floor(format.value * 0.06) },
                          { label: 'Saves', value: Math.floor(format.value * 0.02) },
                          { label: 'Comments', value: Math.floor(format.value * 0.005) },
                          { label: 'Shares', value: Math.floor(format.value * 0.003) }
                        ].map((metric, j) => (
                          <div key={j} className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm text-gray-900 mb-1">{metric.value.toLocaleString()}</div>
                            <div className="text-xs text-gray-600">{metric.label}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Trend Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
              const value = 40 + Math.random() * 60;
              return (
                <div key={day}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 w-12">{day}</span>
                    <span className="text-sm text-gray-900">{Math.floor(value * 1000).toLocaleString()} impressions</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
