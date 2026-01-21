import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Wallet, Eye, ArrowUpRight, Loader2, TrendingUp, FileText, Clock, ChevronRight } from 'lucide-react';

export default function AccountsPage() {
  const { api } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/accounts');
      setAccounts(response.data);
    } catch (error) {
      toast.error('Failed to load accounts');
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

  const getAccountIcon = (type) => {
    switch (type) {
      case 'checking':
        return { icon: Wallet, color: 'bg-cyan-500/20 text-cyan-400' };
      case 'savings':
        return { icon: TrendingUp, color: 'bg-emerald-500/20 text-emerald-400' };
      case 'ktt':
        return { icon: FileText, color: 'bg-purple-500/20 text-purple-400' };
      default:
        return { icon: Wallet, color: 'bg-slate-500/20 text-slate-400' };
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.available_balance, 0);
  const totalTransit = accounts.reduce((sum, acc) => sum + acc.transit_balance, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="accounts-page">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-heading font-bold text-white">My Accounts</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your banking accounts</p>
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-navy-800 to-navy-900 border-white/10 rounded-2xl">
        <CardContent className="py-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Available</p>
              <p className="text-2xl md:text-3xl font-heading font-bold text-white mt-1">
                {formatCurrency(totalBalance)}
              </p>
              {totalTransit > 0 && (
                <p className="text-yellow-400 text-sm mt-1 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatCurrency(totalTransit)} in transit
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm">Accounts</p>
              <p className="text-2xl font-heading font-bold text-white mt-1">{accounts.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts List */}
      <div className="space-y-3">
        {accounts.map((account, index) => {
          const { icon: Icon, color } = getAccountIcon(account.account_type);
          return (
            <Card 
              key={account.id} 
              className="bg-navy-900/50 border-white/5 rounded-2xl hover:border-white/10 transition-colors"
              data-testid={`account-card-${account.id}`}
            >
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium capitalize">{account.account_type} Account</p>
                        <p className="text-slate-500 font-mono text-sm">•••• {account.account_number.slice(-4)}</p>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 text-white">
                        {account.currency}
                      </span>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-slate-500 text-xs">Available</p>
                          <p className="text-lg font-heading font-bold text-white">
                            {formatCurrency(account.available_balance, account.currency)}
                          </p>
                        </div>
                        {account.transit_balance > 0 && (
                          <div className="text-right">
                            <p className="text-slate-500 text-xs">In Transit</p>
                            <p className="text-yellow-400 font-semibold">
                              {formatCurrency(account.transit_balance, account.currency)}
                            </p>
                          </div>
                        )}
                        {account.held_balance > 0 && (
                          <div className="text-right">
                            <p className="text-slate-500 text-xs">On Hold</p>
                            <p className="text-orange-400 font-semibold">
                              {formatCurrency(account.held_balance, account.currency)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1 h-9 border-white/10 text-white hover:bg-white/5 rounded-xl text-xs"
                        asChild
                      >
                        <Link to={`/transactions?account=${account.id}`}>
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          History
                        </Link>
                      </Button>
                      <Button 
                        size="sm"
                        className="flex-1 h-9 bg-cyan-500 hover:bg-cyan-600 rounded-xl text-xs"
                        asChild
                      >
                        <Link to="/transfers">
                          <ArrowUpRight className="mr-1.5 h-3.5 w-3.5" />
                          Transfer
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {accounts.length === 0 && (
          <Card className="bg-navy-900/50 border-white/5 rounded-2xl">
            <CardContent className="py-12 text-center">
              <Wallet className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No accounts found</p>
              <p className="text-slate-500 text-sm mt-2">
                Contact support to open a new account
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
