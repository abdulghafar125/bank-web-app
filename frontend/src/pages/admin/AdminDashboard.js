import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Wallet, 
  Clock, 
  DollarSign, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export default function AdminDashboard() {
  const { api } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentTransfers, setRecentTransfers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashboardRes, transfersRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/transfers?limit=5&status=pending')
      ]);
      setStats(dashboardRes.data);
      setRecentTransfers(transfersRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" data-testid="admin-dashboard">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400 mt-1">Overview of banking operations</p>
        </div>
        <Button onClick={fetchDashboardData} variant="outline" className="border-white/10 text-white hover:bg-white/5">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="stat-card-highlight">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Customers</p>
                <p className="text-3xl font-heading font-bold text-white mt-1">
                  {stats?.total_customers || 0}
                </p>
                <p className="text-emerald-400 text-sm mt-1">
                  {stats?.active_customers || 0} active
                </p>
              </div>
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Accounts</p>
                <p className="text-3xl font-heading font-bold text-white mt-1">
                  {stats?.total_accounts || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Wallet className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Pending Transfers</p>
                <p className="text-3xl font-heading font-bold text-white mt-1">
                  {stats?.pending_transfers || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Balances</p>
                <div className="mt-1 space-y-1">
                  {stats?.balance_by_currency?.map(b => (
                    <p key={b._id} className="text-lg font-heading font-bold text-white">
                      {formatCurrency(b.total, b._id || 'USD')}
                    </p>
                  ))}
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Transfers & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pending Transfers */}
        <Card className="lg:col-span-8 glass-card" data-testid="pending-transfers-card">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
                Pending Transfers
              </span>
              <Link to="/admin/transfers" className="text-sm text-cyan-400 hover:text-cyan-300 font-normal">
                View All
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {recentTransfers.map((tx, index) => (
                <div 
                  key={tx.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-navy-950/50 border border-white/5 hover:border-yellow-500/30 transition-colors"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <ArrowUpRight className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{tx.description || 'Wire Transfer'}</p>
                      <p className="text-slate-400 text-sm">{tx.reference}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-heading font-bold text-white">
                      {formatCurrency(Math.abs(tx.amount), tx.currency)}
                    </p>
                    <span className="badge badge-pending">{tx.status}</span>
                  </div>
                </div>
              ))}
              {recentTransfers.length === 0 && (
                <p className="text-center text-slate-400 py-8">No pending transfers</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-4 glass-card">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <Link 
                to="/admin/customers" 
                className="flex items-center gap-3 p-4 rounded-lg bg-navy-950/50 border border-white/5 hover:border-cyan-500/30 transition-colors"
              >
                <Users className="h-5 w-5 text-cyan-400" />
                <span className="text-white">Manage Customers</span>
              </Link>
              
              <Link 
                to="/admin/transfers" 
                className="flex items-center gap-3 p-4 rounded-lg bg-navy-950/50 border border-white/5 hover:border-cyan-500/30 transition-colors"
              >
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                <span className="text-white">Process Transfers</span>
              </Link>
              
              <Link 
                to="/admin/instruments" 
                className="flex items-center gap-3 p-4 rounded-lg bg-navy-950/50 border border-white/5 hover:border-cyan-500/30 transition-colors"
              >
                <DollarSign className="h-5 w-5 text-purple-400" />
                <span className="text-white">Create Instrument</span>
              </Link>
              
              <Link 
                to="/admin/settings" 
                className="flex items-center gap-3 p-4 rounded-lg bg-navy-950/50 border border-white/5 hover:border-cyan-500/30 transition-colors"
              >
                <Clock className="h-5 w-5 text-yellow-400" />
                <span className="text-white">System Settings</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
