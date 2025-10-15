import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { ArrowLeft, Mail, Shield, Key, Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/api';
import { motion } from 'framer-motion';

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingPassword, setGeneratingPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState(null);

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      const response = await api.get(`/users/${id}`);
      setUser(response.data);
    } catch (error) {
      toast.error('Failed to fetch user');
      navigate('/users');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePassword = async () => {
    setGeneratingPassword(true);
    try {
      const response = await api.post(`/users/${id}/generate-password`);
      setGeneratedPassword(response.data.password);
      toast.success('New password generated successfully');
    } catch (error) {
      toast.error('Failed to generate password');
    } finally {
      setGeneratingPassword(false);
    }
  };

  const handleCopyPassword = () => {
    if (generatedPassword) {
      navigator.clipboard.writeText(generatedPassword);
      toast.success('Password copied to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-[color:var(--fg-secondary)]">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="p-8 space-y-8" data-testid="user-detail-page">
      <div>
        <Link to="/users" className="inline-flex items-center gap-2 text-[color:var(--fg-secondary)] hover:text-[color:var(--fg-primary)] mb-4">
          <ArrowLeft size={16} />
          Back to Users
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>{user.name}</h1>
            <p className="text-[color:var(--fg-secondary)] mt-2">User Details & Password Management</p>
          </div>
          <Button
            onClick={() => navigate(`/users/${id}/edit`)}
            variant="outline"
            className="gap-2"
            data-testid="edit-user-button"
          >
            Edit User
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}>
          <Card className="p-6 bg-[color:var(--bg-elevated)] border-[color:var(--border-default)] shadow-[var(--shadow-soft)]">
            <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'Space Grotesk' }}>User Information</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail size={18} className="text-[color:var(--primary)] mt-0.5" />
                <div>
                  <Label className="text-[color:var(--fg-secondary)] text-sm">Email</Label>
                  <p className="text-[color:var(--fg-primary)]">{user.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield size={18} className="text-[color:var(--primary)] mt-0.5" />
                <div>
                  <Label className="text-[color:var(--fg-secondary)] text-sm">Role</Label>
                  <Badge className="bg-[color:var(--info)]/10 text-[color:var(--info)] border-[color:var(--info)]/20 mt-1">
                    {user.role}
                  </Badge>
                </div>
              </div>
              <div className="pt-4 border-t border-[color:var(--border-default)]">
                <Label className="text-[color:var(--fg-secondary)] text-sm">Member Since</Label>
                <p className="text-[color:var(--fg-primary)]">{new Date(user.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div className="lg:col-span-2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, delay: 0.1 }}>
          <Card className="p-6 bg-[color:var(--bg-elevated)] border-[color:var(--border-default)] shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-2 mb-4">
              <Key size={20} className="text-[color:var(--primary)]" />
              <h2 className="text-lg font-semibold" style={{ fontFamily: 'Space Grotesk' }}>Password Management</h2>
            </div>
            
            <p className="text-sm text-[color:var(--fg-secondary)] mb-6">
              Generate a new random password for this user. The password will be displayed once and cannot be retrieved later.
            </p>

            {generatedPassword && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 bg-[color:var(--success)]/10 border border-[color:var(--success)]/20 rounded-lg"
              >
                <Label className="text-[color:var(--success)] text-sm font-semibold mb-2 block">Generated Password</Label>
                <div className="flex items-center gap-3">
                  <code className="flex-1 px-3 py-2 bg-[color:var(--bg-base)] rounded font-mono text-sm text-[color:var(--fg-primary)] border border-[color:var(--border-default)]">
                    {generatedPassword}
                  </code>
                  <Button
                    onClick={handleCopyPassword}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    data-testid="copy-password-button"
                  >
                    <Copy size={14} />
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-[color:var(--fg-secondary)] mt-2">
                  ⚠️ Make sure to save this password. It will not be shown again.
                </p>
              </motion.div>
            )}

            <Button
              onClick={handleGeneratePassword}
              disabled={generatingPassword}
              className="bg-emerald-500 text-black hover:bg-emerald-400 font-medium gap-2"
              data-testid="generate-password-button"
            >
              <RefreshCw size={16} className={generatingPassword ? 'animate-spin' : ''} />
              {generatingPassword ? 'Generating...' : 'Generate New Password'}
            </Button>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
