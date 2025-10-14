import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('admin@nqcrm.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(email, password);
      toast.success('Login successful');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--bg-base)] relative overflow-hidden">
      {/* Gradient overlay - less than 20% viewport */}
      <div 
        className="absolute top-0 right-0 w-[400px] h-[400px] opacity-15 pointer-events-none"
        style={{
          background: 'radial-gradient(60% 60% at 80% 20%, rgba(0,198,118,0.18) 0%, rgba(12,17,20,0) 60%)'
        }}
      />
      
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md p-8 bg-[color:var(--bg-elevated)] border-[color:var(--border-default)] shadow-[var(--shadow-soft)]">
          <div className="mb-8 text-center">
            <img 
              src="https://customer-assets.emergentagent.com/job_nextcrm-hub/artifacts/0kh97peq_1.png" 
              alt="nQCrm Logo" 
              className="h-10 w-auto mx-auto mb-4"
              data-testid="login-logo"
            />
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Space Grotesk' }}>Welcome Back</h1>
            <p className="text-sm text-[color:var(--fg-secondary)] mt-2">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" data-testid="login-form">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[color:var(--fg-primary)]">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@nqcrm.com"
                required
                data-testid="login-email-input"
                className="bg-[color:var(--bg-muted)] border-[color:var(--border-default)] text-[color:var(--fg-primary)]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[color:var(--fg-primary)]">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                data-testid="login-password-input"
                className="bg-[color:var(--bg-muted)] border-[color:var(--border-default)] text-[color:var(--fg-primary)]"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              data-testid="login-submit-button"
              className="w-full bg-emerald-500 text-black hover:bg-emerald-400 font-medium shadow-lg shadow-emerald-500/20"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-[color:var(--fg-tertiary)]">
            <p>Default credentials:</p>
            <p className="font-mono text-xs mt-1">admin@nqcrm.com / admin123</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
