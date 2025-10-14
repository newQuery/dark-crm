import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { ArrowLeft, Mail, Phone, Building } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { motion } from 'framer-motion';

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClient();
    fetchClientProjects();
  }, [id]);

  const fetchClient = async () => {
    try {
      const response = await api.get(`/clients/${id}`);
      setClient(response.data);
    } catch (error) {
      toast.error('Failed to fetch client');
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientProjects = async () => {
    try {
      const response = await api.get('/projects');
      const clientProjects = response.data.filter(p => p.client_id === id);
      setProjects(clientProjects);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-[color:var(--fg-secondary)]">Loading...</div>
      </div>
    );
  }

  if (!client) return null;

  return (
    <div className="p-8 space-y-8" data-testid="client-detail-page">
      <div>
        <Link to="/clients" className="inline-flex items-center gap-2 text-[color:var(--fg-secondary)] hover:text-[color:var(--fg-primary)] mb-4">
          <ArrowLeft size={16} />
          Back to Clients
        </Link>
        <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>{client.name}</h1>
        <p className="text-[color:var(--fg-secondary)] mt-2">Client Details & Projects</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
          <Card className="p-6 bg-[color:var(--bg-elevated)] border-[color:var(--border-default)] shadow-[var(--shadow-soft)]">
            <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Space Grotesk' }}>Contact Information</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail size={18} className="text-[color:var(--primary)] mt-0.5" />
                <div>
                  <Label className="text-[color:var(--fg-secondary)] text-sm">Email</Label>
                  <p className="text-[color:var(--fg-primary)]">{client.email}</p>
                </div>
              </div>
              {client.phone && (
                <div className="flex items-start gap-3">
                  <Phone size={18} className="text-[color:var(--primary)] mt-0.5" />
                  <div>
                    <Label className="text-[color:var(--fg-secondary)] text-sm">Phone</Label>
                    <p className="text-[color:var(--fg-primary)]">{client.phone}</p>
                  </div>
                </div>
              )}
              {client.company && (
                <div className="flex items-start gap-3">
                  <Building size={18} className="text-[color:var(--primary)] mt-0.5" />
                  <div>
                    <Label className="text-[color:var(--fg-secondary)] text-sm">Company</Label>
                    <p className="text-[color:var(--fg-primary)]">{client.company}</p>
                  </div>
                </div>
              )}
              <div className="pt-4 border-t border-[color:var(--border-default)]">
                <Label className="text-[color:var(--fg-secondary)] text-sm">Client Since</Label>
                <p className="text-[color:var(--fg-primary)]">{new Date(client.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, delay: 0.1 }}>
          <Card className="p-6 bg-[color:var(--bg-elevated)] border-[color:var(--border-default)] shadow-[var(--shadow-soft)]">
            <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Space Grotesk' }}>Associated Projects</h2>
            <div className="space-y-3">
              {projects.length > 0 ? (
                projects.map((project) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="block p-4 rounded-lg bg-[color:var(--bg-muted)] border border-[color:var(--border-default)] hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[color:var(--fg-primary)] font-medium">{project.title}</p>
                        <p className="text-sm text-[color:var(--fg-tertiary)] mt-1">
                          {project.status} • ${project.total_value.toLocaleString()}
                        </p>
                      </div>
                      <ArrowLeft size={16} className="text-[color:var(--fg-tertiary)] rotate-180" />
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-12 text-[color:var(--fg-secondary)]">
                  <p>No projects yet</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
