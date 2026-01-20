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
  RefreshCw,
  Send,
  CreditCard,
  Receipt,
  MessageSquare,
  ChevronRight,
  Building2,
  Globe,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccountIndex, setSelectedAccountIndex] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const accountsRes = await api.get('/accounts');
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

  const fetchTransactionsForAccount = async (accountId) => {
    try {
      const txRes = await api.get(`/accounts/${accountId}/transactions?limit=5`);
      setTransactions(txRes.data);
    } catch (error) {
      console.error('Failed to fetch transactions');
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.available_balance, 0);
  const totalTransit = accounts.reduce((sum, acc) => sum + acc.transit_balance, 0);
  const totalHeld = accounts.reduce((sum, acc) => sum + acc.held_balance, 0);

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      processing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.pending}`;
  };

  const selectedAccount = accounts[selectedAccountIndex];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="client-dashboard">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-white">
            Welcome back, {user?.first_name}
          </h1>
          <p className="text-slate-400 mt-1">Here's your financial overview</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${
            user?.kyc_status === 'verified' 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
          }`}>
            <Shield className="h-3.5 w-3.5" />
            KYC: {user?.kyc_status}
          </span>
        </div>
      </div>

      {/* Main Balance Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 border-cyan-500/20" data-testid="total-balance-card">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-2xl -ml-24 -mb-24" />
        <CardContent className="relative pt-6 pb-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-1">Total Available Balance</p>
              <p className="text-4xl md:text-5xl font-heading font-bold text-white tracking-tight">
                {formatCurrency(totalBalance)}
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-4">
                {totalTransit > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                    <span className="text-slate-400 text-sm">In Transit: <span className="text-yellow-400 font-medium">{formatCurrency(totalTransit)}</span></span>
                  </div>
                )}
                {totalHeld > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-400 rounded-full" />
                    <span className="text-slate-400 text-sm">On Hold: <span className="text-orange-400 font-medium">{formatCurrency(totalHeld)}</span></span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Quick Action Buttons - Mobile Banking Style */}
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => navigate('/transfers')}
                className="flex flex-col items-center gap-1.5 h-auto py-3 px-5 bg-cyan-500 hover:bg-cyan-600 rounded-xl shadow-lg shadow-cyan-500/25"
                data-testid="quick-send-btn"
              >
                <Send className="h-5 w-5" />
                <span className="text-xs font-semibold">SEND</span>
              </Button>
              <Button 
                onClick={() => navigate('/beneficiaries')}
                className="flex flex-col items-center gap-1.5 h-auto py-3 px-5 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10"
                data-testid="quick-pay-btn"
              >
                <CreditCard className="h-5 w-5" />
                <span className="text-xs font-semibold">PAY</span>
              </Button>
              <Button 
                onClick={() => navigate('/tickets')}
                className="flex flex-col items-center gap-1.5 h-auto py-3 px-5 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10"
                data-testid="quick-request-btn"
              >
                <MessageSquare className="h-5 w-5" />
                <span className="text-xs font-semibold">REQUEST</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Slider */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-heading font-semibold text-white">Your Accounts</h2>
          <Link to="/accounts" className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
          {accounts.map((account, index) => (
            <button
              key={account.id}
              onClick={() => {
                setSelectedAccountIndex(index);
                fetchTransactionsForAccount(account.id);
              }}
              className={`flex-shrink-0 w-72 p-4 rounded-xl border transition-all duration-200 text-left ${
                selectedAccountIndex === index 
                  ? 'bg-cyan-500/10 border-cyan-500/50 shadow-lg shadow-cyan-500/10' 
                  : 'bg-navy-900/50 border-white/5 hover:border-white/10'
              }`}
              data-testid={`account-card-${account.id}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  account.account_type === 'checking' ? 'bg-cyan-500/20' :
                  account.account_type === 'savings' ? 'bg-emerald-500/20' : 'bg-purple-500/20'
                }`}>
                  {account.account_type === 'checking' ? <Wallet className="h-5 w-5 text-cyan-400" /> :
                   account.account_type === 'savings' ? <TrendingUp className="h-5 w-5 text-emerald-400" /> :
                   <FileText className="h-5 w-5 text-purple-400" />}
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  account.account_type === 'checking' ? 'bg-cyan-500/20 text-cyan-400' :
                  account.account_type === 'savings' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-purple-500/20 text-purple-400'
                }`}>
                  {account.currency}
                </span>
              </div>
              <p className="text-slate-400 text-sm capitalize">{account.account_type} Account</p>
              <p className="text-white font-mono text-sm mt-0.5">•••• {account.account_number.slice(-4)}</p>
              <p className="text-xl font-heading font-bold text-white mt-2">
                {formatCurrency(account.available_balance, account.currency)}
              </p>
              {account.transit_balance > 0 && (
                <p className="text-xs text-yellow-400 mt-1">
                  +{formatCurrency(account.transit_balance, account.currency)} in transit
                </p>
              )}
            </button>
          ))}
          
          {accounts.length === 0 && (
            <div className="flex-1 p-8 rounded-xl border border-white/5 bg-navy-900/50 text-center">
              <Wallet className="h-10 w-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No accounts found</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <Card className="glass-card" data-testid="recent-transactions">
        <CardHeader className="border-b border-white/5 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg font-heading">Recent Transactions</CardTitle>
            <Link to="/transactions" className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {selectedAccount && (
            <p className="text-slate-500 text-sm mt-1">
              {selectedAccount.account_type} •••• {selectedAccount.account_number.slice(-4)}
            </p>
          )}
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-1">
            {transactions.map((tx, index) => (
              <div 
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors"
                style={{ animationDelay: `${index * 50}ms` }}
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
                    <p className="text-white font-medium">{tx.description || tx.transaction_type.replace('_', ' ')}</p>
                    <p className="text-slate-500 text-sm">{formatDate(tx.created_at)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-heading font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-white'}`}>
                    {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount, tx.currency)}
                  </p>
                  <span className={getStatusBadge(tx.status)}>
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
            
            {transactions.length === 0 && (
              <div className="text-center py-8">
                <Receipt className="h-10 w-10 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">No recent transactions</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link 
          to="/transfers" 
          className="p-4 rounded-xl bg-navy-900/50 border border-white/5 hover:border-cyan-500/30 hover:bg-navy-900 transition-all group"
        >
          <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Send className="h-5 w-5 text-cyan-400" />
          </div>
          <p className="text-white font-medium">Internal Transfer</p>
          <p className="text-slate-500 text-sm">Between accounts</p>
        </Link>
        
        <Link 
          to="/transfers" 
          className="p-4 rounded-xl bg-navy-900/50 border border-white/5 hover:border-emerald-500/30 hover:bg-navy-900 transition-all group"
        >
          <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Globe className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="text-white font-medium">Wire Transfer</p>
          <p className="text-slate-500 text-sm">External transfers</p>
        </Link>
        
        <Link 
          to="/instruments" 
          className="p-4 rounded-xl bg-navy-900/50 border border-white/5 hover:border-purple-500/30 hover:bg-navy-900 transition-all group"
        >
          <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <FileText className="h-5 w-5 text-purple-400" />
          </div>
          <p className="text-white font-medium">Bank Instruments</p>
          <p className="text-slate-500 text-sm">KTT & documents</p>
        </Link>
        
        <Link 
          to="/funding" 
          className="p-4 rounded-xl bg-navy-900/50 border border-white/5 hover:border-yellow-500/30 hover:bg-navy-900 transition-all group"
        >
          <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Building2 className="h-5 w-5 text-yellow-400" />
          </div>
          <p className="text-white font-medium">Fund Account</p>
          <p className="text-slate-500 text-sm">Wire instructions</p>
        </Link>
      </div>
    </div>
  );
}
