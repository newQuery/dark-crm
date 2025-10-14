import { useEffect, useState } from 'react';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { DollarSign, TrendingUp, Eye } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon: Icon }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.24 }}
  >
    <Card className="p-6 bg-[color:var(--bg-elevated)] border-[color:var(--border-default)] shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-[color:var(--fg-secondary)]">{title}</p>
        <Icon size={18} className="text-[color:var(--primary)]" />
      </div>
      <p className="text-3xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>
        {value}
      </p>
    </Card>
  </motion.div>
);

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    fetchPayments();
    fetchTransactions();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await api.get('/payments');
      setPayments(response.data);
    } catch (error) {
      toast.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await api.get('/payments/transactions');
      setTransactions(response.data);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
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

  const totalPayments = payments.reduce((sum, p) => p.status === 'succeeded' ? sum + p.amount : sum, 0);
  const successfulPayments = payments.filter(p => p.status === 'succeeded').length;

  return (
    <div className="p-8 space-y-8" data-testid="payments-page">
      <div>
        <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>Payments</h1>
        <p className="text-[color:var(--fg-secondary)] mt-2">Track payment transactions and payouts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Payments"
          value={`$${totalPayments.toLocaleString()}`}
          icon={DollarSign}
        />
        <StatCard
          title="Successful Transactions"
          value={successfulPayments}
          icon={TrendingUp}
        />
        <StatCard
          title="Pending"
          value={payments.filter(p => p.status === 'pending').length}
          icon={DollarSign}
        />
      </div>

      <Card className="bg-[color:var(--bg-elevated)] border-[color:var(--border-default)] shadow-[var(--shadow-soft)]">
        <div className="p-6 border-b border-[color:var(--border-default)]">
          <h2 className="text-lg font-semibold" style={{ fontFamily: 'Space Grotesk' }}>Recent Transactions</h2>
        </div>
        <Table data-testid="payments-table">
          <TableHeader>
            <TableRow className="border-[color:var(--border-default)] hover:bg-transparent">
              <TableHead className="text-[color:var(--fg-secondary)]">Client</TableHead>
              <TableHead className="text-[color:var(--fg-secondary)]">Amount</TableHead>
              <TableHead className="text-[color:var(--fg-secondary)]">Status</TableHead>
              <TableHead className="text-[color:var(--fg-secondary)]">Date</TableHead>
              <TableHead className="text-[color:var(--fg-secondary)]">Transaction ID</TableHead>
              <TableHead className="text-[color:var(--fg-secondary)] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-[color:var(--fg-secondary)]">Loading...</TableCell>
              </TableRow>
            ) : payments.length > 0 ? (
              payments.map((payment) => (
                <TableRow key={payment.id} className="border-[color:var(--border-default)] hover:bg-white/5" data-testid={`payment-row-${payment.id}`}>
                  <TableCell className="text-[color:var(--fg-primary)]">{payment.client_name || 'N/A'}</TableCell>
                  <TableCell className="font-medium text-[color:var(--fg-primary)]">${payment.amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(payment.status)} data-testid={`payment-status-${payment.status}`}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[color:var(--fg-secondary)]">{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-xs font-mono text-[color:var(--fg-tertiary)]">{payment.stripe_payment_intent_id || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setSelectedPayment(payment); setViewDialogOpen(true); }}
                      data-testid={`view-payment-${payment.id}`}
                      className="hover:bg-white/10"
                    >
                      <Eye size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-[color:var(--fg-secondary)]">No payments found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {transactions.length > 0 && (
        <Card className="bg-[color:var(--bg-elevated)] border-[color:var(--border-default)] shadow-[var(--shadow-soft)]">
          <div className="p-6 border-b border-[color:var(--border-default)]">
            <h2 className="text-lg font-semibold" style={{ fontFamily: 'Space Grotesk' }}>Stripe Transactions</h2>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-[color:var(--border-default)] hover:bg-transparent">
                <TableHead className="text-[color:var(--fg-secondary)]">Transaction ID</TableHead>
                <TableHead className="text-[color:var(--fg-secondary)]">Invoice</TableHead>
                <TableHead className="text-[color:var(--fg-secondary)]">Amount</TableHead>
                <TableHead className="text-[color:var(--fg-secondary)]">Status</TableHead>
                <TableHead className="text-[color:var(--fg-secondary)]">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.slice(0, 10).map((txn) => (
                <TableRow key={txn.id} className="border-[color:var(--border-default)] hover:bg-white/5">
                  <TableCell className="text-xs font-mono text-[color:var(--fg-tertiary)]">{txn.id}</TableCell>
                  <TableCell className="text-[color:var(--fg-secondary)]">{txn.invoice_number || 'N/A'}</TableCell>
                  <TableCell className="font-medium text-[color:var(--fg-primary)]">${txn.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(txn.status)}>
                      {txn.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[color:var(--fg-secondary)]">{new Date(txn.created).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
