import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { motion } from 'framer-motion';

export default function CreateUser() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'customer'
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await api.post('/users', formData);
      toast.success('User created successfully with random password');
      navigate('/users');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-8" data-testid="create-user-page">
      <div>
        <Link to="/users" className="inline-flex items-center gap-2 text-[color:var(--fg-secondary)] hover:text-[color:var(--fg-primary)] mb-4">
          <ArrowLeft size={16} />
          Back to Users
        </Link>
        <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>Create User</h1>
        <p className="text-[color:var(--fg-secondary)] mt-2">Add a new user to the system</p>
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
                  A random secure password will be automatically generated for this user.
                </p>
                <p>
                  You can view and copy the password from the user detail page after creation.
                </p>
              </div>

              <div className="mt-8 space-y-3">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-emerald-500 text-black hover:bg-emerald-400 font-medium"
                >
                  {submitting ? 'Creating...' : 'Create User'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/users')}
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
