import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { FileText, CreditCard, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function PayInvoice() {
  const { invoice_id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingLink, setGeneratingLink] = useState(false);

  useEffect(() => {
    fetchInvoice();
  }, [invoice_id]);

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`${API_URL}/api/invoices/${invoice_id}/public`);
      if (!response.ok) throw new Error('Invoice not found');
      const data = await response.json();
      setInvoice(data);
    } catch (error) {
      toast.error('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async () => {
    setGeneratingLink(true);
    try {
      // We need to generate payment link without auth - let's use the stored one or error
      if (invoice.payment_link) {
        window.location.href = invoice.payment_link;
      } else {
        toast.error('Payment link not available. Please contact the sender.');
      }
    } catch (error) {
      toast.error('Failed to initiate payment');
    } finally {
      setGeneratingLink(false);
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
      <div className="min-h-screen bg-[color:var(--bg-base)] flex items-center justify-center">
        <div className="text-[color:var(--fg-secondary)]">Loading invoice...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-[color:var(--bg-base)] flex items-center justify-center">
        <Card className="p-8 bg-[color:var(--bg-elevated)] border-[color:var(--border-default)]">
          <p className="text-[color:var(--fg-primary)]">Invoice not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--bg-base)] py-12 px-4" data-testid="pay-invoice-page">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[color:var(--fg-primary)]" style={{ fontFamily: 'Space Grotesk' }}>
            nQZdo
          </h1>
          <p className="text-[color:var(--fg-secondary)] mt-2">Invoice Payment</p>
        </div>

        {/* Invoice Status */}
        {invoice.status === 'paid' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="p-6 bg-[color:var(--success)]/10 border-[color:var(--success)]/20 text-center">
              <CheckCircle size={48} className="mx-auto text-[color:var(--success)] mb-3" />
              <h2 className="text-xl font-bold text-[color:var(--success)]">Invoice Paid</h2>
              <p className="text-[color:var(--fg-secondary)] mt-2">
                This invoice was paid on {new Date(invoice.paid_at).toLocaleDateString()}
              </p>
            </Card>
          </motion.div>
        )}

        {/* Invoice Details */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-6 bg-[color:var(--bg-elevated)] border-[color:var(--border-default)] shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <FileText size={24} className="text-[color:var(--primary)]" />
                <div>
                  <h2 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>Invoice {invoice.number}</h2>
                  <p className="text-sm text-[color:var(--fg-secondary)]">From {invoice.client_name}</p>
                </div>
              </div>
              <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b border-[color:var(--border-default)]">
              <div>
                <Label className="text-[color:var(--fg-secondary)] text-sm">Issued Date</Label>
                <p className="text-[color:var(--fg-primary)] font-medium">
                  {new Date(invoice.issued_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <Label className="text-[color:var(--fg-secondary)] text-sm">Due Date</Label>
                <p className="text-[color:var(--fg-primary)] font-medium">
                  {new Date(invoice.due_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Line Items */}
            {invoice.line_items && invoice.line_items.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Space Grotesk' }}>Items</h3>
                <div className="space-y-3">
                  {invoice.line_items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2">
                      <div className="flex-1">
                        <p className="text-[color:var(--fg-primary)] font-medium">{item.description}</p>
                        <p className="text-sm text-[color:var(--fg-secondary)]">
                          €{item.unit_price.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <p className="text-[color:var(--fg-primary)] font-medium">€{item.total.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="space-y-3 pt-4 border-t border-[color:var(--border-default)]">
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
              
              <div className="flex justify-between items-center pt-3 border-t-2 border-[color:var(--primary)]">
                <span className="text-xl font-bold text-[color:var(--fg-primary)]">Total Due</span>
                <span className="text-3xl font-bold text-[color:var(--primary)]">€{(invoice.total || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Button */}
            {invoice.status !== 'paid' && (
              <div className="mt-8">
                <Button
                  onClick={handlePayNow}
                  disabled={generatingLink || !invoice.payment_link}
                  className="w-full bg-emerald-500 text-black hover:bg-emerald-400 font-medium gap-2 text-lg py-6"
                  data-testid="pay-now-button"
                >
                  <CreditCard size={20} />
                  {generatingLink ? 'Processing...' : 'Pay Now with Stripe'}
                </Button>
                {!invoice.payment_link && (
                  <p className="text-sm text-[color:var(--fg-secondary)] text-center mt-3">
                    Payment link not yet generated. Please contact the sender.
                  </p>
                )}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-sm text-[color:var(--fg-secondary)]">
          Secure payment powered by Stripe
        </p>
      </div>
    </div>
  );
}
