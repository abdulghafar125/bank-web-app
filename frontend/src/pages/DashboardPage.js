import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  TrendingUp,
  FileText,
  RefreshCw,
  Send,
  CreditCard,
  Receipt,
  MessageSquare,
  ChevronRight,
  Building2,
  Globe,
  Shield,
  Eye,
  EyeOff,
  Plus,
  Copy,
  Check,
  AlertTriangle,
  Bitcoin
} from 'lucide-react';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

export default function DashboardPage() {
  const { api, user } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [cryptoWallets, setCryptoWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccountIndex, setSelectedAccountIndex] = useState(0);
  const [hideBalance, setHideBalance] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(null);
  const [selectedWallet, setSelectedWallet] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [accountsRes, cryptoRes] = await Promise.all([
        api.get('/accounts'),
        api.get('/crypto/wallets')
      ]);
      setAccounts(accountsRes.data);
      setCryptoWallets(cryptoRes.data.wallets || []);
      
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
    if (hideBalance) return '••••••';
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
      return `Yesterday`;
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.available_balance, 0);
  const totalTransit = accounts.reduce((sum, acc) => sum + acc.transit_balance, 0);

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-emerald-500/20 text-emerald-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      processing: 'bg-blue-500/20 text-blue-400',
      rejected: 'bg-red-500/20 text-red-400'
    };
    return `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.pending}`;
  };

  const copyToClipboard = async (address, asset) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(asset);
      toast.success(`${asset} address copied!`);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      toast.error('Failed to copy address');
    }
  };

  const getCryptoIcon = (asset) => {
    const colors = {
      BTC: 'text-orange-400 bg-orange-500/20',
      ETH: 'text-blue-400 bg-blue-500/20',
      XLM: 'text-cyan-400 bg-cyan-500/20',
      BCH: 'text-green-400 bg-green-500/20',
      USDT: 'text-emerald-400 bg-emerald-500/20'
    };
    return colors[asset] || 'text-slate-400 bg-slate-500/20';
  };

  const selectedAccount = accounts[selectedAccountIndex];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <RefreshCw className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="client-dashboard">
      {/* Welcome Header - Mobile Optimized */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm">Welcome back,</p>
          <h1 className="text-xl md:text-2xl font-heading font-bold text-white">
            {user?.first_name} {user?.last_name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
            user?.kyc_status === 'verified' 
              ? 'bg-emerald-500/20 text-emerald-400' 
              : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            <Shield className="h-3 w-3" />
            {user?.kyc_status}
          </span>
        </div>
      </div>

      {/* Main Balance Card - Mobile First */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-cyan-600 via-cyan-500 to-blue-600 border-0 shadow-xl shadow-cyan-500/20" data-testid="total-balance-card">
        <CardContent className="pt-6 pb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white/70 text-sm font-medium">Total Balance</p>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-3xl md:text-4xl font-heading font-bold text-white tracking-tight">
                  {formatCurrency(totalBalance)}
                </p>
                <button 
                  onClick={() => setHideBalance(!hideBalance)}
                  className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                >
                  {hideBalance ? <EyeOff className="h-4 w-4 text-white" /> : <Eye className="h-4 w-4 text-white" />}
                </button>
              </div>
            </div>
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
              <Wallet className="h-6 w-6 text-white" />
            </div>
          </div>
          
          {totalTransit > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-white/70" />
              <span className="text-white/70 text-sm">In Transit: <span className="text-white font-medium">{formatCurrency(totalTransit)}</span></span>
            </div>
          )}
          
          {/* Quick Action Buttons - Mobile Style */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <Button 
              onClick={() => navigate('/transfers')}
              className="flex flex-col items-center gap-1.5 h-auto py-3 bg-white/15 hover:bg-white/25 rounded-xl border-0 shadow-none"
              data-testid="quick-send-btn"
            >
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Send className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-semibold text-white">Send</span>
            </Button>
            <Button 
              onClick={() => navigate('/beneficiaries')}
              className="flex flex-col items-center gap-1.5 h-auto py-3 bg-white/15 hover:bg-white/25 rounded-xl border-0 shadow-none"
              data-testid="quick-pay-btn"
            >
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-semibold text-white">Pay</span>
            </Button>
            <Button 
              onClick={() => navigate('/tickets')}
              className="flex flex-col items-center gap-1.5 h-auto py-3 bg-white/15 hover:bg-white/25 rounded-xl border-0 shadow-none"
              data-testid="quick-request-btn"
            >
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-semibold text-white">Request</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-heading font-semibold text-white">My Accounts</h2>
          <Link to="/accounts" className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
            See All <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        
        {/* Horizontal Scrollable Account Cards */}
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
          {accounts.map((account, index) => (
            <button
              key={account.id}
              onClick={() => {
                setSelectedAccountIndex(index);
                fetchTransactionsForAccount(account.id);
              }}
              className={`flex-shrink-0 w-[280px] sm:w-[300px] p-4 rounded-2xl border transition-all duration-200 text-left snap-start ${
                selectedAccountIndex === index 
                  ? 'bg-navy-800 border-cyan-500/50 shadow-lg' 
                  : 'bg-navy-900/50 border-white/5 hover:border-white/10'
              }`}
              data-testid={`account-card-${account.id}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  account.account_type === 'checking' ? 'bg-cyan-500/20' :
                  account.account_type === 'savings' ? 'bg-emerald-500/20' : 'bg-purple-500/20'
                }`}>
                  {account.account_type === 'checking' ? <Wallet className="h-5 w-5 text-cyan-400" /> :
                   account.account_type === 'savings' ? <TrendingUp className="h-5 w-5 text-emerald-400" /> :
                   <FileText className="h-5 w-5 text-purple-400" />}
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  account.account_type === 'checking' ? 'bg-cyan-500/20 text-cyan-400' :
                  account.account_type === 'savings' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-purple-500/20 text-purple-400'
                }`}>
                  {account.currency}
                </span>
              </div>
              <p className="text-slate-400 text-sm capitalize">{account.account_type} Account</p>
              <p className="text-white/50 font-mono text-xs mt-0.5">•••• {account.account_number.slice(-4)}</p>
              <p className="text-xl font-heading font-bold text-white mt-2">
                {formatCurrency(account.available_balance, account.currency)}
              </p>
              {account.transit_balance > 0 && (
                <p className="text-xs text-yellow-400 mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatCurrency(account.transit_balance, account.currency)} in transit
                </p>
              )}
            </button>
          ))}
          
          {accounts.length === 0 && (
            <div className="flex-1 p-8 rounded-2xl border border-white/5 bg-navy-900/50 text-center min-w-[280px]">
              <Wallet className="h-10 w-10 text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400">No accounts found</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Services Grid - Mobile Optimized */}
      <div>
        <h2 className="text-base font-heading font-semibold text-white mb-3">Services</h2>
        <div className="grid grid-cols-4 gap-3">
          <Link to="/transfers" className="flex flex-col items-center p-3 rounded-xl bg-navy-900/50 border border-white/5 hover:bg-navy-800 transition-colors">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-2">
              <Send className="h-5 w-5 text-cyan-400" />
            </div>
            <span className="text-white text-xs font-medium text-center">Transfer</span>
          </Link>
          
          <Link to="/beneficiaries" className="flex flex-col items-center p-3 rounded-xl bg-navy-900/50 border border-white/5 hover:bg-navy-800 transition-colors">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-2">
              <Globe className="h-5 w-5 text-emerald-400" />
            </div>
            <span className="text-white text-xs font-medium text-center">Wire</span>
          </Link>
          
          <Link to="/instruments" className="flex flex-col items-center p-3 rounded-xl bg-navy-900/50 border border-white/5 hover:bg-navy-800 transition-colors">
            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center mb-2">
              <FileText className="h-5 w-5 text-purple-400" />
            </div>
            <span className="text-white text-xs font-medium text-center">KTT</span>
          </Link>
          
          <Link to="/funding" className="flex flex-col items-center p-3 rounded-xl bg-navy-900/50 border border-white/5 hover:bg-navy-800 transition-colors">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-xl flex items-center justify-center mb-2">
              <Building2 className="h-5 w-5 text-yellow-400" />
            </div>
            <span className="text-white text-xs font-medium text-center">Fund</span>
          </Link>
        </div>
      </div>

      {/* Crypto Wallets Section */}
      {cryptoWallets.length > 0 && (
        <div data-testid="crypto-wallets-section">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bitcoin className="h-5 w-5 text-orange-400" />
              <h2 className="text-base font-heading font-semibold text-white">Crypto Wallets</h2>
            </div>
          </div>
          
          {/* Horizontal Scrollable Wallet Cards */}
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
            {cryptoWallets.map((wallet) => (
              <div
                key={wallet.asset}
                className="flex-shrink-0 w-[280px] sm:w-[320px] p-4 rounded-2xl border border-white/5 bg-navy-900/50 snap-start"
                data-testid={`crypto-wallet-${wallet.asset}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getCryptoIcon(wallet.asset)}`}>
                      <span className="text-sm font-bold">{wallet.asset}</span>
                    </div>
                    <div>
                      <p className="text-white font-semibold">{wallet.asset}</p>
                      <p className="text-slate-500 text-xs">{wallet.network}</p>
                    </div>
                  </div>
                  {wallet.network_note && (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                      {wallet.network_note}
                    </span>
                  )}
                </div>
                
                {/* QR Code */}
                <div 
                  className="bg-white p-3 rounded-xl mb-3 cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => setSelectedWallet(selectedWallet === wallet.asset ? null : wallet.asset)}
                >
                  <QRCodeSVG 
                    value={wallet.address} 
                    size={selectedWallet === wallet.asset ? 180 : 100}
                    className="mx-auto transition-all duration-300"
                  />
                </div>
                
                {/* Address with Copy Button */}
                <div className="flex items-center gap-2 p-2 bg-navy-950/50 rounded-lg">
                  <p className="text-slate-300 text-xs font-mono flex-1 truncate">
                    {wallet.address}
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-white/10"
                    onClick={() => copyToClipboard(wallet.address, wallet.asset)}
                    data-testid={`copy-${wallet.asset}-btn`}
                  >
                    {copiedAddress === wallet.asset ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4 text-slate-400" />
                    )}
                  </Button>
                </div>
                
                {/* Warning */}
                <div className="mt-3 flex items-start gap-2 text-xs text-yellow-400/80">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                  <span>
                    Only send {wallet.asset} to this address. Min {wallet.min_confirmations} confirmations required.
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions - Mobile Style */}
      <div data-testid="recent-transactions">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-heading font-semibold text-white">Recent Transactions</h2>
          <Link to="/transactions" className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
            See All <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        
        <Card className="bg-navy-900/50 border-white/5 rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            {transactions.length === 0 ? (
              <div className="text-center py-8 px-4">
                <Receipt className="h-10 w-10 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">No recent transactions</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {transactions.map((tx, index) => (
                  <div 
                    key={tx.id}
                    className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.amount > 0 ? 'bg-emerald-500/20' : 'bg-slate-500/20'
                      }`}>
                        {tx.amount > 0 ? (
                          <ArrowDownLeft className="h-5 w-5 text-emerald-400" />
                        ) : (
                          <ArrowUpRight className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{tx.description || tx.transaction_type.replace('_', ' ')}</p>
                        <p className="text-slate-500 text-xs">{formatDate(tx.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-heading font-bold text-sm ${tx.amount > 0 ? 'text-emerald-400' : 'text-white'}`}>
                        {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount, tx.currency)}
                      </p>
                      <span className={getStatusBadge(tx.status)}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
