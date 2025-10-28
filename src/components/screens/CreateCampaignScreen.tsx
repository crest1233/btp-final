import { useEffect, useMemo, useState } from 'react';
import Layout from '../Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { post, put, get } from '../../system/api';

interface CreateCampaignScreenProps {
  appState: any;
  navigate: (screen: string, updates?: any) => void;
}

export default function CreateCampaignScreen({ appState, navigate }: CreateCampaignScreenProps) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    objective: '',
    category: '',
    budget: '',
    startDate: '',
    endDate: '',
    targetAudience: '',
    contentType: '',
    deliverables: '',
  });

  // Prefill when editing an existing campaign
  const editingCampaign = appState?.editingCampaign || null;
  useEffect(() => {
    if (editingCampaign) {
      setStep(1);
      setFormData({
        name: editingCampaign.name || editingCampaign.title || '',
        description: editingCampaign.description || '',
        objective: editingCampaign.objective || '',
        category: editingCampaign.category || (Array.isArray(editingCampaign.preferredCategories) ? editingCampaign.preferredCategories[0] : ''),
        budget: String(editingCampaign.budget || ''),
        startDate: (editingCampaign.startDate ? String(editingCampaign.startDate).slice(0, 10) : ''),
        endDate: (editingCampaign.endDate ? String(editingCampaign.endDate).slice(0, 10) : ''),
        targetAudience: editingCampaign.targetAudience || '',
        contentType: editingCampaign.contentType || '',
        deliverables: Array.isArray(editingCampaign.deliverables) ? editingCampaign.deliverables.join(', ') : (editingCampaign.deliverables || ''),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [creatorSearch, setCreatorSearch] = useState('');
  const [creatorResults, setCreatorResults] = useState([] as any[]);
  const [selectedCreators, setSelectedCreators] = useState([] as any[]);
  const [searchingCreators, setSearchingCreators] = useState(false);

  const updateField = (field: string, value: any) => setFormData({ ...formData, [field]: value });

  const computeReachScore = (c: any) => {
    const totalFollowers = (c.instagramFollowers || 0) + (c.tiktokFollowers || 0) + (c.youtubeFollowers || 0);
    const eng = typeof c.avgEngagementRate === 'number' ? c.avgEngagementRate : 0;
    return totalFollowers * (1 + eng / 100);
  };

  const fetchRecommendedCreators = async (category?: string, search?: string) => {
    try {
      setSearchingCreators(true);
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (search) params.set('search', search);
      params.set('limit', '50');
      // Fetch a pool, then sort by niche reach client-side
      const res = await get(`/api/creators?${params.toString()}`);
      const creators = Array.isArray((res as any)?.creators) ? (res as any).creators : Array.isArray(res) ? res : [];
      const sorted = creators.sort((a: any, b: any) => computeReachScore(b) - computeReachScore(a));
      setCreatorResults(sorted.slice(0, 20));
    } catch (e: any) {
      console.warn('Creator fetch failed', e?.message || e);
      toast.error(e?.message || 'Failed to load creators');
    } finally {
      setSearchingCreators(false);
    }
  };

  useEffect(() => {
    // Refresh recommended creators when entering step 2 or when category changes
    if (step === 2) {
      fetchRecommendedCreators(formData.category || undefined);
    }
  }, [step, formData.category]);

  const addCreator = (creator: any) => {
    if (!creator || !creator.id) return;
    setSelectedCreators((prev) => (prev.some((c) => c.id === creator.id) ? prev : [...prev, creator]));
  };

  const removeCreator = (creatorId: string) => {
    setSelectedCreators((prev) => prev.filter((c) => c.id !== creatorId));
  };

  const filteredCreatorResults = useMemo(() => {
    if (!creatorSearch) return creatorResults;
    const q = creatorSearch.toLowerCase();
    return creatorResults.filter((c) =>
      (c.displayName || '').toLowerCase().includes(q) ||
      (c.username || '').toLowerCase().includes(q)
    );
  }, [creatorSearch, creatorResults]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      // Basic validation
      if (!formData.name || !formData.category || !formData.description || !formData.budget || !formData.deliverables) {
        throw new Error('Please fill all required fields');
      }
      if (selectedCreators.length === 0) {
        throw new Error('Please select at least one creator for this campaign');
      }

      const payload: any = {
        title: formData.name,
        description: formData.description,
        budget: Number(formData.budget),
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : new Date().toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        deliverables: formData.deliverables.split(',').map((d) => d.trim()).filter(Boolean),
        targetAudience: formData.targetAudience || undefined,
        preferredCategories: formData.category ? [formData.category] : undefined,
        // requirements, minFollowers, maxFollowers are optional; omit if not set
      };

      let newCampaign: any;
      if (editingCampaign?.id) {
        const res = await put(`/api/campaigns/${editingCampaign.id}`, payload);
        newCampaign = (res as any)?.campaign || res;
        if (!newCampaign?.id) throw new Error('Campaign update failed');
      } else {
        const res = await post('/api/campaigns', payload);
        newCampaign = (res as any)?.campaign || res;
        if (!newCampaign?.id) throw new Error('Campaign creation failed');
      }

      // Invite selected creators only on create
      if (!editingCampaign?.id) {
        try {
          await Promise.all(
            selectedCreators.map((c) => post(`/api/campaigns/${newCampaign.id}/invite`, { creatorId: c.id }))
          );
          toast.success(`Invited ${selectedCreators.length} creator(s) to this campaign`);
        } catch (inviteErr: any) {
          console.warn('Invites failed', inviteErr?.message || inviteErr);
          toast.error(inviteErr?.message || 'Failed to invite selected creators');
        }
      }

      toast.success(editingCampaign?.id ? 'Campaign updated successfully' : 'Campaign created successfully');
      navigate('campaignDetails', { selectedCampaign: newCampaign, selectedCampaignId: newCampaign.id });
    } catch (err: any) {
      // Bubble up validation errors if provided
      const details = (err?.details && Array.isArray(err.details) ? err.details.join(', ') : '') || '';
      toast.error(details || err?.message || 'Failed to create campaign');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout navigate={navigate} userRole={appState?.userRole} currentScreen="createCampaign">
      <div className="max-w-3xl mx-auto p-4">
        <Card>
          <CardHeader>
            <CardTitle>{editingCampaign ? 'Edit Campaign' : 'Create Campaign'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Campaign Name *</Label>
                    <Input id="name" value={formData.name} onChange={(e) => updateField('name', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="objective">Objective</Label>
                    <Input id="objective" value={formData.objective} onChange={(e) => updateField('objective', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(v: string) => updateField('category', v)}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fashion">Fashion</SelectItem>
                        <SelectItem value="beauty">Beauty</SelectItem>
                        <SelectItem value="tech">Tech</SelectItem>
                        <SelectItem value="fitness">Fitness</SelectItem>
                        <SelectItem value="lifestyle">Lifestyle</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget *</Label>
                    <Input id="budget" type="number" value={formData.budget} onChange={(e) => updateField('budget', e.target.value)} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setStep(2)}>Next</Button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea id="description" value={formData.description} onChange={(e) => updateField('description', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input id="startDate" type="date" value={formData.startDate} onChange={(e) => updateField('startDate', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">End Date</Label>
                      <Input id="endDate" type="date" value={formData.endDate} onChange={(e) => updateField('endDate', e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetAudience">Target Audience</Label>
                    <Input id="targetAudience" value={formData.targetAudience} onChange={(e) => updateField('targetAudience', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contentType">Content Type</Label>
                      <Select value={formData.contentType} onValueChange={(v: string) => updateField('contentType', v)}>
                        <SelectTrigger id="contentType">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="posts">Posts</SelectItem>
                          <SelectItem value="stories">Stories</SelectItem>
                          <SelectItem value="reels">Reels</SelectItem>
                          <SelectItem value="videos">Videos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deliverables">Deliverables (comma-separated) *</Label>
                      <Input id="deliverables" value={formData.deliverables} onChange={(e) => updateField('deliverables', e.target.value)} />
                    </div>
                  </div>

                  {/* Creator selection (mandatory) */}
                  <div className="space-y-2">
                    <Label htmlFor="creatorSearch">Select Creators *</Label>
                    <Input
                      id="creatorSearch"
                      placeholder="Search by name or username"
                      value={creatorSearch}
                      onChange={(e) => setCreatorSearch(e.target.value)}
                    />

                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-2">Top 20 creators for {formData.category ? formData.category : 'overall'} category</p>
                      {searchingCreators ? (
                        <p className="text-sm text-gray-500">Loading creators…</p>
                      ) : (
                        <div className="space-y-2">
                          {filteredCreatorResults.map((cr) => (
                            <div key={cr.id} className="flex items-center justify-between p-2 bg-gray-50 border rounded">
                              <div>
                                <p className="text-sm text-gray-900">{cr.displayName || cr.username}</p>
                                <p className="text-xs text-gray-500">@{cr.username} • {(cr.avgEngagementRate || 0).toFixed ? (cr.avgEngagementRate as any).toFixed(1) : cr.avgEngagementRate || 0}% • {(cr.instagramFollowers || 0) + (cr.tiktokFollowers || 0) + (cr.youtubeFollowers || 0)} followers</p>
                              </div>
                              <div className="flex gap-2">
                                {selectedCreators.some((s) => s.id === cr.id) ? (
                                  <Button type="button" variant="outline" size="sm" onClick={() => removeCreator(cr.id)}>Remove</Button>
                                ) : (
                                  <Button type="button" size="sm" onClick={() => addCreator(cr)}>Add</Button>
                                )}
                              </div>
                            </div>
                          ))}
                          {filteredCreatorResults.length === 0 && (
                            <p className="text-sm text-gray-500">No creators match your search. Try another name or clear search.</p>
                          )}
                        </div>
                      )}
                    </div>

                    {selectedCreators.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600">Selected creators</p>
                        <div className="space-y-2">
                          {selectedCreators.map((cr) => (
                            <div key={cr.id} className="flex items-center justify-between p-2 bg-gray-50 border rounded">
                              <div>
                                <p className="text-sm text-gray-900">{cr.displayName || cr.username}</p>
                                <p className="text-xs text-gray-500">@{cr.username}</p>
                              </div>
                              <Button type="button" variant="ghost" size="sm" onClick={() => removeCreator(cr.id)}>Remove</Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
                    <Button type="submit" disabled={submitting}>{submitting ? (editingCampaign ? 'Updating...' : 'Creating...') : (editingCampaign ? 'Update Campaign' : 'Create Campaign')}</Button>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
