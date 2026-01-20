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
  RefreshCw,
  CheckCircle,
  XCircle,
  FileText,
  Settings,
  Shield,
  ChevronRight,
  Activity
} from 'lucide-react';

export default function AdminDashboard() {
  const { api, user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentTransfers, setRecentTransfers] = useState([]);
  const [recentAudit, setRecentAudit] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashboardRes, transfersRes, auditRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/transfers?limit=5&status=pending'),
        api.get('/admin/audit-logs?limit=5')
      ]);
      setStats(dashboardRes.data);
      setRecentTransfers(transfersRes.data);
      setRecentAudit(auditRes.data);
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
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getActionColor = (action) => {
    if (action.includes('created') || action.includes('registered')) return 'text-emerald-400';
    if (action.includes('updated') || action.includes('transfer')) return 'text-cyan-400';
    if (action.includes('deleted') || action.includes('redacted')) return 'text-red-400';
    if (action.includes('login')) return 'text-blue-400';
    return 'text-slate-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="admin-dashboard">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400 mt-1">Welcome back, {user?.first_name}. Here's your banking operations overview.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Shield className="h-3.5 w-3.5" />
            {user?.role?.replace('_', ' ')}
          </span>
          <Button onClick={fetchDashboardData} variant="outline" size="sm" className="border-white/10 text-white hover:bg-white/5">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border-cyan-500/20">
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-cyan-300/80 text-sm font-medium">Total Customers</p>
                <p className="text-3xl font-heading font-bold text-white mt-1">
                  {stats?.total_customers || 0}
                </p>
                <p className="text-emerald-400 text-sm mt-2 flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" />
                  {stats?.active_customers || 0} active
                </p>
              </div>
              <div className="w-11 h-11 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                <Users className="h-5 w-5 text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border-emerald-500/20">
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-emerald-300/80 text-sm font-medium">Total Accounts</p>
                <p className="text-3xl font-heading font-bold text-white mt-1">
                  {stats?.total_accounts || 0}
                </p>
                <p className="text-slate-400 text-sm mt-2">
                  Multi-currency
                </p>
              </div>
              <div className="w-11 h-11 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Wallet className="h-5 w-5 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 border-yellow-500/20">
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-yellow-300/80 text-sm font-medium">Pending Transfers</p>
                <p className="text-3xl font-heading font-bold text-white mt-1">
                  {stats?.pending_transfers || 0}
                </p>
                <p className="text-yellow-400 text-sm mt-2 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Awaiting action
                </p>
              </div>
              <div className="w-11 h-11 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 border-purple-500/20">
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-purple-300/80 text-sm font-medium">Total Balances</p>
                <div className="mt-1 space-y-0.5">
                  {stats?.balance_by_currency?.slice(0, 2).map(b => (
                    <p key={b._id} className="text-lg font-heading font-bold text-white">
                      {formatCurrency(b.total, b._id || 'USD')}
                    </p>
                  ))}
                </div>
              </div>
              <div className="w-11 h-11 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pending Transfers - Takes more space */}
        <Card className="lg:col-span-7 glass-card" data-testid="pending-transfers-card">
          <CardHeader className="border-b border-white/5 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Clock className="h-4 w-4 text-yellow-400" />
                </div>
                <CardTitle className="text-white text-lg font-heading">Pending Transfers</CardTitle>
              </div>
              <Link to="/admin/transfers" className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                View All <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              {recentTransfers.map((tx, index) => (
                <div 
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-navy-950/50 border border-white/5 hover:border-yellow-500/30 transition-colors"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <ArrowUpRight className="h-4 w-4 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{tx.description || 'Wire Transfer'}</p>
                      <p className="text-slate-500 text-xs">{tx.reference}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-heading font-bold text-white">
                      {formatCurrency(tx.amount, tx.currency)}
                    </p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
              {recentTransfers.length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="h-10 w-10 text-emerald-500/50 mx-auto mb-3" />
                  <p className="text-slate-400">No pending transfers</p>
                  <p className="text-slate-500 text-sm">All caught up!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-5 glass-card">
          <CardHeader className="border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <Activity className="h-4 w-4 text-cyan-400" />
              </div>
              <CardTitle className="text-white text-lg font-heading">Quick Actions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-3">
              <Link 
                to="/admin/customers" 
                className="p-4 rounded-xl bg-navy-950/50 border border-white/5 hover:border-cyan-500/30 hover:bg-navy-950 transition-all group"
              >
                <Users className="h-5 w-5 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-white font-medium text-sm">Customers</p>
                <p className="text-slate-500 text-xs">Manage clients</p>
              </Link>
              
              <Link 
                to="/admin/transfers" 
                className="p-4 rounded-xl bg-navy-950/50 border border-white/5 hover:border-emerald-500/30 hover:bg-navy-950 transition-all group"
              >
                <TrendingUp className="h-5 w-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-white font-medium text-sm">Transfers</p>
                <p className="text-slate-500 text-xs">Process requests</p>
              </Link>
              
              <Link 
                to="/admin/instruments" 
                className="p-4 rounded-xl bg-navy-950/50 border border-white/5 hover:border-purple-500/30 hover:bg-navy-950 transition-all group"
              >
                <FileText className="h-5 w-5 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-white font-medium text-sm">Instruments</p>
                <p className="text-slate-500 text-xs">Create KTT</p>
              </Link>
              
              <Link 
                to="/admin/settings" 
                className="p-4 rounded-xl bg-navy-950/50 border border-white/5 hover:border-yellow-500/30 hover:bg-navy-950 transition-all group"
              >
                <Settings className="h-5 w-5 text-yellow-400 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-white font-medium text-sm">Settings</p>
                <p className="text-slate-500 text-xs">SMTP & config</p>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="glass-card">
        <CardHeader className="border-b border-white/5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Shield className="h-4 w-4 text-blue-400" />
              </div>
              <CardTitle className="text-white text-lg font-heading">Recent Activity (Audit Log)</CardTitle>
            </div>
            <Link to="/admin/audit-logs" className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-2">
            {recentAudit.map((log, index) => (
              <div 
                key={log.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <div>
                    <p className={`font-medium text-sm ${getActionColor(log.action)}`}>
                      {log.action.replace(/_/g, ' ')}
                    </p>
                    <p className="text-slate-500 text-xs">User: {log.user_id.substring(0, 8)}...</p>
                  </div>
                </div>
                <p className="text-slate-500 text-xs">{formatDate(log.timestamp)}</p>
              </div>
            ))}
            {recentAudit.length === 0 && (
              <p className="text-center text-slate-400 py-4">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
