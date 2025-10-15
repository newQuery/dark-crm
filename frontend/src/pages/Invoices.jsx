import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, Eye, Trash2, FileText } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Pagination } from '../components/Pagination';
import { EmptyState } from '../components/ui/empty-state';
import { toast } from 'sonner';
import api from '../lib/api';

export default function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchInvoices();
  }, [currentPage]);

  const fetchInvoices = async () => {
    try {
      const response = await api.get(`/invoices?page=${currentPage}&page_size=10`);
      setInvoices(response.data.items);
      setTotalPages(response.data.meta.total_pages);
      setTotalItems(response.data.meta.total);
    } catch (error) {
      toast.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/invoices/${selectedInvoice.id}`);
      toast.success('Invoice deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedInvoice(null);
      fetchInvoices();
    } catch (error) {
      toast.error('Failed to delete invoice');
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
              <TableCell className="text-[color:var(--fg-primary)]">€{(invoice.total || invoice.amount || 0).toLocaleString()}</TableCell>
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
                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                    data-testid={`view-invoice-${invoice.id}`}
                    className="hover:bg-white/10"
                  >
                    <Eye size={16} />
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
        <Button 
          onClick={() => navigate('/invoices/create')}
          data-testid="new-invoice-button" 
          className="bg-emerald-500 text-black hover:bg-emerald-400 font-medium gap-2 shadow-lg shadow-emerald-500/20"
        >
          <Plus size={16} /> New Invoice
        </Button>
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
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
          />
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[color:var(--bg-elevated)] border-[color:var(--border-default)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[color:var(--fg-primary)]">Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription className="text-[color:var(--fg-secondary)]">
              Are you sure you want to delete invoice &quot;{selectedInvoice?.number}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-[color:var(--border-default)] hover:bg-white/5">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              data-testid="confirm-delete-invoice"
              className="bg-[color:var(--error)] hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
