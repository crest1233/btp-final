import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { get } from '../../system/api';
import { toast } from 'sonner';
import { Download, Link2, User, Instagram, Youtube, Sparkles, DollarSign, TrendingUp, Award } from 'lucide-react';
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { toPng } from 'html-to-image'

interface MediaKitData {
  name: string;
  niche: string;
  bio: string;
  platforms: {
    instagram: { followers: number; engagement: number };
    youtube: { followers: number; engagement: number };
    tiktok: { followers: number; engagement: number };
  };
  demographics: {
    ageRange: string;
    topLocations: string[];
    genderSplit: { male: number; female: number };
  };
  topCollaborations: {
    brand: string;
    campaign: string;
    results: string;
  }[];
  pricing: {
    post: number;
    reel: number;
    story: number;
    video: number;
  };
}

const mockMediaKitData: MediaKitData = {
  name: '—',
  niche: '',
  bio: '',
  platforms: {
    instagram: { followers: 125000, engagement: 6.8 },
    youtube: { followers: 45000, engagement: 5.2 },
    tiktok: { followers: 89000, engagement: 8.1 }
  },
  demographics: {
    ageRange: '18-34',
    topLocations: ['United States', 'United Kingdom', 'Canada'],
    genderSplit: { male: 25, female: 75 }
  },
  topCollaborations: [
    { brand: 'StyleCo', campaign: 'Summer Collection', results: '250K+ reach, 12K+ engagements' },
    { brand: 'GreenThreads', campaign: 'Sustainable Fashion', results: '180K+ reach, 8.5K+ engagements' },
    { brand: 'BeautyBox', campaign: 'Monthly Unboxing', results: '150K+ reach, 7K+ engagements' }
  ],
  pricing: {
    post: 800,
    reel: 1200,
    story: 400,
    video: 2000
  }
};

export default function MediaKitGenerator() {
  const [template, setTemplate] = useState('light' as 'light' | 'dark');
  const [mediaKit, setMediaKit] = useState<MediaKitData>(mockMediaKitData);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [dataSource, setDataSource] = useState<'backend' | 'mock' | 'custom'>('mock');
  const previewRef = useRef<HTMLDivElement | null>(null);

  const exportPdf = async () => {
    try {
      if (!previewRef.current) {
        toast.error('Nothing to export');
        return;
      }
      const bg = template === 'dark' ? '#111827' : '#ffffff';
      const element = previewRef.current;
      if (!element) {
        toast.error('Nothing to export');
        return;
      }
      const dataUrl = await toPng(element, { pixelRatio: 2, cacheBust: true, backgroundColor: bg });
      const imgData = dataUrl;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const img = new Image();
      img.src = imgData;
      await new Promise<void>((resolve) => { img.onload = () => resolve(); });
      const imgWidth = pageWidth - 20;
      const imgHeight = (img.height * imgWidth) / img.width;
      const fits = imgHeight <= (pageHeight - 20);
      const w = fits ? imgWidth : imgWidth * ((pageHeight - 20) / imgHeight);
      const h = fits ? imgHeight : (pageHeight - 20);
      pdf.addImage(imgData, 'PNG', 10, 10, w, h);
      pdf.save(`${(mediaKit.name || 'MediaKit').replace(/\s+/g, '-')}.pdf`);
    } catch (err: any) {
      const message = (err && (err.message || String(err))) || 'Failed to export PDF';
      toast.error(message);
    }
  };

  useEffect(() => {
    let mounted = true;
    async function fetchMediaKit() {
      try {
        const me = await get('/api/auth/me');
        const creator = me?.user?.creator;
        const creatorId = creator?.id;
        if (!creatorId) return;
        const res = await get(`/api/creators/${creatorId}/mediakit`);
        const mk = (res as any)?.item || (Array.isArray((res as any)?.items) ? (res as any).items[0] : null);
        if (mounted) {
          const resolvedName = creator?.displayName || creator?.username || me?.user?.name || '—';
          setMediaKit({
            name: resolvedName,
            niche: (mk?.niche) || (Array.isArray(creator?.categories) ? creator.categories.join(', ') : '—'),
            bio: (mk?.bio) || creator?.bio || '—',
            platforms: {
              instagram: { followers: creator?.instagramFollowers || mk?.instagramFollowers || 0, engagement: (mk?.instagramEngagement) || creator?.engagementRate || 0 },
              youtube: { followers: creator?.youtubeFollowers || mk?.youtubeFollowers || 0, engagement: mk?.youtubeEngagement || 0 },
              tiktok: { followers: creator?.tiktokFollowers || mk?.tiktokFollowers || 0, engagement: mk?.tiktokEngagement || 0 },
            },
            demographics: {
              ageRange: mk?.ageRange || '18-34',
              topLocations: mk?.topLocations || (creator?.topLocations || ['United States']),
              genderSplit: mk?.genderSplit || { male: 50, female: 50 },
            },
            topCollaborations: mk?.topCollaborations || [],
            pricing: mk?.pricing || { post: 0, reel: 0, story: 0, video: 0 },
          });
          setDataSource('backend');
        }
      } catch (err: any) {
        toast.error('Failed to load media kit');
      }
    }
    fetchMediaKit();
    return () => { mounted = false; };
  }, []);
  const totalFollowers = (Object.values(mediaKit.platforms as any) as any[]).reduce((sum, platform: any) => sum + (platform.followers || 0), 0);
  const avgEngagement = (((Object.values(mediaKit.platforms as any) as any[]).reduce((sum, platform: any) => sum + (platform.engagement || 0), 0)) / 3).toFixed(1);

  const renderLightTemplate = () => (
    <div className="space-y-6 p-8 bg-white">
      {/* Header */}
      <div className="text-center pb-6 border-b-2 border-purple-200">
        <div className="w-24 h-24 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mx-auto mb-4" />
        <h1 className="text-4xl text-gray-900 mb-2">{mediaKit.name}</h1>
        <p className="text-xl text-gray-600 mb-4">{mediaKit.niche}</p>
        <p className="text-gray-600 max-w-2xl mx-auto">{mediaKit.bio}</p>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="text-center p-6 bg-purple-50 rounded-xl">
          <div className="text-3xl text-purple-600 mb-2">{(totalFollowers / 1000).toFixed(0)}K</div>
          <div className="text-sm text-gray-600">Total Followers</div>
        </div>
        <div className="text-center p-6 bg-blue-50 rounded-xl">
          <div className="text-3xl text-blue-600 mb-2">{avgEngagement}%</div>
          <div className="text-sm text-gray-600">Avg Engagement</div>
        </div>
        <div className="text-center p-6 bg-green-50 rounded-xl">
          <div className="text-3xl text-green-600 mb-2">{mediaKit.topCollaborations.length}+</div>
          <div className="text-sm text-gray-600">Brand Partners</div>
        </div>
        <div className="text-center p-6 bg-orange-50 rounded-xl">
          <div className="text-3xl text-orange-600 mb-2">{mediaKit.demographics.ageRange}</div>
          <div className="text-sm text-gray-600">Primary Age</div>
        </div>
      </div>

      {/* Platform Stats */}
      <div>
        <h2 className="text-2xl text-gray-900 mb-4">Platform Presence</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { name: 'Instagram', data: mediaKit.platforms.instagram, color: 'from-purple-500 to-pink-500', icon: Instagram },
            { name: 'YouTube', data: mediaKit.platforms.youtube, color: 'from-red-500 to-red-600', icon: Youtube },
            { name: 'TikTok', data: mediaKit.platforms.tiktok, color: 'from-pink-500 to-purple-500', icon: Sparkles }
          ].map((platform, i) => (
            <div key={i} className="p-6 border-2 border-gray-200 rounded-xl">
              <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${platform.color} mb-4`}>
                <platform.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg text-gray-900 mb-3">{platform.name}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Followers</span>
                  <span className="text-gray-900">{(platform.data.followers / 1000).toFixed(0)}K</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Engagement</span>
                  <span className="text-gray-900">{platform.data.engagement}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Demographics */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-2xl text-gray-900 mb-4">Audience Demographics</h2>
          <div className="space-y-4 p-6 bg-gray-50 rounded-xl">
            <div>
              <div className="text-sm text-gray-600 mb-2">Gender Split</div>
              <div className="flex gap-2">
                <div className="h-3 bg-blue-500 rounded-full" style={{ width: `${mediaKit.demographics.genderSplit.male}%` }} />
                <div className="h-3 bg-pink-500 rounded-full" style={{ width: `${mediaKit.demographics.genderSplit.female}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>Male {mediaKit.demographics.genderSplit.male}%</span>
                <span>Female {mediaKit.demographics.genderSplit.female}%</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-2">Top Locations</div>
              <div className="space-y-1">
                {mediaKit.demographics.topLocations.map((loc, i) => (
                  <div key={i} className="text-sm text-gray-900">• {loc}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl text-gray-900 mb-4">Pricing Guide</h2>
          <div className="space-y-3 p-6 bg-gray-50 rounded-xl">
            {[
              { label: 'Instagram Post', price: mediaKit.pricing.post },
              { label: 'Instagram Reel', price: mediaKit.pricing.reel },
              { label: 'Story Series (3)', price: mediaKit.pricing.story },
              { label: 'YouTube Video', price: mediaKit.pricing.video }
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-white rounded-lg">
                <span className="text-sm text-gray-700">{item.label}</span>
                <span className="text-gray-900">${item.price.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Collaborations */}
      <div>
        <h2 className="text-2xl text-gray-900 mb-4">Featured Collaborations</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {mediaKit.topCollaborations.map((collab, i) => (
            <div key={i} className="p-6 border-2 border-gray-200 rounded-xl">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center mb-3">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <h4 className="text-gray-900 mb-2">{collab.brand}</h4>
              <p className="text-sm text-gray-600 mb-2">{collab.campaign}</p>
              <p className="text-xs text-gray-500">{collab.results}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDarkTemplate = () => (
    <div className="space-y-6 p-8 bg-gray-900 text-white">
      {/* Header */}
      <div className="text-center pb-6 border-b-2 border-purple-500">
        <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-4" />
        <h1 className="text-4xl mb-2">{mediaKit.name}</h1>
        <p className="text-xl text-gray-300 mb-4">{mediaKit.niche}</p>
        <p className="text-gray-400 max-w-2xl mx-auto">{mediaKit.bio}</p>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="text-center p-6 bg-purple-900/30 rounded-xl border border-purple-500/20">
          <div className="text-3xl text-purple-400 mb-2">{(totalFollowers / 1000).toFixed(0)}K</div>
          <div className="text-sm text-gray-400">Total Followers</div>
        </div>
        <div className="text-center p-6 bg-blue-900/30 rounded-xl border border-blue-500/20">
          <div className="text-3xl text-blue-400 mb-2">{avgEngagement}%</div>
          <div className="text-sm text-gray-400">Avg Engagement</div>
        </div>
        <div className="text-center p-6 bg-green-900/30 rounded-xl border border-green-500/20">
          <div className="text-3xl text-green-400 mb-2">{mediaKit.topCollaborations.length}+</div>
          <div className="text-sm text-gray-400">Brand Partners</div>
        </div>
        <div className="text-center p-6 bg-orange-900/30 rounded-xl border border-orange-500/20">
          <div className="text-3xl text-orange-400 mb-2">{mediaKit.demographics.ageRange}</div>
          <div className="text-sm text-gray-400">Primary Age</div>
        </div>
      </div>

      {/* Platform Stats */}
      <div>
        <h2 className="text-2xl mb-4">Platform Presence</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { name: 'Instagram', data: mediaKit.platforms.instagram, color: 'from-purple-500 to-pink-500', icon: Instagram },
            { name: 'YouTube', data: mediaKit.platforms.youtube, color: 'from-red-500 to-red-600', icon: Youtube },
            { name: 'TikTok', data: mediaKit.platforms.tiktok, color: 'from-pink-500 to-purple-500', icon: Sparkles }
          ].map((platform, i) => (
            <div key={i} className="p-6 bg-gray-800 rounded-xl border border-gray-700">
              <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${platform.color} mb-4`}>
                <platform.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg mb-3">{platform.name}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Followers</span>
                  <span>{(platform.data.followers / 1000).toFixed(0)}K</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Engagement</span>
                  <span>{platform.data.engagement}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Demographics & Pricing */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-2xl mb-4">Audience Demographics</h2>
          <div className="space-y-4 p-6 bg-gray-800 rounded-xl border border-gray-700">
            <div>
              <div className="text-sm text-gray-400 mb-2">Gender Split</div>
              <div className="flex gap-2">
                <div className="h-3 bg-blue-500 rounded-full" style={{ width: `${mediaKit.demographics.genderSplit.male}%` }} />
                <div className="h-3 bg-pink-500 rounded-full" style={{ width: `${mediaKit.demographics.genderSplit.female}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Male {mediaKit.demographics.genderSplit.male}%</span>
                <span>Female {mediaKit.demographics.genderSplit.female}%</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-2">Top Locations</div>
              <div className="space-y-1">
                {mediaKit.demographics.topLocations.map((loc, i) => (
                  <div key={i} className="text-sm">• {loc}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl mb-4">Pricing Guide</h2>
          <div className="space-y-3 p-6 bg-gray-800 rounded-xl border border-gray-700">
            {[
              { label: 'Instagram Post', price: mediaKit.pricing.post },
              { label: 'Instagram Reel', price: mediaKit.pricing.reel },
              { label: 'Story Series (3)', price: mediaKit.pricing.story },
              { label: 'YouTube Video', price: mediaKit.pricing.video }
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-gray-900 rounded-lg">
                <span className="text-sm text-gray-300">{item.label}</span>
                <span>${item.price.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Collaborations */}
      <div>
        <h2 className="text-2xl mb-4">Featured Collaborations</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {mediaKit.topCollaborations.map((collab, i) => (
            <div key={i} className="p-6 bg-gray-800 rounded-xl border border-gray-700">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mb-3">
                <Award className="w-5 h-5 text-white" />
              </div>
              <h4 className="mb-2">{collab.brand}</h4>
              <p className="text-sm text-gray-400 mb-2">{collab.campaign}</p>
              <p className="text-xs text-gray-500">{collab.results}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Media Kit Generator</h2>
          <p className="text-sm text-gray-600 mt-1">Create a professional media kit to share with brands</p>
        </div>
        <div className="flex gap-3 items-center">
          <Badge variant="outline">{dataSource === 'backend' ? 'Live Data' : dataSource === 'custom' ? 'Customized' : 'Sample Data'}</Badge>
          <Button variant="default" className="gap-2" onClick={exportPdf}>
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
          <Dialog open={isCustomizeOpen} onOpenChange={setIsCustomizeOpen}>
          <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
          <Sparkles className="w-4 h-4" />
          Customize
          </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
          <DialogTitle>Customize Media Kit</DialogTitle>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-4 py-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Name</Label>
            <Input value={mediaKit.name} onChange={(e) => setMediaKit((mk) => ({ ...mk, name: e.target.value }))} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Niche</Label>
            <Input value={mediaKit.niche} onChange={(e) => setMediaKit((mk) => ({ ...mk, niche: e.target.value }))} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Bio</Label>
            <Textarea value={mediaKit.bio} onChange={(e) => setMediaKit((mk) => ({ ...mk, bio: e.target.value }))} />
          </div>
          <div className="space-y-2">
          <Label>Instagram Followers</Label>
          <Input type="number" value={mediaKit.platforms.instagram.followers} onChange={(e) => setMediaKit((mk) => ({...mk, platforms: {...mk.platforms, instagram: {...mk.platforms.instagram, followers: parseInt(e.target.value || '0')}}}))} />
          </div>
          <div className="space-y-2">
          <Label>Instagram Engagement (%)</Label>
          <Input type="number" step="0.1" value={mediaKit.platforms.instagram.engagement} onChange={(e) => setMediaKit((mk) => ({...mk, platforms: {...mk.platforms, instagram: {...mk.platforms.instagram, engagement: parseFloat(e.target.value || '0')}}}))} />
          </div>
          <div className="space-y-2">
          <Label>YouTube Followers</Label>
          <Input type="number" value={mediaKit.platforms.youtube.followers} onChange={(e) => setMediaKit((mk) => ({...mk, platforms: {...mk.platforms, youtube: {...mk.platforms.youtube, followers: parseInt(e.target.value || '0')}}}))} />
          </div>
          <div className="space-y-2">
          <Label>YouTube Engagement (%)</Label>
          <Input type="number" step="0.1" value={mediaKit.platforms.youtube.engagement} onChange={(e) => setMediaKit((mk) => ({...mk, platforms: {...mk.platforms, youtube: {...mk.platforms.youtube, engagement: parseFloat(e.target.value || '0')}}}))} />
          </div>
          <div className="space-y-2">
          <Label>TikTok Followers</Label>
          <Input type="number" value={mediaKit.platforms.tiktok.followers} onChange={(e) => setMediaKit((mk) => ({...mk, platforms: {...mk.platforms, tiktok: {...mk.platforms.tiktok, followers: parseInt(e.target.value || '0')}}}))} />
          </div>
          <div className="space-y-2">
          <Label>TikTok Engagement (%)</Label>
          <Input type="number" step="0.1" value={mediaKit.platforms.tiktok.engagement} onChange={(e) => setMediaKit((mk) => ({...mk, platforms: {...mk.platforms, tiktok: {...mk.platforms.tiktok, engagement: parseFloat(e.target.value || '0')}}}))} />
          </div>
          <div className="space-y-2">
          <Label>Age Range</Label>
          <Input value={mediaKit.demographics.ageRange} onChange={(e) => setMediaKit((mk) => ({...mk, demographics: {...mk.demographics, ageRange: e.target.value}}))} />
          </div>
          <div className="space-y-2 md:col-span-2">
          <Label>Top Locations (comma-separated)</Label>
          <Input value={mediaKit.demographics.topLocations.join(', ')} onChange={(e) => setMediaKit((mk) => ({...mk, demographics: {...mk.demographics, topLocations: e.target.value.split(',').map(s => s.trim()).filter(Boolean)}}))} />
          </div>
          <div className="space-y-2">
          <Label>Male (%)</Label>
          <Input type="number" value={mediaKit.demographics.genderSplit.male} onChange={(e) => setMediaKit((mk) => ({...mk, demographics: {...mk.demographics, genderSplit: {...mk.demographics.genderSplit, male: parseInt(e.target.value || '0')}}}))} />
          </div>
          <div className="space-y-2">
          <Label>Female (%)</Label>
          <Input type="number" value={mediaKit.demographics.genderSplit.female} onChange={(e) => setMediaKit((mk) => ({...mk, demographics: {...mk.demographics, genderSplit: {...mk.demographics.genderSplit, female: parseInt(e.target.value || '0')}}}))} />
          </div>
          <div className="space-y-2">
          <Label>Post Price ($)</Label>
          <Input type="number" value={mediaKit.pricing.post} onChange={(e) => setMediaKit((mk) => ({...mk, pricing: {...mk.pricing, post: parseInt(e.target.value || '0')}}))} />
          </div>
          <div className="space-y-2">
          <Label>Reel Price ($)</Label>
          <Input type="number" value={mediaKit.pricing.reel} onChange={(e) => setMediaKit((mk) => ({...mk, pricing: {...mk.pricing, reel: parseInt(e.target.value || '0')}}))} />
          </div>
          <div className="space-y-2">
          <Label>Story Price ($)</Label>
          <Input type="number" value={mediaKit.pricing.story} onChange={(e) => setMediaKit((mk) => ({...mk, pricing: {...mk.pricing, story: parseInt(e.target.value || '0')}}))} />
          </div>
          <div className="space-y-2">
          <Label>Video Price ($)</Label>
          <Input type="number" value={mediaKit.pricing.video} onChange={(e) => setMediaKit((mk) => ({...mk, pricing: {...mk.pricing, video: parseInt(e.target.value || '0')}}))} />
          </div>
          </div>
          <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsCustomizeOpen(false)}>Cancel</Button>
          <Button onClick={() => { setIsCustomizeOpen(false); setDataSource('custom'); toast.success('Media kit updated'); }}>Save</Button>
          </div>
          </DialogContent>
          </Dialog>
           <Button 
             variant="outline" 
             className="gap-2"
             onClick={async () => {
               try {
                 const me = await get('/api/auth/me');
                 const creatorId = me?.creator?.id || me?.user?.creator?.id;
                 const url = `${window.location.origin}/creator/${creatorId}/mediakit`;
                 await navigator.clipboard.writeText(url);
                 toast.success('Link copied to clipboard');
               } catch (err) {
                 toast.error('Failed to copy link');
               }
             }}
           >
             <Link2 className="w-4 h-4" />
             Copy Link
           </Button>
           <Button 
             className="gap-2"
             onClick={exportPdf}
           >
             <Download className="w-4 h-4" />
             Export PDF
           </Button>
           <Button 
             variant="outline"
             className="gap-2"
             onClick={async () => {
               try {
                 const me = await get('/api/auth/me');
                 const creatorId = me?.creator?.id || me?.user?.creator?.id;
                 if (!creatorId) return;
                 await (await import('../../system/api')).put(`/api/creators/${creatorId}/mediakit`, { ...mediaKit });
                 setDataSource('backend');
                 toast.success('Media kit synced');
               } catch (err) {
                 toast.error('Failed to sync');
               }
             }}
           >
             <TrendingUp className="w-4 h-4" />
             Sync to Backend
           </Button>
         </div>
       </div>

      {/* Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Edit Media Kit
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Your Name</Label>
              <Input value={mediaKit.name} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Niche</Label>
              <Input value={mediaKit.niche} onChange={(e) => { setMediaKit((mk) => ({ ...mk, niche: e.target.value })); setDataSource('custom'); }} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea value={mediaKit.bio} rows={3} onChange={(e) => { setMediaKit((mk) => ({ ...mk, bio: e.target.value })); setDataSource('custom'); }} />
          </div>
          <p className="text-sm text-gray-500">
            Data is auto-synced from your Analytics Dashboard and Finance Hub
          </p>
        </CardContent>
      </Card>

      {/* Template Selector */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900">Choose Template</h3>
            <Tabs value={template} onValueChange={(v: string) => setTemplate(v as 'light' | 'dark')}>
              <TabsList>
                <TabsTrigger value="light">Minimal Light</TabsTrigger>
                <TabsTrigger value="dark">Bold Dark</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Preview</CardTitle>
            <Badge>{template === 'light' ? 'Minimal Light' : 'Bold Dark'}</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[800px] overflow-y-auto max-w-[794px] mx-auto" ref={previewRef}>
            {template === 'light' ? renderLightTemplate() : renderDarkTemplate()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
