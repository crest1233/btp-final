import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { get, del } from '../../system/api';
import { toast } from 'sonner';
import { MoreVertical, Edit, Copy, Trash } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface CampaignDetailsScreenProps {
  appState?: any;
  navigate: (screen: string, updates?: any) => void;
}

export default function CampaignDetailsScreen({ appState, navigate }: CampaignDetailsScreenProps) {
  const campaignId = appState?.selectedCampaignId || appState?.campaignId;
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState(null as any);
  const [error, setError] = useState(null as string | null);

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!campaignId) {
        setError('No campaign selected');
        setLoading(false);
        return;
      }
      try {
        const res = await get(`/api/campaigns/${campaignId}`);
        const data = (res as any)?.campaign || res;
        setCampaign(data);
      } catch (e: any) {
        setError(e?.message || 'Failed to load campaign');
        toast.error(e?.message || 'Failed to load campaign');
      } finally {
        setLoading(false);
      }
    };
    fetchCampaign();
  }, [campaignId]);

  const handleEdit = () => {
    if (!campaign) return;
    navigate('createCampaign', { editingCampaign: campaign });
  };

  const handleDuplicate = () => {
    if (!campaign) return;
    const name = (campaign as any)?.name || (campaign as any)?.title || 'Campaign';
    const copy = { ...(campaign as any), id: undefined, name: `${name} (Copy)` };
    navigate('createCampaign', { editingCampaign: copy });
  };

  const handleDelete = async () => {
    if (!campaign) return;
    try {
      await del(`/api/campaigns/${(campaign as any).id}`);
      toast.success('Campaign deleted');
      navigate('campaignManagement');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete campaign');
    }
  };

  if (loading) {
    return <div className="p-6">Loading campaign...</div>;
  }
  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error}</p>
        <Button variant="outline" onClick={() => navigate('campaignManagement')}>Back</Button>
      </div>
    );
  }
  if (!campaign) return null;

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900 mb-1">{(campaign as any).name || (campaign as any).title}</h1>
          <p className="text-gray-600">{(campaign as any).description || 'No description provided'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{(campaign as any).status || 'active'}</Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Campaign
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600" onClick={handleDelete}>
                <Trash className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl text-gray-900">${(campaign as any).budget ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Category</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-900">{(campaign as any).category || '—'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-900">{(campaign as any).startDate ? new Date((campaign as any).startDate).toLocaleDateString() : '—'} → {(campaign as any).endDate ? new Date((campaign as any).endDate).toLocaleDateString() : '—'}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Objective & Deliverables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><span className="text-gray-600">Objective:</span> <span className="text-gray-900">{(campaign as any).objective || '—'}</span></p>
            <p><span className="text-gray-600">Deliverables:</span> <span className="text-gray-900">{(campaign as any).deliverables || '—'}</span></p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => navigate('campaignManagement')}>Back to campaigns</Button>
        <Button onClick={() => navigate('creatorSearch', { campaignId })}>Find creators</Button>
      </div>
    </div>
  );
}
