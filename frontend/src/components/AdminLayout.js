import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Wallet,
  ArrowRightLeft, 
  FileText, 
  Settings,
  Shield,
  LogOut,
  Menu,
  X,
  Bell
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useState } from 'react';

const adminNavItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/customers', icon: Users, label: 'Customers' },
  { path: '/admin/accounts', icon: Wallet, label: 'Accounts' },
  { path: '/admin/transfers', icon: ArrowRightLeft, label: 'Transfers' },
  { path: '/admin/instruments', icon: FileText, label: 'Instruments' },
  { path: '/admin/audit-logs', icon: Shield, label: 'Audit Logs' },
  { path: '/admin/settings', icon: Settings, label: 'Settings' },
];

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout" data-testid="admin-layout">
      {/* Mobile Menu Button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-navy-900 rounded-lg border border-white/10"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="h-5 w-5 text-white" /> : <Menu className="h-5 w-5 text-white" />}
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300`}>
        <div className="sidebar-logo">
          <Link to="/admin" className="flex items-center gap-3">
            <img 
              src="https://customer-assets.emergentagent.com/job_04a84262-127c-46bf-90fb-19ace47e860b/artifacts/h938t30r_logo-2.png" 
              alt="Prominence Bank" 
              className="h-10"
            />
          </Link>
          <span className="mt-2 badge badge-processing text-xs">Admin Portal</span>
        </div>

        <nav className="sidebar-nav">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path !== '/admin' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <Link 
            to="/dashboard"
            className="nav-item w-full text-cyan-400 hover:bg-cyan-500/10 mb-2"
          >
            <ArrowRightLeft className="h-5 w-5" />
            Switch to Client View
          </Link>
          <button
            onClick={logout}
            className="nav-item w-full text-red-400 hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Bar */}
        <div className="topbar flex items-center justify-between">
          <div className="lg:hidden w-10" />
          <div className="hidden lg:block">
            <h2 className="text-lg font-heading font-semibold text-white">
              {adminNavItems.find(item => 
                item.path === location.pathname || 
                (item.path !== '/admin' && location.pathname.startsWith(item.path))
              )?.label || 'Admin Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-purple-400">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-white">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-purple-400 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};
