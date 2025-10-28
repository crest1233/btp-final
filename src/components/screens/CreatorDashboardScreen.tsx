import Layout from '../Layout';
import MetricCard from '../MetricCard';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Users, TrendingUp, Briefcase, DollarSign, Calendar, Bell, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { AppState } from '../../App';
import { get, put, post } from '../../system/api'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'

interface CreatorDashboardScreenProps {
  navigate: (screen: string, updates?: any) => void;
  appState: AppState;
}

const recentActivity = [
  {
    type: 'payment',
    message: 'Payment received from StyleCo',
    amount: 800,
    time: '2 hours ago',
  },
  {
    type: 'message',
    message: 'New message from FitLife brand manager',
    time: '5 hours ago',
  },
  {
    type: 'campaign',
    message: 'Summer Collection campaign marked as complete',
    time: '1 day ago',
  },
  {
    type: 'invite',
    message: 'Invitation to Beauty Brand Holiday Campaign',
    time: '2 days ago',
  },
];

export default function CreatorDashboardScreen({ navigate, appState }: CreatorDashboardScreenProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null as string | null)
  const [creator, setCreator] = useState(null as any)
  const [stats, setStats] = useState(null as any)
  const [campaigns, setCampaigns] = useState([] as any[])
  const [pendingApplications, setPendingApplications] = useState([] as any[])
  const [applications, setApplications] = useState([] as any[])

  const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

  const loadDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      const me = await get('/api/auth/me')
      const creatorId = me?.user?.creator?.id
      if (!creatorId) {
        throw new Error('No creator profile found. Please create your creator profile.')
      }
      const [creatorRes, statsRes, campaignsRes, applicationsRes] = await Promise.all([
        get(`/api/creators/${creatorId}`),
        get(`/api/creators/${creatorId}/stats`),
        get(`/api/campaigns/creator/${creatorId}`),
        get(`/api/creators/${creatorId}/applications`),
      ])
      setCreator(creatorRes.creator)
      setStats(statsRes.stats)
      setCampaigns(campaignsRes.items || [])
      setApplications(applicationsRes.items || [])
      const pending = (applicationsRes.items || []).filter((app: any) => 
        app.status === 'APPROVED' && !app.creatorResponse
      )
      setPendingApplications(pending)
    } catch (err: any) {
      setError(err?.message || 'Failed to load dashboard')
      toast.error(err?.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      await loadDashboard()
      if (!mounted) return
    })()
    return () => { mounted = false }
  }, [])

  const handleApplicationResponse = async (applicationId: string, response: 'ACCEPTED' | 'DECLINED') => {
    try {
      await put(`/api/campaigns/applications/${applicationId}/respond`, { response })
      setPendingApplications(prev => prev.filter(app => app.id !== applicationId))
      setApplications(prev => prev.map(app => app.id === applicationId ? { ...app, creatorResponse: response } : app))
      toast.success(`Application ${response.toLowerCase()} successfully!`)

      if (response === 'ACCEPTED') {
        const app = applications.find(a => a.id === applicationId)
        const camp = app?.campaign
        const title = `Campaign: ${camp?.title || camp?.name || 'Untitled'}`
        const startAt = camp?.startDate || new Date().toISOString()
        const endAt = camp?.endDate || null
        const description = camp?.description || 'Accepted campaign'
        try {
          if (creator?.id) {
            await post(`/api/creators/${creator.id}/events`, { title, startAt, endAt, description })
            toast.success('Added to calendar')
          }
        } catch (e: any) {
          toast.error(e?.message || 'Failed to add to calendar')
        }
      }
    } catch (err: any) {
      toast.error(err?.message || `Failed to ${response.toLowerCase()} application`)
    }
  }

  const totalFollowers = (creator?.instagramFollowers || 0) + (creator?.tiktokFollowers || 0) + (creator?.youtubeFollowers || 0)
  const engagementRate = creator?.avgEngagementRate ? `${creator.avgEngagementRate.toFixed ? creator.avgEngagementRate.toFixed(1) : creator.avgEngagementRate}%` : '—'
  const activeCampaigns = Array.isArray(campaigns) ? (campaigns.filter((c) => c.status === 'ACTIVE').length || campaigns.length) : 0
  const totalApplications = stats?.totalApplications ?? 0

  const applicationForCampaign = (campaignId: string) => applications.find((a: any) => a?.campaign?.id === campaignId && a.status === 'APPROVED')

  return (
    <Layout navigate={navigate} userRole={appState.userRole} currentScreen="creatorDashboard">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error banner */}
        {error && (
          <div className="mb-4 p-3 border border-red-300 bg-red-50 text-red-700 rounded">
            <div className="flex items-center justify-between">
              <p className="text-sm">{error}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={loadDashboard}>Retry</Button>
                <Button variant="outline" size="sm" onClick={() => navigate('creatorProfile')}>Create/Update Profile</Button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-gray-900 mb-2">Creator Dashboard</h1>
          <p className="text-gray-600">
            Track your campaigns, earnings, and engagement metrics
          </p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Followers"
            value={loading ? '…' : totalFollowers.toLocaleString()}
            icon={Users}
            trend={undefined}
            iconColor="bg-purple-500"
          />
          <MetricCard
            title="Engagement Rate"
            value={loading ? '…' : engagementRate}
            icon={TrendingUp}
            trend={undefined}
            iconColor="bg-green-500"
          />
          <MetricCard
            title="Active Campaigns"
            value={loading ? '…' : String(activeCampaigns)}
            icon={Briefcase}
            iconColor="bg-blue-500"
          />
          <MetricCard
            title="Total Applications"
            value={loading ? '…' : String(totalApplications)}
            icon={DollarSign}
            trend={undefined}
            iconColor="bg-yellow-500"
          />
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Upcoming Campaigns */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Assigned / Approved Campaigns</CardTitle>
                <Badge variant="secondary">{loading ? '…' : campaigns.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  {campaigns.map((campaign: any) => {
                    const app = applicationForCampaign(campaign.id)
                    const awaitingResponse = app && !app.creatorResponse
                    return (
                      <div key={campaign.id} className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-gray-900">{campaign.title}</p>
                            <p className="text-sm text-gray-600 mt-1">{campaign.brand?.companyName || 'Unknown Brand'}</p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={campaign.status === 'ACTIVE' ? 'bg-blue-50 text-blue-700' : campaign.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-50 text-gray-700'}
                          >
                            {campaign.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                          <div>
                            <p className="text-gray-600">Start</p>
                            <p className="text-gray-900 mt-1">{campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : '—'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">End</p>
                            <p className="text-gray-900 mt-1">{campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : '—'}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Budget</p>
                            <p className="text-gray-900 mt-1">{campaign.budget ? inr.format(campaign.budget) : '—'}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {awaitingResponse ? (
                            <>
                              <Button 
                                size="sm" 
                                className="flex-1 bg-green-600 hover:bg-green-700"
                                onClick={() => app && handleApplicationResponse(app.id, 'ACCEPTED')}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Accept
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                                onClick={() => app && handleApplicationResponse(app.id, 'DECLINED')}
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Decline
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                onClick={() => toast.info('Chat coming soon')}
                              >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Chat
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="outline" size="sm" className="flex-1">
                                View Details
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                onClick={() => toast.info('Chat coming soon')}
                              >
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Chat
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {campaigns.length === 0 && (
                    <div className="p-4 border rounded bg-gray-50 text-sm text-gray-600">
                      No campaigns assigned yet. If you don’t see anything, ensure your profile is created and approved.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Feed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((activity, i) => (
                    <div key={i} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        {activity.type === 'payment' && <DollarSign className="w-4 h-4 text-green-600" />}
                        {activity.type === 'message' && <Users className="w-4 h-4 text-blue-600" />}
                        {activity.type === 'campaign' && <Briefcase className="w-4 h-4 text-purple-600" />}
                        {activity.type === 'invite' && <Calendar className="w-4 h-4 text-yellow-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                        {activity.type === 'payment' && (
                          <p className="text-xs text-green-700 mt-1">{inr.format(activity.amount || 0)}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {campaigns.length === 0 && (
                    <p className="text-sm text-gray-600">No recent activity.</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Performance Overview */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : (
                <div className="space-y-4">
                  {['Instagram', 'TikTok', 'YouTube'].map((platform) => (
                    <div key={platform}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">{platform}</span>
                        <span className="text-sm text-gray-900">
                          {platform === 'Instagram' && creator?.instagramFollowers ? `${creator.instagramFollowers.toLocaleString()} followers` :
                           platform === 'TikTok' && creator?.tiktokFollowers ? `${creator.tiktokFollowers.toLocaleString()} followers` :
                           platform === 'YouTube' && creator?.youtubeFollowers ? `${creator.youtubeFollowers.toLocaleString()} followers` : '—'}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(0, creator?.avgEngagementRate || 0) * 10)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Applications Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600">Total Applications</p>
                      <p className="text-gray-900 mt-1">{stats?.totalApplications ?? 0}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-blue-600" />
                  </div>

                  <div className="space-y-3">
                    {[
                      { label: 'Approved', value: stats?.approvedApplications ?? 0 },
                      { label: 'Pending', value: stats?.pendingApplications ?? 0 },
                      { label: 'Rejected', value: stats?.rejectedApplications ?? 0 },
                      { label: 'Shortlisted', value: stats?.shortlistCount ?? 0 },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-900">{item.value}</span>
                          <Badge 
                            variant="outline" 
                            className="bg-gray-50 text-gray-700"
                          >
                            {item.label}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button variant="outline" className="w-full mt-4" onClick={() => navigate('creatorApplications')}>
                    View Applications
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pending Applications */}
        {pendingApplications.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pending Responses</CardTitle>
                <Badge variant="secondary">{pendingApplications.length}</Badge>
              </div>
              <p className="text-sm text-gray-600">Applications approved by brands awaiting your response</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingApplications.map((app: any) => (
                  <div key={app.id} className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-gray-900 font-medium">{app.campaign?.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{app.campaign?.brand?.companyName || 'Unknown Brand'}</p>
                        {app.proposedPrice && (
                          <p className="text-sm text-green-700 mt-1">Proposed Rate: {inr.format(app.proposedPrice)}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                        Awaiting Response
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-gray-600">Campaign Budget</p>
                        <p className="text-gray-900 mt-1">{app.campaign?.budget ? inr.format(app.campaign.budget) : '—'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Deadline</p>
                        <p className="text-gray-900 mt-1">{app.campaign?.endDate ? new Date(app.campaign.endDate).toLocaleDateString() : '—'}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleApplicationResponse(app.id, 'ACCEPTED')}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accept
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                        onClick={() => handleApplicationResponse(app.id, 'DECLINED')}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-auto flex-col gap-2 py-6"
                onClick={() => navigate('creatorProfile')}
              >
                <Users className="w-6 h-6" />
                <span>Update Profile</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto flex-col gap-2 py-6"
                onClick={() => navigate('pricePrediction')}
              >
                <DollarSign className="w-6 h-6" />
                <span>Pricing Tool</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto flex-col gap-2 py-6"
                onClick={() => navigate('creatorCalendar')}
              >
                <Calendar className="w-6 h-6" />
                <span>View Calendar</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
