import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { motion } from 'framer-motion';

export default function CreateInvoice() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({
    client_id: '',
    project_id: '',
    tva_rate: 20,
    due_date: ''
  });
  const [lineItems, setLineItems] = useState([
    { description: '', unit_price: '', quantity: 1 }
  ]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchClients();
    fetchProjects();
    // Set default due date to 30 days from now
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 30);
    setFormData(prev => ({ ...prev, due_date: defaultDueDate.toISOString().split('T')[0] }));
  }, []);

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data);
    } catch (error) {
      toast.error('Failed to fetch clients');
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error) {
      toast.error('Failed to fetch projects');
    }
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', unit_price: '', quantity: 1 }]);
  };

  const removeLineItem = (index) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const updateLineItem = (index, field, value) => {
    const updated = [...lineItems];
    updated[index][field] = value;
    setLineItems(updated);
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => {
      const price = parseFloat(item.unit_price) || 0;
      const qty = parseFloat(item.quantity) || 0;
      return sum + (price * qty);
    }, 0);
  };

  const calculateTVA = () => {
    const subtotal = calculateSubtotal();
    return subtotal * (formData.tva_rate / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTVA();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate line items
    const validLineItems = lineItems.filter(item => 
      item.description && item.unit_price && item.quantity
    );
    
    if (validLineItems.length === 0) {
      toast.error('Please add at least one line item');
      return;
    }

    setSubmitting(true);
    
    try {
      const invoiceData = {
        client_id: formData.client_id,
        project_id: formData.project_id || null,
        line_items: validLineItems.map(item => ({
          description: item.description,
          unit_price: parseFloat(item.unit_price),
          quantity: parseFloat(item.quantity)
        })),
        tva_rate: parseFloat(formData.tva_rate),
        currency: 'eur',
        due_date: new Date(formData.due_date).toISOString()
      };

      await api.post('/invoices', invoiceData);
      toast.success('Invoice created successfully');
      navigate('/invoices');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-8" data-testid="create-invoice-page">
      <div>
        <Link to="/invoices" className="inline-flex items-center gap-2 text-[color:var(--fg-secondary)] hover:text-[color:var(--fg-primary)] mb-4">
          <ArrowLeft size={16} />
          Back to Invoices
        </Link>
        <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>Create Invoice</h1>
        <p className="text-[color:var(--fg-secondary)] mt-2">Add line items and calculate totals</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Invoice Details */}
          <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6 bg-[color:var(--bg-elevated)] border-[color:var(--border-default)] shadow-[var(--shadow-soft)]">
              <h2 className="text-lg font-semibold mb-6" style={{ fontFamily: 'Space Grotesk' }}>Invoice Details</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="client">Client *</Label>
                  <Select 
                    value={formData.client_id} 
                    onValueChange={(value) => setFormData({ ...formData, client_id: value })}
                    required
                  >
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
                  <Label htmlFor="project">Project (Optional)</Label>
                  <Select 
                    value={formData.project_id} 
                    onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                  >
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
                  <Label htmlFor="due_date">Due Date *</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                    className="bg-[color:var(--bg-muted)] border-[color:var(--border-default)]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tva_rate">TVA Rate</Label>
                  <Select 
                    value={formData.tva_rate.toString()} 
                    onValueChange={(value) => setFormData({ ...formData, tva_rate: parseFloat(value) })}
                  >
                    <SelectTrigger className="bg-[color:var(--bg-muted)] border-[color:var(--border-default)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[color:var(--bg-elevated)] border-[color:var(--border-default)]">
                      <SelectItem value="0">No TVA (0%)</SelectItem>
                      <SelectItem value="2.1">Super-reduced (2.1%)</SelectItem>
                      <SelectItem value="5.5">Reduced (5.5%)</SelectItem>
                      <SelectItem value="10">Intermediate (10%)</SelectItem>
                      <SelectItem value="20">Standard (20%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t border-[color:var(--border-default)] pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-semibold" style={{ fontFamily: 'Space Grotesk' }}>Line Items</h3>
                  <Button
                    type="button"
                    onClick={addLineItem}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Plus size={16} /> Add Item
                  </Button>
                </div>

                <div className="space-y-3">
                  {lineItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-end p-3 rounded-lg bg-[color:var(--bg-muted)] border border-[color:var(--border-default)]">
                      <div className="col-span-5">
                        <Label className="text-xs">Description</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                          placeholder="e.g., Web Development"
                          required
                          className="bg-[color:var(--bg-base)] border-[color:var(--border-default)] mt-1"
                        />
                      </div>
                      <div className="col-span-3">
                        <Label className="text-xs">Unit Price (€)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => updateLineItem(index, 'unit_price', e.target.value)}
                          placeholder="0.00"
                          required
                          className="bg-[color:var(--bg-base)] border-[color:var(--border-default)] mt-1"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                          placeholder="1"
                          required
                          className="bg-[color:var(--bg-base)] border-[color:var(--border-default)] mt-1"
                        />
                      </div>
                      <div className="col-span-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-[color:var(--fg-primary)]">
                          €{((parseFloat(item.unit_price) || 0) * (parseFloat(item.quantity) || 0)).toFixed(2)}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLineItem(index)}
                          disabled={lineItems.length === 1}
                          className="hover:bg-red-500/10 text-[color:var(--error)]"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Right column - Summary */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="p-6 bg-[color:var(--bg-elevated)] border-[color:var(--border-default)] shadow-[var(--shadow-soft)] sticky top-8">
              <h2 className="text-lg font-semibold mb-6" style={{ fontFamily: 'Space Grotesk' }}>Summary</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-[color:var(--border-default)]">
                  <span className="text-[color:var(--fg-secondary)]">Subtotal</span>
                  <span className="text-[color:var(--fg-primary)] font-medium">€{calculateSubtotal().toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center py-2 border-b border-[color:var(--border-default)]">
                  <span className="text-[color:var(--fg-secondary)]">TVA ({formData.tva_rate}%)</span>
                  <span className="text-[color:var(--fg-primary)] font-medium">€{calculateTVA().toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-t-2 border-[color:var(--primary)]">
                  <span className="text-lg font-bold text-[color:var(--fg-primary)]">Total</span>
                  <span className="text-2xl font-bold text-[color:var(--primary)]">€{calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-emerald-500 text-black hover:bg-emerald-400 font-medium"
                >
                  {submitting ? 'Creating...' : 'Create Invoice'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/invoices')}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </form>
    </div>
  );
}
