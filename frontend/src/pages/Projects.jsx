import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Pagination } from '../components/Pagination';
import { toast } from 'sonner';
import api from '../lib/api';

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [formData, setFormData] = useState({
    title: '',
    client_id: '',
    status: 'active',
    total_value: '',
    deadline: ''
  });

  useEffect(() => {
    fetchProjects();
    fetchClients();
  }, [currentPage]);

  const fetchProjects = async () => {
    try {
      const response = await api.get(`/projects?page=${currentPage}&page_size=10`);
      setProjects(response.data.items);
      setTotalPages(response.data.meta.total_pages);
      setTotalItems(response.data.meta.total);
    } catch (error) {
      toast.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients?page=1&page_size=1000');
      setClients(response.data.items || response.data);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects', {
        ...formData,
        total_value: parseFloat(formData.total_value) || 0,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null
      });
      toast.success('Project created successfully');
      setCreateDialogOpen(false);
      setFormData({ title: '', client_id: '', status: 'active', total_value: '', deadline: '' });
      fetchProjects();
    } catch (error) {
      toast.error('Failed to create project');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/projects/${selectedProject.id}`, {
        title: formData.title,
        client_id: formData.client_id,
        status: formData.status,
        total_value: parseFloat(formData.total_value) || 0,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null
      });
      toast.success('Project updated successfully');
      setEditDialogOpen(false);
      setSelectedProject(null);
      fetchProjects();
    } catch (error) {
      toast.error('Failed to update project');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/projects/${selectedProject.id}`);
      toast.success('Project deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedProject(null);
      fetchProjects();
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  const openEditDialog = (project) => {
    setSelectedProject(project);
    setFormData({
      title: project.title,
      client_id: project.client_id,
      status: project.status,
      total_value: project.total_value.toString(),
      deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : ''
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (project) => {
    setSelectedProject(project);
    setDeleteDialogOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-[color:var(--success)]/10 text-[color:var(--success)] border-[color:var(--success)]/20';
      case 'completed': return 'bg-[color:var(--info)]/10 text-[color:var(--info)] border-[color:var(--info)]/20';
      case 'on-hold': return 'bg-[color:var(--warning)]/10 text-[color:var(--warning)] border-[color:var(--warning)]/20';
      default: return '';
    }
  };

  return (
    <div className="p-8 space-y-8" data-testid="projects-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>Projects</h1>
          <p className="text-[color:var(--fg-secondary)] mt-2">Manage your projects and deliverables</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="create-project-button" className="bg-emerald-500 text-black hover:bg-emerald-400 font-medium gap-2 shadow-lg shadow-emerald-500/20">
              <Plus size={16} /> New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[color:var(--bg-elevated)] border-[color:var(--border-default)] sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-[color:var(--fg-primary)]">Create New Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4" data-testid="create-project-form">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="bg-[color:var(--bg-muted)] border-[color:var(--border-default)]"
                />
              </div>
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
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="bg-[color:var(--bg-muted)] border-[color:var(--border-default)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[color:var(--bg-elevated)] border-[color:var(--border-default)]">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_value">Total Value ($)</Label>
                <Input
                  id="total_value"
                  type="number"
                  value={formData.total_value}
                  onChange={(e) => setFormData({ ...formData, total_value: e.target.value })}
                  className="bg-[color:var(--bg-muted)] border-[color:var(--border-default)]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="bg-[color:var(--bg-muted)] border-[color:var(--border-default)]"
                />
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="ghost" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                <Button type="submit" data-testid="create-project-submit" className="bg-emerald-500 text-black hover:bg-emerald-400 font-medium">Create Project</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-[color:var(--bg-elevated)] border-[color:var(--border-default)] shadow-[var(--shadow-soft)]">
        <Table data-testid="projects-table">
          <TableHeader>
            <TableRow className="border-[color:var(--border-default)] hover:bg-transparent">
              <TableHead className="text-[color:var(--fg-secondary)]">Project</TableHead>
              <TableHead className="text-[color:var(--fg-secondary)]">Client</TableHead>
              <TableHead className="text-[color:var(--fg-secondary)]">Status</TableHead>
              <TableHead className="text-[color:var(--fg-secondary)]">Value</TableHead>
              <TableHead className="text-[color:var(--fg-secondary)]">Deadline</TableHead>
              <TableHead className="text-[color:var(--fg-secondary)] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-[color:var(--fg-secondary)]">Loading...</TableCell>
              </TableRow>
            ) : projects.length > 0 ? (
              projects.map((project) => (
                <TableRow key={project.id} className="border-[color:var(--border-default)] hover:bg-white/5" data-testid={`project-row-${project.id}`}>
                  <TableCell className="font-medium text-[color:var(--fg-primary)]">{project.title}</TableCell>
                  <TableCell className="text-[color:var(--fg-secondary)]">{project.client_name || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(project.status)} data-testid={`project-status-${project.status}`}>
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[color:var(--fg-primary)]">${project.total_value.toLocaleString()}</TableCell>
                  <TableCell className="text-[color:var(--fg-secondary)]">
                    {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/projects/${project.id}`)}
                        data-testid={`view-project-${project.id}`}
                        className="hover:bg-white/10"
                      >
                        <Eye size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(project)}
                        data-testid={`edit-project-${project.id}`}
                        className="hover:bg-white/10"
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(project)}
                        data-testid={`delete-project-${project.id}`}
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
                <TableCell colSpan={6} className="text-center text-[color:var(--fg-secondary)]">No projects found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
          />
        )}
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-[color:var(--bg-elevated)] border-[color:var(--border-default)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[color:var(--fg-primary)]">Edit Project</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4" data-testid="edit-project-form">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Project Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="bg-[color:var(--bg-muted)] border-[color:var(--border-default)]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-client">Client</Label>
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
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger className="bg-[color:var(--bg-muted)] border-[color:var(--border-default)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[color:var(--bg-elevated)] border-[color:var(--border-default)]">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-value">Total Value ($)</Label>
              <Input
                id="edit-value"
                type="number"
                value={formData.total_value}
                onChange={(e) => setFormData({ ...formData, total_value: e.target.value })}
                className="bg-[color:var(--bg-muted)] border-[color:var(--border-default)]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-deadline">Deadline</Label>
              <Input
                id="edit-deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="bg-[color:var(--bg-muted)] border-[color:var(--border-default)]"
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="ghost" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit" data-testid="edit-project-submit" className="bg-emerald-500 text-black hover:bg-emerald-400 font-medium">Update Project</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[color:var(--bg-elevated)] border-[color:var(--border-default)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[color:var(--fg-primary)]">Delete Project</AlertDialogTitle>
            <AlertDialogDescription className="text-[color:var(--fg-secondary)]">
              Are you sure you want to delete &quot;{selectedProject?.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-[color:var(--border-default)] hover:bg-white/5">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              data-testid="confirm-delete-project"
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
