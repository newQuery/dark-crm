import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Users2, FileText, CreditCard, Users } from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: FolderKanban, label: 'Projects', path: '/projects' },
  { icon: Users2, label: 'Clients', path: '/clients' },
  { icon: FileText, label: 'Invoices', path: '/invoices' },
  { icon: CreditCard, label: 'Payments', path: '/payments' },
  { icon: Users, label: 'Users', path: '/users' },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-full w-[280px] bg-[color:var(--bg-muted)] border-r border-[color:var(--border-default)] z-40">
      <div className="p-6">
        <img 
          src="https://customer-assets.emergentagent.com/job_nextcrm-hub/artifacts/0kh97peq_1.png" 
          alt="nQCrm Logo" 
          className="h-8 w-auto"
          data-testid="logo-horizontal"
        />
      </div>
      
      <nav className="mt-4 px-3 space-y-1" data-testid="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              data-testid={`nav-${item.label.toLowerCase()}-link`}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200",
                "relative",
                "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-7 before:w-[3px] before:rounded-full before:transition-colors",
                isActive
                  ? "text-[color:var(--fg-primary)] bg-white/5 before:bg-[color:var(--primary)]"
                  : "text-[color:var(--fg-secondary)] hover:text-[color:var(--fg-primary)] hover:bg-white/5 before:bg-transparent"
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon 
                size={18} 
                className={cn(
                  "transition-colors",
                  isActive 
                    ? "text-[color:var(--primary)]" 
                    : "text-[color:var(--fg-tertiary)] group-hover:text-[color:var(--primary)]"
                )} 
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
