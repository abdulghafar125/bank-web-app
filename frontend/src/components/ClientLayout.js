import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Wallet, 
  ArrowRightLeft, 
  Users, 
  FileText, 
  MessageSquare, 
  User,
  HelpCircle,
  LogOut,
  Menu,
  X,
  Bell,
  Home,
  Send,
  CreditCard,
  Settings
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useState } from 'react';

// Desktop sidebar items
const sidebarItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/accounts', icon: Wallet, label: 'Accounts' },
  { path: '/transactions', icon: ArrowRightLeft, label: 'Transactions' },
  { path: '/transfers', icon: Send, label: 'Transfers' },
  { path: '/beneficiaries', icon: Users, label: 'Beneficiaries' },
  { path: '/instruments', icon: FileText, label: 'Bank Instruments' },
  { path: '/tickets', icon: MessageSquare, label: 'Support' },
  { path: '/funding', icon: HelpCircle, label: 'Funding Instructions' },
  { path: '/profile', icon: User, label: 'Profile' },
];

// Mobile bottom nav items (simplified)
const mobileNavItems = [
  { path: '/dashboard', icon: Home, label: 'Home' },
  { path: '/accounts', icon: Wallet, label: 'Accounts' },
  { path: '/transfers', icon: Send, label: 'Send' },
  { path: '/transactions', icon: ArrowRightLeft, label: 'History' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export const ClientLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-navy-950" data-testid="client-layout">
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className={`
        fixed left-0 top-0 h-full w-64 bg-navy-950 border-r border-white/5 z-50
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="p-4 border-b border-white/5">
          <Link to="/dashboard" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
            <img 
              src="https://customer-assets.emergentagent.com/job_04a84262-127c-46bf-90fb-19ace47e860b/artifacts/h938t30r_logo-2.png" 
              alt="Prominence Bank" 
              className="h-10"
            />
          </Link>
        </div>

        <nav className="p-3 flex-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-all ${
                  isActive 
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="lg:ml-64 min-h-screen pb-20 lg:pb-0">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-navy-950/95 backdrop-blur-lg border-b border-white/5">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 text-white"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <img 
              src="https://customer-assets.emergentagent.com/job_04a84262-127c-46bf-90fb-19ace47e860b/artifacts/h938t30r_logo-2.png" 
              alt="Prominence Bank" 
              className="h-8"
            />
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-slate-400">
                <Bell className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden lg:flex sticky top-0 z-30 bg-navy-950/95 backdrop-blur-lg border-b border-white/5 px-8 py-4 items-center justify-between">
          <h2 className="text-lg font-heading font-semibold text-white">
            {sidebarItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
          </h2>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <Bell className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-cyan-500/20 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-cyan-400">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-navy-900/95 backdrop-blur-lg border-t border-white/10 z-40 safe-area-pb">
        <div className="flex items-center justify-around py-2">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                  isActive 
                    ? 'text-cyan-400' 
                    : 'text-slate-500'
                }`}
              >
                <div className={`p-2 rounded-xl ${isActive ? 'bg-cyan-500/20' : ''}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
