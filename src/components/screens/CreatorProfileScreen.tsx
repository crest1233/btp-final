import { useState, useEffect, useRef } from 'react';
import Layout from '../Layout';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Upload, Save, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { AppState } from '../../App';
import { get, put, upload } from '../../system/api';

interface CreatorProfileScreenProps {
  navigate: (screen: string, updates?: any) => void;
  appState: AppState;
}

export default function CreatorProfileScreen({ navigate, appState }: CreatorProfileScreenProps) {
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    email: '',
    location: '',
    niche: '',
    instagram: '',
    tiktok: '',
    youtube: '',
    followers: '0',
    engagement: '0',
    baseRate: '0',
    avatar: '',
  });
  const [creatorId, setCreatorId] = useState(null as string | null);
  const viewingCreatorId = (appState as any)?.viewingCreatorId || (appState as any)?.creatorId || (appState as any)?.selectedCreatorId || null;
  const [previewMode, setPreviewMode] = useState(((appState as any)?.previewMode as boolean) || ((appState as any)?.userRole !== 'creator'));
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null as HTMLInputElement | null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        let targetId: string | null = null;
        // If we are viewing a specific creator (e.g., as a brand), prefer that
        if (viewingCreatorId) {
          targetId = String(viewingCreatorId);
        } else {
          const me = await get('/api/auth/me');
          const cid = me?.user?.creator?.id;
          if (cid) targetId = String(cid);
          // Use email from current user only when editing own profile
          if (me?.user?.email) {
            setFormData(prev => ({ ...prev, email: me.user.email }));
          }
        }

        if (!targetId) {
          setLoading(false);
          return;
        }

        setCreatorId(targetId);
        const res = await get(`/api/creators/${targetId}`);
        const c = (res as any)?.creator || res;
        setFormData({
          name: c?.displayName || c?.username || '',
          bio: c?.bio || '',
          email: (appState as any)?.userRole === 'creator' ? (formData.email || '') : '',
          location: c?.location || '',
          niche: Array.isArray(c?.categories) && c.categories.length ? c.categories[0] : '',
          instagram: c?.instagramHandle || '',
          tiktok: c?.tiktokHandle || '',
          youtube: c?.youtubeHandle || '',
          followers: String((c?.instagramFollowers || 0) + (c?.tiktokFollowers || 0) + (c?.youtubeFollowers || 0)),
          engagement: c?.avgEngagementRate != null ? String(c.avgEngagementRate) : '',
          baseRate: c?.basePrice != null ? String(c.basePrice) : '',
          avatar: c?.avatar || c?.avatarUrl || '',
        });
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, [viewingCreatorId]);

  const isViewOnly = (appState as any)?.userRole !== 'creator' || (!!viewingCreatorId && viewingCreatorId !== creatorId);

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = async () => {
    try {
      if (!creatorId) {
        toast.error('Creator profile not found');
        return;
      }
      const totalFollowers = parseInt(formData.followers || '0', 10) || 0;
      const engagementNum = parseFloat(formData.engagement || '0') || 0;
      const baseRateNum = parseFloat(formData.baseRate || '0') || 0;

      await put(`/api/creators/${creatorId}`, {
        displayName: formData.name,
        bio: formData.bio || undefined,
        location: formData.location || undefined,
        categories: formData.niche ? [formData.niche] : undefined,
        instagramHandle: formData.instagram || undefined,
        tiktokHandle: formData.tiktok || undefined,
        youtubeHandle: formData.youtube || undefined,
        instagramFollowers: totalFollowers,
        tiktokFollowers: 0,
        youtubeFollowers: 0,
        avgEngagementRate: engagementNum || undefined,
        basePrice: baseRateNum || undefined,
        avatar: formData.avatar || undefined,
      });

      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update profile');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Max 5MB');
      return;
    }
    try {
      const res = await upload('/api/uploads', file, { folder: 'avatars' });
      const url = res?.url || res?.secure_url || res?.path;
      if (!url) {
        toast.error('Upload succeeded but no URL returned');
        return;
      }
      setFormData((prev) => ({ ...prev, avatar: url }));
      if (creatorId) {
        await put(`/api/creators/${creatorId}`, { avatar: url });
      }
      toast.success('Photo uploaded');
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Layout navigate={navigate} userRole={appState.userRole} currentScreen="creatorProfile">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-gray-900 mb-2">Creator Profile</h1>
            <p className="text-gray-600">
              {isViewOnly ? 'Viewing creator profile' : 'Manage your public profile and account settings'}
            </p>
          </div>
          {!isViewOnly && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setPreviewMode(!previewMode)}
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                {previewMode ? 'Edit' : 'Preview'}
              </Button>
              <Button onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          )}
        </div>

        {previewMode || isViewOnly ? (
          // Preview Mode
          <Card>
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <Avatar className="w-32 h-32 mx-auto mb-4">
                  {formData.avatar ? (
                    <AvatarImage src={formData.avatar} alt={formData.name} />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-3xl">
                      {formData.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  )}
                </Avatar>
                <h2 className="text-gray-900 mb-2">{formData.name}</h2>
                <p className="text-gray-600 mb-2">{formData.bio}</p>
                <p className="text-sm text-gray-500">{formData.location}</p>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-8">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-900">{parseInt(formData.followers).toLocaleString()}</p>
                  <p className="text-sm text-gray-600 mt-1">Followers</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-900">{formData.engagement}%</p>
                  <p className="text-sm text-gray-600 mt-1">Engagement</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-900">${formData.baseRate}/post</p>
                  <p className="text-sm text-gray-600 mt-1">Base Rate</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm text-gray-600 mb-2">Social Media</h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.instagram && (
                      <div className="px-3 py-1 bg-pink-50 text-pink-700 rounded-full text-sm">
                        Instagram: {formData.instagram}
                      </div>
                    )}
                    {formData.tiktok && (
                      <div className="px-3 py-1 bg-gray-900 text-white rounded-full text-sm">
                        TikTok: {formData.tiktok}
                      </div>
                    )}
                    {formData.youtube && (
                      <div className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm">
                        YouTube: {formData.youtube}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          // Edit Mode
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList>
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="social">Social Media</TabsTrigger>
              <TabsTrigger value="metrics">Metrics & Pricing</TabsTrigger>
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            </TabsList>

            {/* Basic Info Tab */}
            <TabsContent value="basic">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                {/* Upload button only when editing own profile */}
                {!isViewOnly && (
                  <div className="px-6 pt-4">
                    <Button variant="outline" className="gap-2" onClick={handleUploadClick}>
                      <Upload className="w-4 h-4" />
                      Upload Photo
                    </Button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelected} />
                  </div>
                )}

                <CardContent className="space-y-6">
                  {/* Avatar Upload */}
                  <div className="flex items-center gap-6">
                    <Avatar className="w-24 h-24">
                      {formData.avatar ? (
                        <AvatarImage src={formData.avatar} alt={formData.name} />
                      ) : (
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-2xl">
                          {formData.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <Button variant="outline" className="gap-2" onClick={handleUploadClick}>
                        <Upload className="w-4 h-4" />
                        Upload Photo
                      </Button>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelected} />
                      <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF. Max 5MB</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => updateField('name', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField('email', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => updateField('bio', e.target.value)}
                      rows={3}
                    />
                    <p className="text-xs text-gray-500">
                      Brief description for your public profile
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => updateField('location', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="niche">Primary Niche</Label>
                      <Select value={formData.niche} onValueChange={(value: string) => updateField('niche', value)}>
                        <SelectTrigger id="niche">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Fashion">Fashion</SelectItem>
                          <SelectItem value="Beauty">Beauty</SelectItem>
                          <SelectItem value="Fitness">Fitness</SelectItem>
                          <SelectItem value="Food">Food & Cooking</SelectItem>
                          <SelectItem value="Travel">Travel</SelectItem>
                          <SelectItem value="Tech">Technology</SelectItem>
                          <SelectItem value="Lifestyle">Lifestyle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="social">
              <Card>
                <CardHeader>
                  <CardTitle>Social Media Accounts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram Handle</Label>
                    <div className="flex gap-2">
                      <span className="inline-flex items-center px-3 bg-gray-100 border border-gray-300 rounded-l-md text-gray-600">
                        @
                      </span>
                      <Input
                        id="instagram"
                        value={formData.instagram.replace('@', '')}
                        onChange={(e) => updateField('instagram', '@' + e.target.value.replace('@', ''))}
                        className="rounded-l-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tiktok">TikTok Handle</Label>
                    <div className="flex gap-2">
                      <span className="inline-flex items-center px-3 bg-gray-100 border border-gray-300 rounded-l-md text-gray-600">
                        @
                      </span>
                      <Input
                        id="tiktok"
                        value={formData.tiktok.replace('@', '')}
                        onChange={(e) => updateField('tiktok', '@' + e.target.value.replace('@', ''))}
                        className="rounded-l-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="youtube">YouTube Channel</Label>
                    <Input
                      id="youtube"
                      value={formData.youtube}
                      onChange={(e) => updateField('youtube', e.target.value)}
                    />
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      💡 Connecting your social accounts helps brands discover you and verify your metrics
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Metrics & Pricing Tab */}
            <TabsContent value="metrics">
              <Card>
                <CardHeader>
                  <CardTitle>Metrics & Pricing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="followers">Total Followers</Label>
                      <Input
                        id="followers"
                        type="number"
                        value={formData.followers}
                        onChange={(e) => updateField('followers', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="engagement">Engagement Rate (%)</Label>
                      <Input
                        id="engagement"
                        type="number"
                        step="0.1"
                        value={formData.engagement}
                        onChange={(e) => updateField('engagement', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="baseRate">Base Rate per Post ($)</Label>
                    <Input
                      id="baseRate"
                      type="number"
                      value={formData.baseRate}
                      onChange={(e) => updateField('baseRate', e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      This is your starting rate for sponsored content
                    </p>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('pricePrediction')}
                  >
                    Use Pricing Tool for Recommendations
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Portfolio Tab */}
            <TabsContent value="portfolio">
              <Card>
                <CardHeader>
                  <CardTitle>Portfolio & Media Kit</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-purple-400 transition-colors cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Upload your media kit</p>
                    <p className="text-sm text-gray-500">PDF, up to 10MB</p>
                  </div>

                  <div>
                    <h4 className="text-sm text-gray-900 mb-3">Featured Content</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div 
                          key={i} 
                          className="aspect-square bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        />
                      ))}
                      <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-purple-400 transition-colors">
                        <Upload className="w-8 h-8 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
}
