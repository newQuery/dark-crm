import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { motion } from 'framer-motion';

export default function PaymentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayment();
  }, [id]);

  const fetchPayment = async () => {
    try {
      const response = await api.get('/payments');
      const foundPayment = response.data.find(p => p.id === id);
      if (!foundPayment) {
        throw new Error('Payment not found');
      }
      setPayment(foundPayment);
    } catch (error) {
      toast.error('Failed to fetch payment');
      navigate('/payments');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'succeeded': return 'bg-[color:var(--success)]/10 text-[color:var(--success)] border-[color:var(--success)]/20';
      case 'pending': return 'bg-[color:var(--warning)]/10 text-[color:var(--warning)] border-[color:var(--warning)]/20';
      case 'failed': return 'bg-[color:var(--error)]/10 text-[color:var(--error)] border-[color:var(--error)]/20';
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

  if (!payment) return null;

  return (
    <div className="p-8 space-y-8" data-testid="payment-detail-page">
      <div>
        <Link to="/payments" className="inline-flex items-center gap-2 text-[color:var(--fg-secondary)] hover:text-[color:var(--fg-primary)] mb-4">
          <ArrowLeft size={16} />
          Back to Payments
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>Payment Details</h1>
            <p className="text-[color:var(--fg-secondary)] mt-2">Transaction Information</p>
          </div>
          <Badge className={getStatusColor(payment.status)}>{payment.status}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
          <Card className="p-6 bg-[color:var(--bg-elevated)] border-[color:var(--border-default)] shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={20} className="text-[color:var(--primary)]" />
              <h2 className="text-lg font-semibold" style={{ fontFamily: 'Space Grotesk' }}>Payment Information</h2>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-[color:var(--fg-secondary)] text-sm">Amount</Label>
                <p className="text-[color:var(--fg-primary)] font-bold text-3xl" style={{ fontFamily: 'Space Grotesk' }}>
                  ${payment.amount.toLocaleString()}
                </p>
              </div>
              <div>
                <Label className="text-[color:var(--fg-secondary)] text-sm">Currency</Label>
                <p className="text-[color:var(--fg-primary)] uppercase">{payment.currency}</p>
              </div>
              <div>
                <Label className="text-[color:var(--fg-secondary)] text-sm">Transaction Date</Label>
                <p className="text-[color:var(--fg-primary)]">{new Date(payment.created_at).toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-[color:var(--fg-secondary)] text-sm">Client</Label>
                {payment.client_id ? (
                  <Link to={`/clients/${payment.client_id}`} className="text-[color:var(--fg-primary)] font-medium hover:text-[color:var(--primary)] transition-colors">
                    {payment.client_name || 'View Client'}
                  </Link>
                ) : (
                  <p className="text-[color:var(--fg-primary)]">{payment.client_name || 'N/A'}</p>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, delay: 0.1 }}>
          <Card className="p-6 bg-[color:var(--bg-elevated)] border-[color:var(--border-default)] shadow-[var(--shadow-soft)]">
            <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Space Grotesk' }}>Transaction Details</h2>
            <div className="space-y-4">
              {payment.stripe_payment_intent_id && (
                <div>
                  <Label className="text-[color:var(--fg-secondary)] text-sm">Stripe Payment Intent ID</Label>
                  <p className="text-xs font-mono text-[color:var(--fg-tertiary)] break-all bg-[color:var(--bg-muted)] p-2 rounded">
                    {payment.stripe_payment_intent_id}
                  </p>
                </div>
              )}
              {payment.stripe_charge_id && (
                <div>
                  <Label className="text-[color:var(--fg-secondary)] text-sm">Stripe Charge ID</Label>
                  <p className="text-xs font-mono text-[color:var(--fg-tertiary)] break-all bg-[color:var(--bg-muted)] p-2 rounded">
                    {payment.stripe_charge_id}
                  </p>
                </div>
              )}
              {payment.invoice_id && (
                <div>
                  <Label className="text-[color:var(--fg-secondary)] text-sm">Related Invoice</Label>
                  <p className="text-[color:var(--fg-primary)] font-mono text-sm">{payment.invoice_id}</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
