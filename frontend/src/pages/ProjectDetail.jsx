import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { ArrowLeft, Plus, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { motion } from 'framer-motion';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [deliverables, setDeliverables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState(null);
  const [formData, setFormData] = useState({
    name: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchProject();
    fetchDeliverables();
  }, [id]);

  const fetchProject = async () => {
    try {
      const response = await api.get(`/projects/${id}`);
      setProject(response.data);
    } catch (error) {
      toast.error('Failed to fetch project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliverables = async () => {
    try {
      const response = await api.get(`/projects/${id}/deliverables`);
      setDeliverables(response.data);
    } catch (error) {
      console.error('Failed to fetch deliverables:', error);
    }
  };

  const handleAddDeliverable = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('file', selectedFile);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/projects/${id}/deliverables`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataToSend
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload file');
      }
      
      toast.success('Deliverable added successfully');
      setAddDialogOpen(false);
      setFormData({ name: '' });
      setSelectedFile(null);
      fetchDeliverables();
    } catch (error) {
      toast.error(error.message || 'Failed to add deliverable');
    }
  };

  const handleDeleteDeliverable = async () => {
    try {
      await api.delete(`/projects/${id}/deliverables/${selectedDeliverable.id}`);
      toast.success('Deliverable removed successfully');
      setDeleteDialogOpen(false);
      setSelectedDeliverable(null);
      fetchDeliverables();
    } catch (error) {
      toast.error('Failed to remove deliverable');
    }
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };
  
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-[color:var(--success)]/10 text-[color:var(--success)] border-[color:var(--success)]/20';
      case 'completed': return 'bg-[color:var(--info)]/10 text-[color:var(--info)] border-[color:var(--info)]/20';
      case 'on-hold': return 'bg-[color:var(--warning)]/10 text-[color:var(--warning)] border-[color:var(--warning)]/20';
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

  if (!project) return null;

  return (
    <div className="p-8 space-y-8" data-testid="project-detail-page">
      <div>
        <Link to="/projects" className="inline-flex items-center gap-2 text-[color:var(--fg-secondary)] hover:text-[color:var(--fg-primary)] mb-4">
          <ArrowLeft size={16} />
          Back to Projects
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>{project.title}</h1>
            <p className="text-[color:var(--fg-secondary)] mt-2">Project Details & Deliverables</p>
          </div>
          <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
          <Card className="p-6 bg-[color:var(--bg-elevated)] border-[color:var(--border-default)] shadow-[var(--shadow-soft)]">
            <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Space Grotesk' }}>Project Information</h2>
            <div className="space-y-4">
              <div>
                <Label className="text-[color:var(--fg-secondary)] text-sm">Client</Label>
                <p className="text-[color:var(--fg-primary)] font-medium">{project.client_name || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-[color:var(--fg-secondary)] text-sm">Total Value</Label>
                <p className="text-[color:var(--fg-primary)] font-medium text-2xl">${project.total_value.toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-[color:var(--fg-secondary)] text-sm">Deadline</Label>
                <p className="text-[color:var(--fg-primary)]">
                  {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline'}
                </p>
              </div>
              <div>
                <Label className="text-[color:var(--fg-secondary)] text-sm">Created</Label>
                <p className="text-[color:var(--fg-primary)]">{new Date(project.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, delay: 0.1 }}>
          <Card className="p-6 bg-[color:var(--bg-elevated)] border-[color:var(--border-default)] shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ fontFamily: 'Space Grotesk' }}>Deliverables</h2>
              <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="add-deliverable-button" className="bg-emerald-500 text-black hover:bg-emerald-400 font-medium gap-2">
                    <Plus size={16} /> Add Deliverable
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[color:var(--bg-elevated)] border-[color:var(--border-default)] sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-[color:var(--fg-primary)]">Add Deliverable</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddDeliverable} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Final Design Files"
                        required
                        className="bg-[color:var(--bg-muted)] border-[color:var(--border-default)]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="file">File</Label>
                      <Input
                        id="file"
                        type="file"
                        onChange={handleFileChange}
                        required
                        className="bg-[color:var(--bg-muted)] border-[color:var(--border-default)]"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.svg,.webp,.zip,.rar,.tar,.gz,.txt,.md"
                      />
                      {selectedFile && (
                        <p className="text-xs text-[color:var(--fg-secondary)] mt-2">
                          Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 justify-end pt-4">
                      <Button type="button" variant="ghost" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                      <Button type="submit" className="bg-emerald-500 text-black hover:bg-emerald-400 font-medium">Add</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-3">
              {deliverables.length > 0 ? (
                deliverables.map((deliverable) => (
                  <div
                    key={deliverable.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-[color:var(--bg-muted)] border border-[color:var(--border-default)] hover:bg-white/5 transition-colors"
                    data-testid={`deliverable-${deliverable.id}`}
                  >
                    <div className="flex-1">
                      <p className="text-[color:var(--fg-primary)] font-medium">{deliverable.name}</p>
                      <p className="text-xs text-[color:var(--fg-tertiary)] mt-1">
                        Added {new Date(deliverable.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(deliverable.file_url, '_blank')}
                        className="hover:bg-white/10"
                        data-testid={`download-deliverable-${deliverable.id}`}
                      >
                        <Download size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDeliverable(deliverable);
                          setDeleteDialogOpen(true);
                        }}
                        className="hover:bg-red-500/10 text-[color:var(--error)]"
                        data-testid={`delete-deliverable-${deliverable.id}`}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-[color:var(--fg-secondary)]">
                  <p>No deliverables yet</p>
                  <p className="text-sm mt-2">Add your first deliverable to get started</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[color:var(--bg-elevated)] border-[color:var(--border-default)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[color:var(--fg-primary)]">Remove Deliverable</AlertDialogTitle>
            <AlertDialogDescription className="text-[color:var(--fg-secondary)]">
              Are you sure you want to remove &quot;{selectedDeliverable?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-[color:var(--border-default)] hover:bg-white/5">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDeliverable}
              className="bg-[color:var(--error)] hover:bg-red-600 text-white"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
