import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { FileText, Download, Plus, Settings, Trash2 } from 'lucide-react';
import { Separator } from '../ui/separator';
import { get, post, del } from '../../system/api';
import { toast } from 'sonner';

interface Invoice {
  id: string;
  invoiceNo: string;
  campaign: string;
  brand: string;
  amount: number;
  gstStatus: 'with-gst' | 'without-gst';
  date: string;
  status: 'paid' | 'pending' | 'sent';
  raw?: any;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  price: number;
  taxPercent: number;
}

const mockInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNo: 'INV-2025-001',
    campaign: 'Summer Collection',
    brand: 'StyleCo',
    amount: 1200,
    gstStatus: 'with-gst',
    date: '2025-10-15',
    status: 'paid'
  },
  {
    id: '2',
    invoiceNo: 'INV-2025-002',
    campaign: 'Workout Series',
    brand: 'FitLife',
    amount: 850,
    gstStatus: 'with-gst',
    date: '2025-10-20',
    status: 'sent'
  },
  {
    id: '3',
    invoiceNo: 'INV-2025-003',
    campaign: 'Product Review',
    brand: 'TechGear',
    amount: 600,
    gstStatus: 'without-gst',
    date: '2025-10-22',
    status: 'pending'
  }
];

export default function FinanceHub() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState([
    { description: '', quantity: 1, price: 0, taxPercent: 18 }
  ] as InvoiceItem[]);
  const [gstType, setGstType] = useState('intra' as 'intra' | 'inter');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [brandName, setBrandName] = useState('');
  const [brandGstin, setBrandGstin] = useState('');
  const [brandAddress, setBrandAddress] = useState('');
  const [hsnCode, setHsnCode] = useState('');
  const [notes, setNotes] = useState('');
  // Client fields for formal invoices
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientCompany, setClientCompany] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [clientState, setClientState] = useState('');
  const [clientZip, setClientZip] = useState('');
  const [clientCountry, setClientCountry] = useState('');
  const [clientTaxId, setClientTaxId] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [dueDate, setDueDate] = useState('');
  const [dataSource, setDataSource] = useState<'backend' | 'demo' | 'empty'>('empty');
  const [creatorInfo, setCreatorInfo] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchInvoices() {
      try {
        const me = await get('/api/auth/me');
        const creatorId = me?.user?.creator?.id;
        if (!creatorId) {
          toast.error('No creator profile found. Please log in again.');
          setDataSource('empty');
          return;
        }
        const res = await get(`/api/creators/${creatorId}/invoices`);
        if (mounted && Array.isArray((res as any)?.items)) {
          const items = (res as any).items.map((inv: any) => ({
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            issueDate: inv.issueDate,
            dueDate: inv.dueDate,
            status: inv.status,
            clientName: inv.clientName,
            currency: inv.currency || 'USD',
            subtotal: Number(inv.subtotal || 0),
            tax: Number(inv.tax || 0),
            total: Number(inv.total || 0),
            items: Array.isArray(inv.items) ? inv.items : [],
          }));
          if (items.length) {
            setInvoices(items);
            setDataSource('backend');
          } else {
            setInvoices(demoInvoices);
            setDataSource('demo');
          }
        }
      } catch (err: any) {
        toast.error(err?.message || 'Failed to load invoices');
        setInvoices(demoInvoices);
        setDataSource('demo');
      }
    }
    fetchInvoices();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    async function fetchCreator() {
      try {
        const me = await get('/api/auth/me');
        const creatorId = me?.user?.creator?.id;
        if (!creatorId) {
          toast.error('No creator profile found. Please log in again.');
          return;
        }
        const res = await get(`/api/creators/${creatorId}`);
        if ((res as any)?.creator) {
          const c = (res as any).creator;
          setCreatorInfo({
            name: c?.displayName || c?.name || '',
            email: c?.email || '',
            address: c?.address || '',
            taxId: c?.taxId || '',
            currency: c?.defaultCurrency || 'USD',
            paymentTerms: c?.defaultPaymentTerms || 'NET-30',
          });
        }
      } catch (err: any) {
        // silent fail to avoid double-toast on initial load
      }
    }
    fetchCreator();
  }, []);

  const addInvoiceItem = () => {
    setInvoiceItems([...invoiceItems, { description: '', quantity: 1, price: 0, taxPercent: 18 }]);
  };

  const removeInvoiceItem = (index: number) => {
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return invoiceItems.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.price || 0)), 0);
  };

  const calculateTax = (item: any) => {
    return (Number(item.quantity || 0) * Number(item.price || 0) * Number(item.taxPercent || 0)) / 100;
  };

  const calculateTotalTax = () => {
    return invoiceItems.reduce((sum, item) => sum + calculateTax(item), 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTotalTax();
  };

  const saveInvoice = async () => {
    try {
      if (!invoiceNumber || !invoiceDate) {
        toast.error('Invoice number and issue date are required');
        return;
      }
      if (!Array.isArray(invoiceItems) || invoiceItems.length === 0) {
        toast.error('Add at least one invoice item');
        return;
      }
      const me = await get('/api/auth/me');
      const creatorId = me?.user?.creator?.id;
      if (!creatorId) {
        toast.error('No creator profile found. Please log in again.');
        setDataSource('empty');
        return;
      }
      const subtotal = calculateSubtotal();
      const tax = calculateTotalTax();
      const total = calculateTotal();
      const payload = {
        invoiceNumber,
        issueDate: invoiceDate,
        dueDate: dueDate || null,
        status: 'sent',
        clientName,
        currency,
        paymentTerms,
        items: invoiceItems.map((it: any) => ({
          description: it.description,
          quantity: Number(it.quantity || 1),
          unitPrice: Number(it.price || 0),
          total: Number(it.quantity || 1) * Number(it.price || 0),
        })),
        subtotal,
        tax,
        total,
      };
      const res = await (await import('../../system/api')).post(`/api/creators/${creatorId}/invoices`, payload);
      const inv = (res as any)?.invoice || res;
      const mapped = {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        status: inv.status,
        clientName: inv.clientName,
        currency: inv.currency || 'USD',
        subtotal: Number(inv.subtotal || subtotal),
        tax: Number(inv.tax || tax),
        total: Number(inv.total || total),
        items: Array.isArray(inv.items) ? inv.items : payload.items,
      };
      setInvoices((prev: any[]) => [mapped, ...prev]);
      setIsGenerateDialogOpen(false);
      toast.success('Invoice created');
    } catch (err: any) {
      if (String(err?.message || '').includes('400')) {
        toast.error('Please fill required fields and ensure invoice number is unique');
      } else {
        toast.error(err?.message || 'Failed to save invoice');
      }
    }
  };

  const getStatusBadge = (status: Invoice['status']) => {

    const s = String(status || '').toLowerCase();
    const styles: Record<string, string> = {
      paid: 'bg-green-100 text-green-700 border-green-200',
      sent: 'bg-blue-100 text-blue-700 border-blue-200',
      overdue: 'bg-red-100 text-red-700 border-red-200',
      draft: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return styles[s] || 'bg-gray-100 text-gray-700 border-gray-200';
  };


  const totalInvoiced = invoices.reduce((sum, i: any) => sum + Number(i.total || 0), 0);
  const pendingTotal = invoices
    .filter((i: any) => ['SENT', 'OVERDUE'].includes(String(i.status)))
    .reduce((sum, i: any) => sum + Number(i.total || 0), 0);
  const thisMonthTotal = invoices
    .filter((i: any) => {
      const d = new Date(i.issueDate || i.date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, i: any) => sum + Number(i.total || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900">Finance Hub</h2>
          <p className="text-sm text-gray-600 mt-1">Manage invoices and track payments</p>
        </div>
        <div className="flex gap-3 items-center">
          <Badge variant="outline">{dataSource === 'backend' ? 'Live Data' : dataSource === 'demo' ? 'Demo Data' : 'No Data'}</Badge>
          {/* Generate Invoice */}
          <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="default" className="gap-2">
                <Plus className="w-4 h-4" /> Generate Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Invoice</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Invoice Number</Label>
                  <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="INV-2025-001" />
                </div>
                <div>
                  <Label>Issue Date</Label>
                  <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
                <div>
                  <Label>Currency</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="INR">INR</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2"><Separator /></div>
                <div>
                  <Label>Client Name</Label>
                  <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
                </div>
                <div>
                  <Label>Client Email</Label>
                  <Input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
                </div>
                <div>
                  <Label>Company</Label>
                  <Input value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} />
                </div>
                <div>
                  <Label>Tax ID</Label>
                  <Input value={clientTaxId} onChange={(e) => setClientTaxId(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label>Address</Label>
                  <Input value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} />
                </div>
                <div>
                  <Label>City</Label>
                  <Input value={clientCity} onChange={(e) => setClientCity(e.target.value)} />
                </div>
                <div>
                  <Label>State</Label>
                  <Input value={clientState} onChange={(e) => setClientState(e.target.value)} />
                </div>
                <div>
                  <Label>Zip</Label>
                  <Input value={clientZip} onChange={(e) => setClientZip(e.target.value)} />
                </div>
                <div>
                  <Label>Country</Label>
                  <Input value={clientCountry} onChange={(e) => setClientCountry(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <Label>Payment Terms</Label>
                  <Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="Net 15, Net 30, Due on Receipt" />
                </div>
                <div className="col-span-2">
                  <Label>Notes</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
                </div>
                <div className="col-span-2"><Separator /></div>
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label>Items</Label>
                    <Button variant="outline" size="sm" onClick={addInvoiceItem}>Add Item</Button>
                  </div>
                  <div className="space-y-2">
                    {invoiceItems.map((it, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2">
                        <Input className="col-span-6" placeholder="Description" value={it.description} onChange={(e) => {
                          const arr = [...invoiceItems];
                          arr[idx].description = e.target.value;
                          setInvoiceItems(arr);
                        }} />
                        <Input className="col-span-2" type="number" placeholder="Qty" value={it.quantity} onChange={(e) => {
                          const arr = [...invoiceItems];
                          arr[idx].quantity = Number(e.target.value);
                          setInvoiceItems(arr);
                        }} />
                        <Input className="col-span-2" type="number" placeholder="Price" value={it.price} onChange={(e) => {
                          const arr = [...invoiceItems];
                          arr[idx].price = Number(e.target.value);
                          setInvoiceItems(arr);
                        }} />
                        <Button className="col-span-2" variant="destructive" onClick={() => removeInvoiceItem(idx)}>Remove</Button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="col-span-2 flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>Cancel</Button>
                  <Button onClick={saveInvoice}>Save</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice No.</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead>Tax</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice: Invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono text-sm">{(invoice as any).invoiceNumber}</TableCell>
                  <TableCell>{(invoice as any).clientName || '—'}</TableCell>
                  <TableCell>${Number((invoice as any).subtotal || 0).toFixed(2)}</TableCell>
                  <TableCell>${Number((invoice as any).tax || 0).toFixed(2)}</TableCell>
                  <TableCell>${Number((invoice as any).total || 0).toFixed(2)}</TableCell>
                  <TableCell>{String((invoice as any).issueDate || '')}</TableCell>
                  <TableCell>
                    <Badge className={getStatusBadge(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-2"
                      onClick={async () => {
                        const { jsPDF } = await import('jspdf');
                        const doc = new jsPDF();

                        // Header
                        doc.setFontSize(18);
                        doc.text('Invoice', 14, 18);
                        doc.setFontSize(10);

                        doc.text(`Invoice No: ${(invoice as any).invoiceNumber || ''}`, 14, 26);
                        doc.text(`Issue Date: ${(invoice as any).issueDate || ''}`, 14, 31);

                        // Seller (Creator) info

                        const sellerName = creatorInfo?.name || 'Creator';
                        const sellerLoc = creatorInfo?.address || '';
                        const sellerEmail = creatorInfo?.email || '';
                        doc.text(`From: ${sellerName}`, 140, 18);
                        doc.text(`Email: ${sellerEmail}`, 140, 23);
                        doc.text(`Location: ${sellerLoc}`, 140, 28);

                        // Client info
                        doc.text(`Bill To: ${(invoice as any).clientName || ''}`, 14, 40);

                        // Items table header
                        let y = 55;
                        doc.setFontSize(11);
                        doc.text('Description', 14, y);
                        doc.text('Qty', 120, y);
                        doc.text('Price', 140, y);
                        doc.text('Amount', 170, y);
                        doc.setDrawColor(200);
                        doc.line(14, y + 2, 196, y + 2);

                        // Items
                        const raw = (invoice as any).raw || {};
                        const items = Array.isArray((invoice as any).items) && (invoice as any).items.length
                          ? (invoice as any).items
                          : Array.isArray(raw.items) && raw.items.length
                            ? raw.items
                            : [{ description: 'Service', quantity: 1, unitPrice: Number((invoice as any).total || 0) }];
                        let subtotal = 0;
                        items.forEach((it: any, idx: number) => {
                          y += 8;
                          const qty = Number(it.quantity || 1);
                          const price = Number(it.unitPrice ?? it.price ?? it.rate ?? 0);
                          const lineTotal = qty * price;
                          subtotal += lineTotal;
                          doc.setFontSize(10);
                          doc.text(String(it.description || 'Item'), 14, y);
                          doc.text(String(qty), 120, y, { align: 'right' });
                          doc.text(`${price.toFixed(2)}`, 140, y, { align: 'right' });
                          doc.text(`${lineTotal.toFixed(2)}`, 170, y, { align: 'right' });
                        });

                        // Totals
                        const tax = Number((invoice as any).tax ?? raw.tax ?? 0);
                        const total = Number((invoice as any).total ?? raw.total ?? subtotal + tax);

                        y += 12;
                        doc.setFontSize(11);
                        doc.text('Subtotal:', 140, y);
                        doc.text(`${subtotal.toFixed(2)}`, 170, y, { align: 'right' });
                        y += 8;
                        doc.text('Tax:', 140, y);
                        doc.text(`${tax.toFixed(2)}`, 170, y, { align: 'right' });
                        y += 8;
                        doc.setFontSize(12);
                        doc.text('Total:', 140, y);
                        doc.text(`${total.toFixed(2)}`, 170, y, { align: 'right' });

                        y += 12;
                        doc.setFontSize(9);
                        doc.text('Notes: Thank you for your business. Payment due upon receipt.', 14, y);

                        doc.save(`${(invoice as any).invoiceNumber || 'invoice'}.pdf`);
                      }}
                    >
                      <Download className="w-3 h-3" />
                      PDF
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={async () => {
                        try {
                          const me = await get('/api/auth/me');
                          const creatorId = me?.user?.creator?.id;
                          if (!creatorId) return;
                          await del(`/api/creators/${creatorId}/invoices/${invoice.id}`);
                          setInvoices((prev: any[]) => prev.filter((i) => i.id !== invoice.id));
                          toast.success('Invoice deleted');
                        } catch (err: any) {
                          toast.error('Failed to delete invoice');
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Invoiced</p>
                <p className="text-gray-900">${totalInvoiced.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-gray-900">${pendingTotal.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-gray-900">${thisMonthTotal.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const demoInvoices = [
  {
    id: 'demo-1',
    invoiceNumber: 'INV-2025-001',
    issueDate: '2025-10-15',
    dueDate: '2025-10-30',
    status: 'sent',
    clientName: 'StyleCo',
    currency: 'USD',
    items: [
      { description: 'Instagram Reel', quantity: 1, unitPrice: 1200, total: 1200 }
    ],
    subtotal: 1200,
    tax: 0,
    total: 1200,
  }
];
