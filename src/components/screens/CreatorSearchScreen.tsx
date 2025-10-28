import { useEffect, useMemo, useState } from 'react';
import Layout from '../Layout';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import CreatorCard from '../CreatorCard';
import { get, post, del } from '../../system/api';
import { toast } from 'sonner';

interface CreatorSearchScreenProps {
  appState?: any;
  navigate: (screen: string, updates?: any) => void;
}

export default function CreatorSearchScreen({ appState, navigate }: CreatorSearchScreenProps) {
  const [loading, setLoading] = useState(true);
  const [creators, setCreators] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [minFollowers, setMinFollowers] = useState('');
  const [minEngagement, setMinEngagement] = useState('');
  const [shortlistMap, setShortlistMap] = useState<Record<string, string>>({});

  const brandId = appState?.user?.brand?.id || appState?.user?.brandId || appState?.brandId;

  const queryString = useMemo(() => {
    const params: Record<string, string> = {} as any;
    if (search) params.search = search;
    if (category) params.category = category;
    if (location) params.location = location;
    if (minFollowers) params.minFollowers = minFollowers;
    if (minEngagement) params.minEngagement = minEngagement;
    const qs = new URLSearchParams(params as any).toString();
    return qs ? `?${qs}` : '';
  }, [search, category, location, minFollowers, minEngagement]);

  useEffect(() => {
    const fetchCreators = async () => {
      setLoading(true);
      try {
        const creatorsRes = await get(`/api/creators${queryString}`);
        let creatorItems: any[] = [];
        if (Array.isArray(creatorsRes)) creatorItems = creatorsRes;
        else if (Array.isArray((creatorsRes as any)?.creators)) creatorItems = (creatorsRes as any).creators;
        else if (Array.isArray((creatorsRes as any)?.items)) creatorItems = (creatorsRes as any).items;
        else if (Array.isArray((creatorsRes as any)?.data)) creatorItems = (creatorsRes as any).data;
        setCreators(creatorItems);
      } catch (e: any) {
        toast.error(e?.message || 'Failed to load creators');
      } finally {
        setLoading(false);
      }
    };

    const fetchShortlist = async () => {
      try {
        const shortlistRes = await get('/api/shortlists');
        const shortlistItems: any[] = Array.isArray(shortlistRes)
          ? shortlistRes
          : Array.isArray((shortlistRes as any)?.items)
          ? (shortlistRes as any).items
          : Array.isArray((shortlistRes as any)?.shortlist)
          ? (shortlistRes as any).shortlist
          : [];
        const map: any = {};
        shortlistItems.forEach((s: any) => {
          if (s?.creator?.id) map[String(s.creator.id)] = String(s.id);
        });
        setShortlistMap(map);
      } catch (e: any) {
        // Do not block creators if shortlist fails
        console.warn('Shortlist fetch failed', e?.message || e);
      }
    };

    fetchCreators();
    fetchShortlist();
  }, [queryString]);

  const handleShortlist = async (creator: any) => {
    if (!brandId) {
      toast.error('No brand account found');
      return;
    }
    try {
      const res = await post('/api/shortlists', { creatorId: creator.id });
      const item = res?.shortlist || res;
      setShortlistMap((prev: any) => ({ ...prev, [String(creator.id)]: String(item.id) }));
      toast.success('Added to shortlist');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to shortlist');
    }
  };

  const handleUnshortlist = async (creator: any) => {
    const listId = (shortlistMap as any)[String(creator.id)];
    if (!listId) return;
    try {
      await del(`/api/shortlists/${listId}`);
      setShortlistMap((prev: any) => {
        const copy = { ...prev } as any;
        delete copy[String(creator.id)];
        return copy;
      });
      toast.success('Removed from shortlist');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to remove');
    }
  };

  const formatFollowers = (c: any) => {
    const ig = c.instagramFollowers || 0;
    const tt = c.tiktokFollowers || 0;
    const yt = c.youtubeFollowers || 0;
    const total = ig + tt + yt;
    return total ? `${total.toLocaleString()} total` : '';
  };

  const creatorToCard = (c: any) => ({
    id: c.id,
    name: c.displayName || c.username || c.name || 'Unknown',
    image: c.avatar || c.avatarUrl || c.image || '/placeholder.svg',
    niche: Array.isArray(c.categories) && c.categories.length ? c.categories[0] : (c.category || c.niche || 'General'),
    followers: formatFollowers(c),
    engagement: c.avgEngagementRate != null ? `${c.avgEngagementRate}%` : (c.engagementRate || c.stats?.engagementRate || ''),
    avgViews: c.avgViews || c.stats?.avgViews || undefined,
    rating: c.rating || undefined,
    rate: c.basePrice != null ? `$${c.basePrice}` : (c.rate || undefined),
  });

  return (
    <Layout navigate={navigate} userRole={appState?.userRole} currentScreen="creatorSearch">
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Discover Creators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
              <Input placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fashion">Fashion</SelectItem>
                  <SelectItem value="beauty">Beauty</SelectItem>
                  <SelectItem value="tech">Tech</SelectItem>
                  <SelectItem value="fitness">Fitness</SelectItem>
                  <SelectItem value="lifestyle">Lifestyle</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
              <Input placeholder="Min followers" type="number" value={minFollowers} onChange={(e) => setMinFollowers(e.target.value)} />
              <Input placeholder="Min engagement %" type="number" value={minEngagement} onChange={(e) => setMinEngagement(e.target.value)} />
            </div>
            {loading ? (
              <div>Loading creators...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {creators.map((c: any, i: number) => {
                  const card = creatorToCard(c);
                  const isShortlisted = !!(shortlistMap as any)[String(c.id)];
                  return (
                    <div key={card.id || c.id || i}>
                      <CreatorCard
                        creator={card}
                        isShortlisted={isShortlisted}
                        onShortlist={() => (isShortlisted ? handleUnshortlist(c) : handleShortlist(c))}
                        onView={() => navigate('creatorProfile', { viewingCreatorId: c.id, previewMode: true })}
                      />
                    </div>
                  );
                })}
                {creators.length === 0 && (
                  <div className="text-gray-600">No creators match your filters.</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
