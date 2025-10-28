import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import {
  BarChart,
  Calendar,
  CheckCheck,
  DollarSign,
  Mail,
  MoreVertical,
  Percent,
  Plus,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { get } from '../../system/api';

interface Deal {
  id: string;
  title: string;
  brand: string;
  value: number;
  status: 'new' | 'negotiating' | 'pending' | 'completed' | 'lost' | 'overdue' | 'paid';
  notes?: string;
  createdAt: string;
}

export default function DealsCRMBoard() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newValue, setNewValue] = useState<number | ''>('');
  const [newStatus, setNewStatus] = useState<Deal['status']>('new');
  const [newNotes, setNewNotes] = useState('');
  const [dataSource, setDataSource] = useState<'backend' | 'empty'>('empty');
  const [isNegotiationOpen, setIsNegotiationOpen] = useState(false);
  const [isOutreachOpen, setIsOutreachOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchDeals() {
      try {
        const me = await get('/api/auth/me');
        const creatorId = me?.user?.creator?.id;
        if (!creatorId) {
          toast.error('No creator profile found. Please log in again.');
          setDataSource('empty');
          return;
        }
        const res = await get(`/api/creators/${creatorId}/deals`);
        const items = Array.isArray((res as any)?.items) ? (res as any).items : [];
        if (mounted) {
          const mapped: Deal[] = items.map((d: any) => ({
            id: d.id,
            title: d.title,
            brand: d.brand || d.brandName,
            value: Number(d.value || 0),
            status: mapBackendStatusToUi(d.status),
            notes: d.notes || '',
            createdAt: d.createdAt,
          }));
          setDeals(mapped);
          setDataSource(mapped.length ? 'backend' : 'empty');
        }
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load deals');
        setDataSource('empty');
      }
    }
    fetchDeals();
    return () => { mounted = false; };
  }, []);

  function mapBackendStatusToUi(status?: string): Deal['status'] {
    switch ((status || '').toUpperCase()) {
      case 'NEW':
        return 'new';
      case 'NEGOTIATING':
        return 'negotiating';
      case 'ACTIVE':
        return 'pending';
      case 'COMPLETED':
        return 'paid';
      case 'LOST':
        return 'lost';
      default:
        return 'pending';
    }
  }

  function mapUiStatusToBackend(status: Deal['status']): string {
    switch (status) {
      case 'new':
        return 'NEW';
      case 'negotiating':
        return 'NEGOTIATING';
      case 'pending':
        return 'ACTIVE';
      case 'paid':
        return 'COMPLETED';
      case 'lost':
        return 'LOST';
      case 'overdue':
        return 'ACTIVE'; // map overdue to active for backend
      default:
        return 'ACTIVE';
    }
  }

  // Derived performance metrics (not hardcoded)
  const totalDeals = deals.length;
  const completedDeals = deals.filter((d) => d.status === 'paid').length;
  const activeDeals = deals.filter((d) => ['new', 'negotiating', 'pending', 'overdue'].includes(d.status)).length;
  const avgDealValue = totalDeals ? Math.round(deals.reduce((sum, d) => sum + (d.value || 0), 0) / totalDeals) : 0;
  const conversionRate = totalDeals ? Math.round((completedDeals / totalDeals) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Deals CRM</h2>
          <p className="text-sm text-gray-600 mt-1">Track brand deals and negotiations</p>
        </div>
        <Badge variant="outline">{dataSource === 'backend' ? 'Live Data' : 'No Data'}</Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pipeline */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart className="w-4 h-4" />
                <span>Pipeline</span>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Deal
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>New Deal</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input id="title" placeholder="e.g. Summer Campaign Sponsorship" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="brand">Brand</Label>
                        <Input id="brand" placeholder="e.g. StyleCo" value={newBrand} onChange={(e) => setNewBrand(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="value">Value</Label>
                        <Input id="value" type="number" placeholder="e.g. 1200" value={newValue} onChange={(e) => setNewValue(e.target.value ? Number(e.target.value) : '')} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={newStatus} onValueChange={(v) => setNewStatus(v as Deal['status'])}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="negotiating">Negotiating</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="lost">Lost</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea id="notes" placeholder="Add any context or details..." rows={3} value={newNotes} onChange={(e) => setNewNotes(e.target.value)} />
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
                          brand: newBrand,
                          value: typeof newValue === 'number' ? newValue : 0,
                          status: mapUiStatusToBackend(newStatus),
                          notes: newNotes,
                        };
                        const res = await (await import('../../system/api')).post(`/api/creators/${creatorId}/deals`, payload);
                        toast.success('Deal saved');
                        setDeals((prev: any[]) => [
                          {
                            id: (res as any)?.deal?.id || (res as any)?.id || `${Date.now()}`,
                            title: payload.title,
                            brand: payload.brand,
                            value: payload.value,
                            status: newStatus,
                            notes: payload.notes,
                            createdAt: new Date().toISOString(),
                          },
                          ...prev,
                        ]);
                        setDataSource('backend');
                        setIsAddDialogOpen(false);
                        setNewTitle('');
                        setNewBrand('');
                        setNewValue('');
                        setNewStatus('new');
                        setNewNotes('');
                      } catch (err: any) {
                        toast.error(err?.message || 'Failed to save deal');
                      }
                    }}>Save Deal</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {deals.length > 0 ? (
              <div className="space-y-4">
                {deals.map((deal) => (
                  <div key={deal.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-gray-900">{deal.title}</h3>
                        <p className="text-sm text-gray-600">{deal.brand}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={async () => {
                            try {
                              const me = await get('/api/auth/me');
                              const creatorId = me?.user?.creator?.id;
                              if (!creatorId) {
                                toast.error('No creator profile found. Please log in again.');
                                return;
                              }
                              await (await import('../../system/api')).del(`/api/creators/${creatorId}/deals/${deal.id}`);
                              setDeals((prev: any[]) => prev.filter((d: any) => d.id !== deal.id));
                              toast.success('Deal deleted');
                            } catch (err: any) {
                              toast.error(err?.message || 'Failed to delete deal');
                            }
                          }}>Delete</DropdownMenuItem>
                          <DropdownMenuItem onClick={async () => {
                            try {
                              const me = await get('/api/auth/me');
                              const creatorId = me?.user?.creator?.id;
                              if (!creatorId) {
                                toast.error('No creator profile found. Please log in again.');
                                return;
                              }
                              const payload = {
                                invoiceNumber: `INV-${Date.now()}`,
                                issueDate: new Date().toISOString().slice(0, 10),
                                status: 'sent',
                                items: [
                                  { description: deal.title, quantity: 1, unitPrice: Number(deal.value || 0) },
                                ],
                                clientName: deal.brand,
                                currency: 'USD',
                                paymentTerms: 'NET-30',
                              };
                              await (await import('../../system/api')).post(`/api/creators/${creatorId}/invoices`, payload);
                              toast.success('Invoice generated for this deal');
                            } catch (err: any) {
                              toast.error(err?.message || 'Failed to generate invoice');
                            }
                          }}>Generate Invoice</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <Badge variant="outline">{deal.status}</Badge>
                      <div className="text-gray-900 font-medium">${deal.value.toFixed(2)}</div>
                    </div>
                    {deal.notes && (
                      <p className="text-sm text-gray-600 mt-2">{deal.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-600">No deals yet</div>
            )}
          </CardContent>
        </Card>

        {/* Performance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCheck className="w-4 h-4" />
              <span>Performance</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-600">Conversion Rate</div>
                <div className="text-gray-900 font-medium">{conversionRate}%</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-600">Avg. Deal Value</div>
                <div className="text-gray-900 font-medium">${avgDealValue}</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-600">Active Deals</div>
                <div className="text-gray-900 font-medium">{activeDeals}</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-600">Completed Deals</div>
                <div className="text-gray-900 font-medium">{completedDeals}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tools */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Tools</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Removed Revenue Forecast */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4" />
                    <span>Negotiation Tips</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setIsNegotiationOpen(true)}>View</Button>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>Outreach Templates</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setIsOutreachOpen(true)}>View</Button>
                </div>
              </div>

              {/* Negotiation Dialog */}
              <Dialog open={isNegotiationOpen} onOpenChange={setIsNegotiationOpen}>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Negotiation Tips</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 text-sm text-gray-700">
                    <p>Use these tactics during brand negotiations:</p>
                    <ul className="space-y-2 list-disc pl-6">
                      <li>Anchor with a higher rate; justify with recent performance.</li>
                      <li>Offer tiered packages (content + exclusivity + usage rights).</li>
                      <li>Trade flexibility for value: rush fees or bundle add-ons.</li>
                      <li>Include usage rights and whitelisting terms explicitly.</li>
                      <li>Close with a deadline to keep momentum (e.g., valid 7 days).</li>
                    </ul>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => setIsNegotiationOpen(false)}>Close</Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Outreach Dialog */}
              <Dialog open={isOutreachOpen} onOpenChange={setIsOutreachOpen}>
                <DialogContent className="sm:max-w-[700px]">
                  <DialogHeader>
                    <DialogTitle>Outreach Templates</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 text-sm text-gray-700">
                    <div>
                      <h4 className="text-gray-900 font-medium mb-2">Cold Email</h4>
                      <Textarea rows={6} readOnly value={`Subject: Partnership Opportunity with [Brand]\n\nHi [Name],\n\nI’m [Your Name], a creator focused on [niche]. I loved your recent campaign and think my audience of [size] could drive measurable results.\n\nHere’s a quick idea: [campaign concept].\n\nRates start at $[rate], including usage rights and whitelisting. Happy to share analytics.\n\nIf this aligns, I can send options by tomorrow.\n\nBest,\n[Your Name]`} />
                    </div>
                    <div>
                      <h4 className="text-gray-900 font-medium mb-2">Instagram DM</h4>
                      <Textarea rows={5} readOnly value={`Hey [Brand]! I create [niche] content and my audience loves [topic].\n\nWould love to collaborate on [idea]. Happy to share recent stats and rates.\n\nOpen to chatting?`} />
                    </div>
                    <div>
                      <h4 className="text-gray-900 font-medium mb-2">Follow-up</h4>
                      <Textarea rows={4} readOnly value={`Hi [Name],\n\nJust checking in on the collaboration idea I sent earlier. I can hold [dates] for this.\n\nHappy to tailor deliverables to your goals.`} />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={() => setIsOutreachOpen(false)}>Close</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
