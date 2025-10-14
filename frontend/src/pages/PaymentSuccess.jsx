import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CheckCircle, FileText, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const invoice_id = searchParams.get('invoice_id');
  const session_id = searchParams.get('session_id');
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (invoice_id && session_id) {
      verifyPaymentAndFetchInvoice();
    } else if (invoice_id) {
      fetchInvoice();
    }
  }, [invoice_id, session_id]);

  const verifyPaymentAndFetchInvoice = async () => {
    try {
      // First, verify the payment with Stripe
      const verifyResponse = await fetch(
        `${API_URL}/api/invoices/${invoice_id}/verify-payment?session_id=${session_id}`,
        { method: 'POST' }
      );
      
      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        if (verifyData.status === 'paid') {
          toast.success('Payment verified successfully!');
        }
      }
      
      // Then fetch the updated invoice
      const response = await fetch(`${API_URL}/api/invoices/${invoice_id}/public`);
      if (!response.ok) throw new Error('Failed to fetch invoice');
      const data = await response.json();
      setInvoice(data);
    } catch (error) {
      console.error('Failed to verify payment or fetch invoice:', error);
      toast.error('Failed to verify payment');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`${API_URL}/api/invoices/${invoice_id}/public`);
      if (!response.ok) throw new Error('Failed to fetch invoice');
      const data = await response.json();
      setInvoice(data);
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--bg-base)] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full"
      >
        <Card className="p-8 bg-[color:var(--bg-elevated)] border-[color:var(--border-default)] shadow-[var(--shadow-soft)] text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <CheckCircle size={64} className="mx-auto text-[color:var(--success)] mb-4" />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-[color:var(--fg-primary)] mb-2" style={{ fontFamily: 'Space Grotesk' }}>
            Payment Successful!
          </h1>
          
          <p className="text-[color:var(--fg-secondary)] mb-6">
            Your payment has been processed successfully.
          </p>

          {loading ? (
            <div className="text-[color:var(--fg-secondary)]">Loading invoice details...</div>
          ) : invoice ? (
            <div className="space-y-4">
              <div className="bg-[color:var(--bg-muted)] rounded-lg p-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <FileText size={20} className="text-[color:var(--primary)]" />
                  <p className="text-lg font-semibold text-[color:var(--fg-primary)]">
                    Invoice {invoice.number}
                  </p>
                </div>
                <p className="text-2xl font-bold text-[color:var(--success)]">
                  €{(invoice.total || 0).toFixed(2)}
                </p>
                <p className="text-sm text-[color:var(--fg-secondary)] mt-1">
                  {invoice.client_name}
                </p>
              </div>

              <div className="text-sm text-[color:var(--fg-secondary)]">
                <p>Transaction ID: <span className="font-mono text-xs">{session_id}</span></p>
                <p className="mt-1">A confirmation email has been sent to your email address.</p>
              </div>
            </div>
          ) : (
            <p className="text-[color:var(--fg-secondary)]">Invoice details not available</p>
          )}

          <div className="mt-8 flex gap-3 justify-center">
            <Link to={`/pay/${invoice_id}`}>
              <Button variant="outline">View Invoice</Button>
            </Link>
          </div>
        </Card>

        <p className="text-center text-sm text-[color:var(--fg-secondary)] mt-6">
          Thank you for your business!
        </p>
      </motion.div>
    </div>
  );
}
