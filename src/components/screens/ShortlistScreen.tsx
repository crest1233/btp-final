import { useEffect, useState } from 'react';
import Layout from '../Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import CreatorCard from '../CreatorCard';
import { get, del } from '../../system/api';
import { toast } from 'sonner';

interface ShortlistScreenProps {
  appState?: any;
  navigate: (screen: string, updates?: any) => void;
}

export default function ShortlistScreen({ appState, navigate }: ShortlistScreenProps) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([] as any[]);
  const [niche, setNiche] = useState('all');

  useEffect(() => {
    const fetchShortlist = async () => {
      try {
        setLoading(true);
        const res: any = await get('/api/shortlists');
        const list: any[] = Array.isArray(res)
          ? res
          : Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res?.shortlist)
          ? res.shortlist
          : [];
        setItems(list);
      } catch (e: any) {
        toast.error(e?.message || 'Failed to load shortlist');
      } finally {
        setLoading(false);
      }
    };
    fetchShortlist();
  }, []);

  const handleRemove = async (item: any) => {
    try {
      await del(`/api/shortlists/${item.id}`);
      setItems((prev: any[]) => prev.filter((i: any) => i.id !== item.id));
      toast.success('Removed from shortlist');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to remove');
    }
  };

  const visibleItems = (Array.isArray(items) ? items : ([] as any[])).filter((i: any) => {
    const c = i.creator || {};
    if (niche === 'all') return true;
    const cats = Array.isArray(c.categories) ? c.categories : [];
    return cats.some((cat: any) => String(cat).toLowerCase() === String(niche).toLowerCase());
  });

  // Normalize creator data for card display
  const formatFollowers = (c: any) => {
    const ig = c.instagramFollowers || 0;
    const tt = c.tiktokFollowers || 0;
    const yt = c.youtubeFollowers || 0;
    const total = ig + tt + yt;
    return total ? `${total.toLocaleString()} total` : '';
  };

  const creatorToCard = (c: any) => ({
    id: c?.id,
    name: c?.displayName || c?.username || c?.name || 'Unknown',
    image: c?.avatar || c?.avatarUrl || c?.image || '/placeholder.svg',
    niche: Array.isArray(c?.categories) && c.categories.length ? c.categories[0] : (c?.niche || c?.category || 'General'),
    followers: formatFollowers(c),
    engagement: c?.avgEngagementRate != null ? `${c.avgEngagementRate}%` : (c?.engagementRate || c?.stats?.engagementRate || ''),
    avgViews: c?.avgViews || c?.stats?.avgViews || undefined,
    rating: c?.rating || undefined,
    rate: c?.basePrice != null ? `$${c.basePrice}` : (c?.rate || undefined),
  });

  return (
    <Layout navigate={navigate} userRole={appState?.userRole} currentScreen="shortlist">
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Shortlisted Creators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 mb-4">
              <Select value={niche} onValueChange={setNiche}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by niche" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="fashion">Fashion</SelectItem>
                  <SelectItem value="beauty">Beauty</SelectItem>
                  <SelectItem value="tech">Tech</SelectItem>
                  <SelectItem value="fitness">Fitness</SelectItem>
                  <SelectItem value="lifestyle">Lifestyle</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => navigate('creatorSearch')}>Discover more</Button>
            </div>

            {loading ? (
              <div>Loading shortlist...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibleItems.map((item: any, i: number) => (
                  <div key={item.id ?? i}>
                    <CreatorCard
                      creator={creatorToCard(item.creator)}
                      isShortlisted={true}
                      onShortlist={() => handleRemove(item)}
                      onView={() => navigate('creatorProfile', { viewingCreatorId: item.creator.id, previewMode: true })}
                    />
                  </div>
                ))}
                {visibleItems.length === 0 && (
                  <div className="text-gray-600">No creators in your shortlist.</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
