import { useEffect, useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from 'sonner';
import api from '../lib/api';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: ''
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data);
    } catch (error) {
      toast.error('Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/clients', formData);
      toast.success('Client added successfully');
      setDialogOpen(false);
      setFormData({ name: '', email: '', company: '', phone: '' });
      fetchClients();
    } catch (error) {
      toast.error('Failed to add client');
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-8 space-y-8" data-testid="clients-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>Clients</h1>
          <p className="text-[color:var(--fg-secondary)] mt-2">Manage your client relationships</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-client-button" className="bg-[color:var(--primary)] text-black hover:bg-emerald-400 gap-2">
              <Plus size={16} /> Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[color:var(--bg-elevated)] border-[color:var(--border-default)] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-[color:var(--fg-primary)]">Add New Client</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="add-client-form">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="bg-[color:var(--bg-muted)] border-[color:var(--border-default)]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="bg-[color:var(--bg-muted)] border-[color:var(--border-default)]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="bg-[color:var(--bg-muted)] border-[color:var(--border-default)]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-[color:var(--bg-muted)] border-[color:var(--border-default)]"
                />
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit" data-testid="add-client-submit" className="bg-[color:var(--primary)] text-black hover:bg-emerald-400">Add Client</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search clients by name, email, or company..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          data-testid="clients-search-input"
          className="max-w-md bg-[color:var(--bg-elevated)] border-[color:var(--border-default)]"
        />
      </div>

      <Card className="bg-[color:var(--bg-elevated)] border-[color:var(--border-default)] shadow-[var(--shadow-soft)]">
        <Table data-testid="clients-table">
          <TableHeader>
            <TableRow className="border-[color:var(--border-default)] hover:bg-transparent">
              <TableHead className="text-[color:var(--fg-secondary)]">Name</TableHead>
              <TableHead className="text-[color:var(--fg-secondary)]">Email</TableHead>
              <TableHead className="text-[color:var(--border-default)]">Company</TableHead>
              <TableHead className="text-[color:var(--fg-secondary)]">Phone</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-[color:var(--fg-secondary)]">Loading...</TableCell>
              </TableRow>
            ) : filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <TableRow key={client.id} className="border-[color:var(--border-default)] hover:bg-white/5" data-testid={`client-row-${client.id}`}>
                  <TableCell className="font-medium text-[color:var(--fg-primary)]">{client.name}</TableCell>
                  <TableCell className="text-[color:var(--fg-secondary)]">{client.email}</TableCell>
                  <TableCell className="text-[color:var(--fg-secondary)]">{client.company || 'N/A'}</TableCell>
                  <TableCell className="text-[color:var(--fg-secondary)]">{client.phone || 'N/A'}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-[color:var(--fg-secondary)]">No clients found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
