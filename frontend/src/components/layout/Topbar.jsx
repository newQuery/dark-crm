import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { LogOut } from 'lucide-react';

export const Topbar = () => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 backdrop-blur supports-[backdrop-filter]:bg-black/30 border-b border-[color:var(--border-default)]">
      <div className="flex items-center justify-between px-8 py-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
            Welcome, {user?.name || 'User'}
          </h1>
          <p className="text-sm text-[color:var(--fg-secondary)]">{user?.email}</p>
        </div>
        
        <Button 
          variant="ghost" 
          onClick={logout}
          data-testid="logout-button"
          className="gap-2 text-[color:var(--fg-secondary)] hover:text-[color:var(--fg-primary)] hover:bg-white/5"
        >
          <LogOut size={16} />
          Logout
        </Button>
      </div>
    </header>
  );
};
