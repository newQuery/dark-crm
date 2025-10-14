import { useEffect, useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from 'sonner';
import api from '../lib/api';

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [formData, setFormData] = useState({
    client_id: '',
    project_id: '',
    amount: '',
    due_date: ''
  });

  useEffect(() => {
    fetchInvoices();
    fetchClients();
    fetchProjects();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await api.get('/invoices');
      setInvoices(response.data);
    } catch (error) {
      toast.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/invoices', {
        ...formData,
        amount: parseFloat(formData.amount),
        due_date: new Date(formData.due_date).toISOString()
      });
      toast.success('Invoice created successfully');
      setDialogOpen(false);
      setFormData({ client_id: '', project_id: '', amount: '', due_date: '' });
      fetchInvoices();
    } catch (error) {
      toast.error('Failed to create invoice');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-[color:var(--success)]/10 text-[color:var(--success)] border-[color:var(--success)]/20';
      case 'pending': return 'bg-[color:var(--warning)]/10 text-[color:var(--warning)] border-[color:var(--warning)]/20';
      case 'overdue': return 'bg-[color:var(--error)]/10 text-[color:var(--error)] border-[color:var(--error)]/20';
      default: return '';
    }
  };

  const filterInvoices = (status) => {
    if (status === 'all') return invoices;
    return invoices.filter(inv => inv.status === status);
  };

  const InvoiceTable = ({ invoices }) => (
    <Table>
      <TableHeader>
        <TableRow className="border-[color:var(--border-default)] hover:bg-transparent">
          <TableHead className="text-[color:var(--fg-secondary)]">Invoice #</TableHead>
          <TableHead className="text-[color:var(--fg-secondary)]">Client</TableHead>
          <TableHead className="text-[color:var(--fg-secondary)]">Project</TableHead>
          <TableHead className="text-[color:var(--fg-secondary)]">Amount</TableHead>
          <TableHead className="text-[color:var(--fg-secondary)]">Due Date</TableHead>
          <TableHead className="text-[color:var(--fg-secondary)]">Status</TableHead>
          <TableHead className="text-[color:var(--fg-secondary)] text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-[color:var(--fg-secondary)]">Loading...</TableCell>
          </TableRow>
        ) : invoices.length > 0 ? (
          invoices.map((invoice) => (
            <TableRow key={invoice.id} className="border-[color:var(--border-default)] hover:bg-white/5" data-testid={`invoice-row-${invoice.id}`}>
              <TableCell className="font-medium text-[color:var(--fg-primary)]">{invoice.number}</TableCell>
              <TableCell className="text-[color:var(--fg-secondary)]">{invoice.client_name || 'N/A'}</TableCell>
              <TableCell className="text-[color:var(--fg-secondary)]">{invoice.project_title || 'N/A'}</TableCell>
              <TableCell className="text-[color:var(--fg-primary)]">${invoice.amount.toLocaleString()}</TableCell>
              <TableCell className="text-[color:var(--fg-secondary)]">{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(invoice.status)} data-testid={`invoice-status-${invoice.status}`}>
                  {invoice.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setSelectedInvoice(invoice); setViewDialogOpen(true); }}
                    data-testid={`view-invoice-${invoice.id}`}
                    className="hover:bg-white/10"
                  >
                    <Eye size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { 
                      setSelectedInvoice(invoice);
                      setFormData({
                        client_id: invoice.client_id,
                        project_id: invoice.project_id || '',
                        amount: invoice.amount.toString(),
                        due_date: new Date(invoice.due_date).toISOString().split('T')[0]
                      });
                      setEditDialogOpen(true);
                    }}
                    data-testid={`edit-invoice-${invoice.id}`}
                    className="hover:bg-white/10"
                  >
                    <Edit size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setSelectedInvoice(invoice); setDeleteDialogOpen(true); }}
                    data-testid={`delete-invoice-${invoice.id}`}
                    className="hover:bg-red-500/10 text-[color:var(--error)]"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-[color:var(--fg-secondary)]">No invoices found</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="p-8 space-y-8" data-testid="invoices-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>Invoices</h1>
          <p className="text-[color:var(--fg-secondary)] mt-2">Track and manage your invoices</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="new-invoice-button" className="bg-[color:var(--primary)] text-black hover:bg-emerald-400 gap-2">
              <Plus size={16} /> New Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[color:var(--bg-elevated)] border-[color:var(--border-default)] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-[color:var(--fg-primary)]">Create New Invoice</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="create-invoice-form">
              <div className="space-y-2">
                <Label htmlFor="client_id">Client</Label>
                <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })} required>
                  <SelectTrigger className="bg-[color:var(--bg-muted)] border-[color:var(--border-default)]">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent className="bg-[color:var(--bg-elevated)] border-[color:var(--border-default)]">
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="project_id">Project (Optional)</Label>
                <Select value={formData.project_id} onValueChange={(value) => setFormData({ ...formData, project_id: value })}>
                  <SelectTrigger className="bg-[color:var(--bg-muted)] border-[color:var(--border-default)]">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent className="bg-[color:var(--bg-elevated)] border-[color:var(--border-default)]">
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>{project.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  className="bg-[color:var(--bg-muted)] border-[color:var(--border-default)]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  required
                  className="bg-[color:var(--bg-muted)] border-[color:var(--border-default)]"
                />
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" data-testid="create-invoice-submit" className="bg-[color:var(--primary)] text-black hover:bg-emerald-400">Create Invoice</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-[color:var(--bg-elevated)] border-[color:var(--border-default)] shadow-[var(--shadow-soft)]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b border-[color:var(--border-default)] px-6">
            <TabsList className="bg-transparent h-12">
              <TabsTrigger value="all" data-testid="invoices-tab-all">All</TabsTrigger>
              <TabsTrigger value="paid" data-testid="invoices-tab-paid">Paid</TabsTrigger>
              <TabsTrigger value="pending" data-testid="invoices-tab-pending">Pending</TabsTrigger>
              <TabsTrigger value="overdue" data-testid="invoices-tab-overdue">Overdue</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="all" className="m-0" data-testid="invoices-table">
            <InvoiceTable invoices={filterInvoices('all')} />
          </TabsContent>
          <TabsContent value="paid" className="m-0">
            <InvoiceTable invoices={filterInvoices('paid')} />
          </TabsContent>
          <TabsContent value="pending" className="m-0">
            <InvoiceTable invoices={filterInvoices('pending')} />
          </TabsContent>
          <TabsContent value="overdue" className="m-0">
            <InvoiceTable invoices={filterInvoices('overdue')} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
