import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  TrendingUp,
  FileText,
  Plus,
  Eye,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { api, user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [accountsRes, transactionsRes] = await Promise.all([
        api.get('/accounts'),
        accounts.length > 0 ? api.get(`/accounts/${accounts[0].id}/transactions?limit=5`) : Promise.resolve({ data: [] })
      ]);
      setAccounts(accountsRes.data);
      
      if (accountsRes.data.length > 0) {
        const txRes = await api.get(`/accounts/${accountsRes.data[0].id}/transactions?limit=5`);
        setTransactions(txRes.data);
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const totalBalance = accounts.reduce((sum, acc) => {
    // Simple conversion for display (in real app, use exchange rates)
    return sum + acc.available_balance;
  }, 0);

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'badge-completed',
      pending: 'badge-pending',
      processing: 'badge-processing',
      rejected: 'badge-rejected'
    };
    return `badge ${styles[status] || 'badge-pending'}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" data-testid="client-dashboard">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white">
            Welcome back, {user?.first_name}
          </h1>
          <p className="text-slate-400 mt-1">Here's your financial overview</p>
        </div>
        <Button 
          className="bg-cyan-500 hover:bg-cyan-600 glow-cyan"
          asChild
        >
          <Link to="/transfers">
            <Plus className="mr-2 h-4 w-4" />
            New Transfer
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="stat-card-highlight" data-testid="total-balance-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Available</p>
                <p className="text-3xl font-heading font-bold text-white mt-1">
                  {formatCurrency(totalBalance)}
                </p>
              </div>
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                <Wallet className="h-6 w-6 text-cyan-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">In Transit</p>
                <p className="text-2xl font-heading font-bold text-white mt-1">
                  {formatCurrency(accounts.reduce((sum, acc) => sum + acc.transit_balance, 0))}
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
                <p className="text-slate-400 text-sm">Accounts</p>
                <p className="text-2xl font-heading font-bold text-white mt-1">
                  {accounts.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Pending</p>
                <p className="text-2xl font-heading font-bold text-white mt-1">
                  {transactions.filter(t => t.status === 'pending').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accounts & Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Accounts List */}
        <Card className="lg:col-span-5 glass-card" data-testid="accounts-list">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-white flex items-center justify-between">
              <span>Your Accounts</span>
              <Link to="/accounts" className="text-sm text-cyan-400 hover:text-cyan-300 font-normal">
                View All
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {accounts.map((account, index) => (
                <div 
                  key={account.id}
                  className="p-4 rounded-lg bg-navy-950/50 border border-white/5 hover:border-white/10 transition-colors"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm uppercase tracking-wider">
                        {account.account_type} • {account.currency}
                      </p>
                      <p className="text-white font-mono text-sm mt-1">
                        •••• {account.account_number.slice(-4)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-heading font-bold text-white">
                        {formatCurrency(account.available_balance, account.currency)}
                      </p>
                      {account.transit_balance > 0 && (
                        <p className="text-xs text-yellow-400">
                          +{formatCurrency(account.transit_balance, account.currency)} in transit
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {accounts.length === 0 && (
                <p className="text-center text-slate-400 py-8">No accounts found</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="lg:col-span-7 glass-card" data-testid="recent-transactions">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-white flex items-center justify-between">
              <span>Recent Transactions</span>
              <Link to="/transactions" className="text-sm text-cyan-400 hover:text-cyan-300 font-normal">
                View All
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {transactions.map((tx, index) => (
                <div 
                  key={tx.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-navy-950/50 border border-white/5 hover:border-white/10 transition-colors"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.amount > 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'
                    }`}>
                      {tx.amount > 0 ? (
                        <ArrowDownLeft className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5 text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">{tx.description}</p>
                      <p className="text-slate-400 text-sm">{tx.counterparty || tx.reference}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-heading font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount, tx.currency)}
                    </p>
                    <span className={getStatusBadge(tx.status)}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <p className="text-center text-slate-400 py-8">No recent transactions</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/transfers" className="stat-card p-4 flex items-center gap-3 hover:border-cyan-500/30 transition-colors">
          <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
            <ArrowUpRight className="h-5 w-5 text-cyan-400" />
          </div>
          <span className="text-white font-medium">Transfer Funds</span>
        </Link>
        
        <Link to="/beneficiaries" className="stat-card p-4 flex items-center gap-3 hover:border-cyan-500/30 transition-colors">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
            <Plus className="h-5 w-5 text-emerald-400" />
          </div>
          <span className="text-white font-medium">Add Beneficiary</span>
        </Link>
        
        <Link to="/instruments" className="stat-card p-4 flex items-center gap-3 hover:border-cyan-500/30 transition-colors">
          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
            <FileText className="h-5 w-5 text-purple-400" />
          </div>
          <span className="text-white font-medium">Bank Instruments</span>
        </Link>
        
        <Link to="/tickets" className="stat-card p-4 flex items-center gap-3 hover:border-cyan-500/30 transition-colors">
          <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
            <Eye className="h-5 w-5 text-yellow-400" />
          </div>
          <span className="text-white font-medium">Support Tickets</span>
        </Link>
      </div>
    </div>
  );
}
