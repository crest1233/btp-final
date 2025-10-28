import { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Lightbulb, Plus, Search, Mic, Paperclip, Tag, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { get } from '../../system/api';
import { toast } from 'sonner';

interface Idea {
  id: string;
  title: string;
  description: string;
  tags: string[];
  brand?: string;
  campaign?: string;
  hasMedia: boolean;
  hasVoiceNote: boolean;
  createdAt: string;
}

const mockIdeas: Idea[] = [
  {
    id: '1',
    title: 'Sustainable Fashion Lookbook',
    description: 'Create a series showcasing eco-friendly fashion brands with styling tips',
    tags: ['Fashion', 'Sustainability', 'Styling'],
    brand: 'GreenThreads',
    hasMedia: true,
    hasVoiceNote: false,
    createdAt: '2025-10-20'
  },
  {
    id: '2',
    title: 'Morning Routine Wellness Series',
    description: 'Document morning routines featuring wellness products and mindfulness practices',
    tags: ['Wellness', 'Lifestyle', 'Routine'],
    hasMedia: false,
    hasVoiceNote: true,
    createdAt: '2025-10-19'
  },
  {
    id: '3',
    title: 'Tech Review: Smart Home Gadgets',
    description: 'Comprehensive review series of latest smart home technology',
    tags: ['Tech', 'Review', 'Smart Home'],
    brand: 'TechGear',
    campaign: 'Product Review',
    hasMedia: true,
    hasVoiceNote: false,
    createdAt: '2025-10-18'
  },
  {
    id: '4',
    title: 'Quick Recipe Reels',
    description: '30-second recipe videos focusing on healthy meal prep',
    tags: ['Food', 'Recipe', 'Health'],
    hasMedia: false,
    hasVoiceNote: false,
    createdAt: '2025-10-17'
  },
  {
    id: '5',
    title: 'Fitness Challenge Series',
    description: '30-day fitness challenge with daily exercises and progress tracking',
    tags: ['Fitness', 'Challenge', 'Motivation'],
    brand: 'FitLife',
    hasMedia: true,
    hasVoiceNote: true,
    createdAt: '2025-10-16'
  }
];

const tagColors: { [key: string]: string } = {
  'Fashion': 'bg-pink-100 text-pink-700',
  'Sustainability': 'bg-green-100 text-green-700',
  'Styling': 'bg-purple-100 text-purple-700',
  'Wellness': 'bg-blue-100 text-blue-700',
  'Lifestyle': 'bg-orange-100 text-orange-700',
  'Routine': 'bg-cyan-100 text-cyan-700',
  'Tech': 'bg-indigo-100 text-indigo-700',
  'Review': 'bg-gray-100 text-gray-700',
  'Smart Home': 'bg-slate-100 text-slate-700',
  'Food': 'bg-amber-100 text-amber-700',
  'Recipe': 'bg-lime-100 text-lime-700',
  'Health': 'bg-emerald-100 text-emerald-700',
  'Fitness': 'bg-red-100 text-red-700',
  'Challenge': 'bg-fuchsia-100 text-fuchsia-700',
  'Motivation': 'bg-rose-100 text-rose-700'
};

export default function IdeaVault() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [isRecording, setIsRecording] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTags, setNewTags] = useState('');
  const [dataSource, setDataSource] = useState<'backend' | 'empty'>('empty');

  useEffect(() => {
    let mounted = true;
    async function fetchIdeas() {
      try {
        const me = await get('/api/auth/me');
        const creatorId = me?.user?.creator?.id;
        if (!creatorId) {
          toast.error('No creator profile found. Please log in again.');
          setDataSource('empty');
          return;
        }
        const res = await get(`/api/creators/${creatorId}/ideas`);
        if (mounted && Array.isArray((res as any)?.items)) {
          const items = (res as any).items.map((idea: any) => ({
            id: idea.id,
            title: idea.title,
            description: idea.description || '',
            tags: idea.tags || [],
            brand: idea.brand || idea.brandName,
            campaign: idea.campaign?.title || idea.campaignTitle,
            hasMedia: Array.isArray(idea.attachments) && idea.attachments.length > 0,
            hasVoiceNote: !!idea.voiceNoteUrl,
            createdAt: idea.createdAt,
          }));
          setIdeas(items);
          setDataSource(items.length ? 'backend' : 'empty');
        }
      } catch (err: any) {
        toast.error('Failed to load ideas');
        setDataSource('empty');
      }
    }
    fetchIdeas();
    return () => { mounted = false; };
  }, []);

  // Get all unique tags
  const allTags: string[] = Array.from(new Set<string>(ideas.flatMap((idea: Idea) => idea.tags)));

  // Filter ideas
  const filteredIdeas = ideas.filter((idea: Idea) => {
    const matchesSearch = idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       idea.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === 'all' || idea.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const getTagColor = (tag: string) => {
    return tagColors[tag] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Idea Vault</h2>
          <p className="text-sm text-gray-600 mt-1">Capture and organize your content ideas</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline">{dataSource === 'backend' ? 'Live Data' : 'No Data'}</Badge>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Idea
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Idea</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" placeholder="Give your idea a catchy title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Describe your idea in detail..." 
                    rows={4}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input id="tags" placeholder="Add tags separated by commas (e.g., Fashion, Lifestyle)" value={newTags} onChange={(e) => setNewTags(e.target.value)} />
                  <p className="text-xs text-gray-500">Separate multiple tags with commas</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Linked Brand (Optional)</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select brand" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="styleco">StyleCo</SelectItem>
                        <SelectItem value="fitlife">FitLife</SelectItem>
                        <SelectItem value="techgear">TechGear</SelectItem>
                        <SelectItem value="beautybox">BeautyBox</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="campaign">Linked Campaign (Optional)</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select campaign" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="summer">Summer Collection</SelectItem>
                        <SelectItem value="workout">Workout Series</SelectItem>
                        <SelectItem value="review">Product Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Attachments</Label>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 gap-2">
                      <Paperclip className="w-4 h-4" />
                      Attach Media
                    </Button>
                    <Button 
                      variant="outline" 
                      className={`flex-1 gap-2 ${isRecording ? 'bg-red-50 border-red-300' : ''}`}
                      onClick={() => setIsRecording(!isRecording)}
                    >
                      <Mic className={`w-4 h-4 ${isRecording ? 'text-red-600' : ''}`} />
                      {isRecording ? 'Recording...' : 'Voice Note'}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button onClick={async () => {
                  try {
                    const me = await get('/api/auth/me');
                    const creatorId = me?.user?.creator?.id;
                    if (!creatorId) {
                      toast.error('No creator profile found. Please log in again.');
                      return;
                    }
                    const payload = {
                      title: newTitle,
                      description: newDescription,
                      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
                    };
                    const res = await (await import('../../system/api')).post(`/api/creators/${creatorId}/ideas`, payload);
                    toast.success('Idea saved');
                    setIdeas((prev: any[]) => [
                      {
                        id: (res as any)?.idea?.id || (res as any)?.id || `${Date.now()}`,
                        title: payload.title,
                        description: payload.description,
                        tags: payload.tags,
                        brand: undefined,
                        campaign: undefined,
                        hasMedia: false,
                        hasVoiceNote: isRecording,
                        createdAt: new Date().toISOString().slice(0, 10),
                      },
                      ...prev,
                    ]);
                    setDataSource('backend');
                    setIsAddDialogOpen(false);
                    setNewTitle('');
                    setNewDescription('');
                    setNewTags('');
                  } catch (err: any) {
                    toast.error(err?.message || 'Failed to save idea');
                  }
                }}>Save Idea</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input 
              placeholder="Search ideas..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button 
              variant={selectedTag === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setSelectedTag('all')}
            >
              All
            </Button>
            {allTags.map((tag: string) => (
              <Button 
                key={tag}
                variant={selectedTag === tag ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setSelectedTag(tag)}
                className="whitespace-nowrap"
              >
                {tag}
              </Button>
            ))}
          </div>
        </div>

        {/* Ideas Grid */}
        {filteredIdeas.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIdeas.map((idea) => (
              <Card key={idea.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
                      <Lightbulb className="w-6 h-6 text-purple-600" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit Idea</DropdownMenuItem>
                        <DropdownMenuItem>Duplicate</DropdownMenuItem>
                        <DropdownMenuItem>Link to Campaign</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={async () => {
                          try {
                            const me = await get('/api/auth/me');
                            const creatorId = me?.user?.creator?.id;
                            if (!creatorId) {
                              toast.error('No creator profile found. Please log in again.');
                              return;
                            }
                            await (await import('../../system/api')).del(`/api/creators/${creatorId}/ideas/${idea.id}`);
                            setIdeas((prev: any[]) => prev.filter((i: any) => i.id !== idea.id));
                            toast.success('Idea deleted');
                          } catch (err: any) {
                            toast.error(err?.message || 'Failed to delete idea');
                          }
                        }}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <h3 className="text-gray-900 mb-2">{idea.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{idea.description}</p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {idea.tags.map((tag: string) => (
                      <Badge key={tag} variant="outline" className={getTagColor(tag)}>
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {(idea.brand || idea.campaign) && (
                    <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
                      {idea.brand && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">Brand:</span>
                          <span className="text-gray-900">{idea.brand}</span>
                        </div>
                      )}
                      {idea.campaign && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-gray-600">Campaign:</span>
                          <span className="text-gray-900">{idea.campaign}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-3">
                      {idea.hasMedia && (
                        <div className="flex items-center gap-1">
                          <Paperclip className="w-3 h-3" />
                          <span className="text-xs">Media</span>
                        </div>
                      )}
                      {idea.hasVoiceNote && (
                        <div className="flex items-center gap-1">
                          <Mic className="w-3 h-3" />
                          <span className="text-xs">Voice</span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs">{idea.createdAt}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-900 mb-2">No ideas found</p>
              <p className="text-sm text-gray-600 mb-6">
                {searchQuery || selectedTag !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Start capturing your brilliant content ideas'}
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Your First Idea
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
}
