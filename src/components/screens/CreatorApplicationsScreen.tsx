import Layout from '../Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useEffect, useState } from 'react';
import { AppState } from '../../App';
import { get, put, post } from '../../system/api';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Briefcase } from 'lucide-react';

interface CreatorApplicationsScreenProps {
  navigate: (screen: string, updates?: any) => void;
  appState?: AppState;
}

export default function CreatorApplicationsScreen({ navigate, appState }: CreatorApplicationsScreenProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null as string | null);
  const [applications, setApplications] = useState([] as any[]);
  const [creatorId, setCreatorId] = useState(null as string | null);

  const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const me = await get('/api/auth/me');
      const cid = me?.user?.creator?.id;
      if (!cid) throw new Error('No creator profile found. Please create your creator profile.');
      setCreatorId(cid);
      const res = await get(`/api/creators/${cid}/applications`);
      const items = Array.isArray((res as any)?.items) ? (res as any).items : Array.isArray(res) ? res : [];
      setApplications(items);
    } catch (err: any) {
      setError(err?.message || 'Failed to load applications');
      toast.error(err?.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRespond = async (id: string, response: 'ACCEPTED' | 'DECLINED') => {
    try {
      await put(`/api/campaigns/applications/${id}/respond`, { response });
      setApplications(prev => prev.map(a => a.id === id ? { ...a, creatorResponse: response } : a));
      toast.success(`Application ${response.toLowerCase()} successfully!`);

      if (response === 'ACCEPTED' && creatorId) {
        const app = applications.find(a => a.id === id);
        const camp = app?.campaign;
        const title = `Campaign: ${camp?.title || camp?.name || 'Untitled'}`;
        const startAt = camp?.startDate || new Date().toISOString();
        const endAt = camp?.endDate || null;
        const description = camp?.description || 'Accepted campaign';
        try {
          await post(`/api/creators/${creatorId}/events`, { title, startAt, endAt, description });
          toast.success('Added to calendar');
        } catch (e: any) {
          toast.error(e?.message || 'Failed to add to calendar');
        }
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to respond');
    }
  };

  return (
    <Layout navigate={navigate} userRole={appState?.userRole || 'creator'} currentScreen="creatorApplications">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-gray-900 mb-2">My Applications</h1>
            <p className="text-gray-600">View, track, and respond to your campaign applications</p>
          </div>
          <Button variant="outline" onClick={() => navigate('creatorDashboard')}>Back to Dashboard</Button>
        </div>

        {error && (
          <div className="mb-4 p-3 border border-red-300 bg-red-50 text-red-700 rounded">
            <div className="flex items-center justify-between">
              <p className="text-sm">{error}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={loadApplications}>Retry</Button>
                <Button variant="outline" size="sm" onClick={() => navigate('creatorProfile')}>Create/Update Profile</Button>
              </div>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Applications</CardTitle>
              <Badge variant="secondary">{loading ? '…' : applications.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="p-6 text-center">
                <Briefcase className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Loading applications…</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="p-6 text-center">
                <Briefcase className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No applications found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map(app => (
                  <div key={app.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-gray-900">{app.campaign?.title || app.campaign?.name}</p>
                        <p className="text-sm text-gray-600">{app.campaign?.brand?.companyName || 'Brand'} • Budget {inr.format(app.campaign?.budget || 0)}</p>
                        <p className="text-xs text-gray-500">Submitted {new Date(app.createdAt).toLocaleDateString()}</p>
                      </div>
                      <Badge variant="secondary">{app.status || 'PENDING'}</Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        <p>Proposed: {inr.format(app.proposedPrice || 0)}</p>
                        {app.message && <p className="text-xs text-gray-600">“{app.message}”</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {!app.creatorResponse ? (
                          <>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleRespond(app.id, 'ACCEPTED')}>
                              <CheckCircle className="w-4 h-4 mr-2" /> Accept
                            </Button>
                            <Button variant="outline" size="sm" className="border-red-300 text-red-700 hover:bg-red-50" onClick={() => handleRespond(app.id, 'DECLINED')}>
                              <XCircle className="w-4 h-4 mr-2" /> Decline
                            </Button>
                          </>
                        ) : (
                          <Badge variant="secondary">{app.creatorResponse || 'No response'}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}