import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { ArrowLeft, Download, FileText, Link as LinkIcon, Copy } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { motion } from 'framer-motion';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const response = await api.get(`/invoices/${id}`);
      setInvoice(response.data);
    } catch (error) {
      toast.error('Failed to fetch invoice');
      navigate('/invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/invoices/${id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to download PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${invoice.number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to download PDF');
    } finally {
      setDownloading(false);
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

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-[color:var(--fg-secondary)]">Loading...</div>
      </div>
    );
  }

  if (!invoice) return null;

  return (
    <div className="p-8 space-y-8" data-testid="invoice-detail-page">
      <div>
        <Link to="/invoices" className="inline-flex items-center gap-2 text-[color:var(--fg-secondary)] hover:text-[color:var(--fg-primary)] mb-4">
          <ArrowLeft size={16} />
          Back to Invoices
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>Invoice {invoice.number}</h1>
            <p className="text-[color:var(--fg-secondary)] mt-2">Invoice Details</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
            <Button
              onClick={handleDownloadPDF}
              disabled={downloading}
              data-testid="download-pdf-button"
              className="bg-emerald-500 text-black hover:bg-emerald-400 font-medium gap-2"
            >
              <Download size={16} />
              {downloading ? 'Downloading...' : 'Download PDF'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
          <Card className="p-6 bg-[color:var(--bg-elevated)] border-[color:var(--border-default)] shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={20} className="text-[color:var(--primary)]" />
              <h2 className="text-lg font-semibold" style={{ fontFamily: 'Space Grotesk' }}>Invoice Information</h2>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-[color:var(--fg-secondary)] text-sm">Invoice Number</Label>
                <p className="text-[color:var(--fg-primary)] font-medium text-xl">{invoice.number}</p>
              </div>
              <div>
                <Label className="text-[color:var(--fg-secondary)] text-sm">Amount</Label>
                <p className="text-[color:var(--fg-primary)] font-bold text-3xl" style={{ fontFamily: 'Space Grotesk' }}>
                  €{(invoice.total || invoice.amount || 0).toLocaleString()}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[color:var(--fg-secondary)] text-sm">Issued Date</Label>
                  <p className="text-[color:var(--fg-primary)]">{new Date(invoice.issued_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-[color:var(--fg-secondary)] text-sm">Due Date</Label>
                  <p className="text-[color:var(--fg-primary)]">{new Date(invoice.due_date).toLocaleDateString()}</p>
                </div>
              </div>
              {invoice.paid_at && (
                <div>
                  <Label className="text-[color:var(--fg-secondary)] text-sm">Paid On</Label>
                  <p className="text-[color:var(--success)] font-medium">{new Date(invoice.paid_at).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, delay: 0.1 }}>
          <Card className="p-6 bg-[color:var(--bg-elevated)] border-[color:var(--border-default)] shadow-[var(--shadow-soft)]">
            <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Space Grotesk' }}>Client & Project Details</h2>
            <div className="space-y-4">
              <div>
                <Label className="text-[color:var(--fg-secondary)] text-sm">Client</Label>
                <Link to={`/clients/${invoice.client_id}`} className="text-[color:var(--fg-primary)] font-medium hover:text-[color:var(--primary)] transition-colors">
                  {invoice.client_name || 'N/A'}
                </Link>
              </div>
              {invoice.project_id && (
                <div>
                  <Label className="text-[color:var(--fg-secondary)] text-sm">Project</Label>
                  <Link to={`/projects/${invoice.project_id}`} className="text-[color:var(--fg-primary)] font-medium hover:text-[color:var(--primary)] transition-colors">
                    {invoice.project_title || 'N/A'}
                  </Link>
                </div>
              )}
              {invoice.stripe_payment_intent_id && (
                <div>
                  <Label className="text-[color:var(--fg-secondary)] text-sm">Stripe Payment Intent</Label>
                  <p className="text-xs font-mono text-[color:var(--fg-tertiary)] break-all">{invoice.stripe_payment_intent_id}</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Line Items Section */}
      {invoice.line_items && invoice.line_items.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, delay: 0.2 }}>
          <Card className="p-6 bg-[color:var(--bg-elevated)] border-[color:var(--border-default)] shadow-[var(--shadow-soft)]">
            <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Space Grotesk' }}>Line Items</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[color:var(--border-default)]">
                    <th className="text-left py-3 px-2 text-sm font-semibold text-[color:var(--fg-secondary)]">Description</th>
                    <th className="text-right py-3 px-2 text-sm font-semibold text-[color:var(--fg-secondary)]">Unit Price</th>
                    <th className="text-right py-3 px-2 text-sm font-semibold text-[color:var(--fg-secondary)]">Quantity</th>
                    <th className="text-right py-3 px-2 text-sm font-semibold text-[color:var(--fg-secondary)]">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.line_items.map((item, index) => (
                    <tr key={index} className="border-b border-[color:var(--border-default)]/50">
                      <td className="py-3 px-2 text-[color:var(--fg-primary)]">{item.description}</td>
                      <td className="py-3 px-2 text-right text-[color:var(--fg-secondary)]">€{item.unit_price.toFixed(2)}</td>
                      <td className="py-3 px-2 text-right text-[color:var(--fg-secondary)]">{item.quantity}</td>
                      <td className="py-3 px-2 text-right font-medium text-[color:var(--fg-primary)]">€{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 space-y-2 border-t border-[color:var(--border-default)] pt-4">
              <div className="flex justify-between items-center">
                <span className="text-[color:var(--fg-secondary)]">Subtotal</span>
                <span className="text-[color:var(--fg-primary)] font-medium">€{(invoice.subtotal || 0).toFixed(2)}</span>
              </div>
              
              {invoice.tva_rate > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-[color:var(--fg-secondary)]">TVA ({invoice.tva_rate}%)</span>
                  <span className="text-[color:var(--fg-primary)] font-medium">€{(invoice.tva_amount || 0).toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center pt-2 border-t border-[color:var(--primary)]">
                <span className="text-lg font-bold text-[color:var(--fg-primary)]">Total</span>
                <span className="text-2xl font-bold text-[color:var(--primary)]">€{(invoice.total || 0).toFixed(2)}</span>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
