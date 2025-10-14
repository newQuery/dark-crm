import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { toast } from 'sonner';
import api from '../lib/api';

export default function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
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

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/clients', formData);
      toast.success('Client added successfully');
      setCreateDialogOpen(false);
      setFormData({ name: '', email: '', company: '', phone: '' });
      fetchClients();
    } catch (error) {
      toast.error('Failed to add client');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/clients/${selectedClient.id}`, formData);
      toast.success('Client updated successfully');
      setEditDialogOpen(false);
      setSelectedClient(null);
      fetchClients();
    } catch (error) {
      toast.error('Failed to update client');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/clients/${selectedClient.id}`);
      toast.success('Client deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedClient(null);
      fetchClients();
    } catch (error) {
      toast.error('Failed to delete client');
    }
  };

  const openEditDialog = (client) => {
    setSelectedClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      company: client.company || '',
      phone: client.phone || ''
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (client) => {
    setSelectedClient(client);
    setDeleteDialogOpen(true);
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
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-client-button" className="bg-emerald-500 text-black hover:bg-emerald-400 font-medium gap-2 shadow-lg shadow-emerald-500/20">
              <Plus size={16} /> Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[color:var(--bg-elevated)] border-[color:var(--border-default)] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-[color:var(--fg-primary)]">Add New Client</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4" data-testid="add-client-form">
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
                <Button type="button" variant="ghost" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                <Button type="submit" data-testid="add-client-submit" className="bg-emerald-500 text-black hover:bg-emerald-400 font-medium">Add Client</Button>
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
              <TableHead className="text-[color:var(--fg-secondary)]">Company</TableHead>
              <TableHead className="text-[color:var(--fg-secondary)]">Phone</TableHead>
              <TableHead className="text-[color:var(--fg-secondary)] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-[color:var(--fg-secondary)]">Loading...</TableCell>
              </TableRow>
            ) : filteredClients.length > 0 ? (
              filteredClients.map((client) => (
                <TableRow key={client.id} className="border-[color:var(--border-default)] hover:bg-white/5" data-testid={`client-row-${client.id}`}>
                  <TableCell className="font-medium text-[color:var(--fg-primary)]">{client.name}</TableCell>
                  <TableCell className="text-[color:var(--fg-secondary)]">{client.email}</TableCell>
                  <TableCell className="text-[color:var(--fg-secondary)]">{client.company || 'N/A'}</TableCell>
                  <TableCell className="text-[color:var(--fg-secondary)]">{client.phone || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openViewDialog(client)}
                        data-testid={`view-client-${client.id}`}
                        className="hover:bg-white/10"
                      >
                        <Eye size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(client)}
                        data-testid={`edit-client-${client.id}`}
                        className="hover:bg-white/10"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(client)}
                        data-testid={`delete-client-${client.id}`}
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
                <TableCell colSpan={5} className="text-center text-[color:var(--fg-secondary)]">No clients found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="bg-[color:var(--bg-elevated)] border-[color:var(--border-default)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[color:var(--fg-primary)]">Client Details</DialogTitle>
          </DialogHeader>
          {selectedClient && (
            <div className="space-y-4">
              <div>
                <Label className="text-[color:var(--fg-secondary)] text-sm">Name</Label>
                <p className="text-[color:var(--fg-primary)] font-medium">{selectedClient.name}</p>
              </div>
              <div>
                <Label className="text-[color:var(--fg-secondary)] text-sm">Email</Label>
                <p className="text-[color:var(--fg-primary)]">{selectedClient.email}</p>
              </div>
              <div>
                <Label className="text-[color:var(--fg-secondary)] text-sm">Company</Label>
                <p className="text-[color:var(--fg-primary)]">{selectedClient.company || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-[color:var(--fg-secondary)] text-sm">Phone</Label>
                <p className="text-[color:var(--fg-primary)]">{selectedClient.phone || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-[color:var(--fg-secondary)] text-sm">Created</Label>
                <p className="text-[color:var(--fg-primary)]">{new Date(selectedClient.created_at).toLocaleString()}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-[color:var(--bg-elevated)] border-[color:var(--border-default)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[color:var(--fg-primary)]">Edit Client</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4" data-testid="edit-client-form">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="bg-[color:var(--bg-muted)] border-[color:var(--border-default)]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="bg-[color:var(--bg-muted)] border-[color:var(--border-default)]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-company">Company</Label>
              <Input
                id="edit-company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="bg-[color:var(--bg-muted)] border-[color:var(--border-default)]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="bg-[color:var(--bg-muted)] border-[color:var(--border-default)]"
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="ghost" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit" data-testid="edit-client-submit" className="bg-emerald-500 text-black hover:bg-emerald-400 font-medium">Update Client</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[color:var(--bg-elevated)] border-[color:var(--border-default)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[color:var(--fg-primary)]">Delete Client</AlertDialogTitle>
            <AlertDialogDescription className="text-[color:var(--fg-secondary)]">
              Are you sure you want to delete &quot;{selectedClient?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-[color:var(--border-default)] hover:bg-white/5">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              data-testid="confirm-delete-client"
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
