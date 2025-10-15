import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { motion } from 'framer-motion';

export default function EditUser() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'customer'
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      const response = await api.get(`/users/${id}`);
      setFormData({
        name: response.data.name,
        email: response.data.email,
        role: response.data.role
      });
    } catch (error) {
      toast.error('Failed to fetch user');
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await api.patch(`/users/${id}`, formData);
      toast.success('User updated successfully');
      navigate(`/users/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-[color:var(--fg-secondary)]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8" data-testid="edit-user-page">
      <div>
        <Link to={`/users/${id}`} className="inline-flex items-center gap-2 text-[color:var(--fg-secondary)] hover:text-[color:var(--fg-primary)] mb-4">
          <ArrowLeft size={16} />
          Back to User Details
        </Link>
        <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>Edit User</h1>
        <p className="text-[color:var(--fg-secondary)] mt-2">Update user information</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-6 bg-[color:var(--bg-elevated)] border-[color:var(--border-default)] shadow-[var(--shadow-soft)]">
              <h2 className="text-lg font-semibold mb-6" style={{ fontFamily: 'Space Grotesk' }}>User Details</h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., John Doe"
                    required
                    className="bg-[color:var(--bg-muted)] border-[color:var(--border-default)]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@example.com"
                    required
                    className="bg-[color:var(--bg-muted)] border-[color:var(--border-default)]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger className="bg-[color:var(--bg-muted)] border-[color:var(--border-default)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[color:var(--bg-elevated)] border-[color:var(--border-default)]">
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="p-6 bg-[color:var(--bg-elevated)] border-[color:var(--border-default)] shadow-[var(--shadow-soft)] sticky top-8">
              <h2 className="text-lg font-semibold mb-6" style={{ fontFamily: 'Space Grotesk' }}>Information</h2>
              
              <div className="space-y-4 text-sm text-[color:var(--fg-secondary)]">
                <p>
                  Update user information including name, email, and role.
                </p>
                <p>
                  To change the password, go to the user detail page and use the "Generate New Password" button.
                </p>
              </div>

              <div className="mt-8 space-y-3">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-emerald-500 text-black hover:bg-emerald-400 font-medium"
                  data-testid="update-user-submit"
                >
                  {submitting ? 'Updating...' : 'Update User'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/users/${id}`)}
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
