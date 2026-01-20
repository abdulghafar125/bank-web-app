import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { Wallet, Eye, ArrowUpRight, Loader2, Plus } from 'lucide-react';

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

  const getAccountTypeColor = (type) => {
    switch (type) {
      case 'checking':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'savings':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'ktt':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="accounts-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white">Your Accounts</h1>
          <p className="text-slate-400 mt-1">Manage your banking accounts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account, index) => (
          <Card 
            key={account.id} 
            className="glass-card card-hover"
            style={{ animationDelay: `${index * 100}ms` }}
            data-testid={`account-card-${account.id}`}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-cyan-400" />
                </div>
                <span className={`badge ${getAccountTypeColor(account.account_type)}`}>
                  {account.account_type.toUpperCase()}
                </span>
              </div>

              <div className="mb-4">
                <p className="text-slate-400 text-sm">Account Number</p>
                <p className="text-white font-mono text-lg">•••• •••• {account.account_number.slice(-4)}</p>
              </div>

              <div className="mb-4">
                <p className="text-slate-400 text-sm">Currency</p>
                <p className="text-white font-semibold">{account.currency}</p>
              </div>

              <div className="space-y-3 pt-4 border-t border-white/5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Available</span>
                  <span className="text-white font-heading font-bold">
                    {formatCurrency(account.available_balance, account.currency)}
                  </span>
                </div>
                
                {account.transit_balance > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">In Transit</span>
                    <span className="text-yellow-400">
                      {formatCurrency(account.transit_balance, account.currency)}
                    </span>
                  </div>
                )}
                
                {account.held_balance > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">On Hold</span>
                    <span className="text-orange-400">
                      {formatCurrency(account.held_balance, account.currency)}
                    </span>
                  </div>
                )}
                
                {account.blocked_balance > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Blocked</span>
                    <span className="text-red-400">
                      {formatCurrency(account.blocked_balance, account.currency)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-6">
                <Button 
                  variant="outline" 
                  className="flex-1 border-white/10 text-white hover:bg-white/5"
                  asChild
                >
                  <Link to={`/transactions?account=${account.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    History
                  </Link>
                </Button>
                <Button 
                  className="flex-1 bg-cyan-500 hover:bg-cyan-600"
                  asChild
                >
                  <Link to="/transfers">
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    Transfer
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {accounts.length === 0 && (
          <Card className="glass-card col-span-full">
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

      {/* Account Summary */}
      {accounts.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-white">Account Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-slate-400 text-sm">Total Accounts</p>
                <p className="text-2xl font-heading font-bold text-white mt-1">{accounts.length}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Available (USD)</p>
                <p className="text-2xl font-heading font-bold text-emerald-400 mt-1">
                  {formatCurrency(
                    accounts
                      .filter(a => a.currency === 'USD')
                      .reduce((sum, a) => sum + a.available_balance, 0)
                  )}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">In Transit</p>
                <p className="text-2xl font-heading font-bold text-yellow-400 mt-1">
                  {formatCurrency(accounts.reduce((sum, a) => sum + a.transit_balance, 0))}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Currencies</p>
                <p className="text-2xl font-heading font-bold text-cyan-400 mt-1">
                  {[...new Set(accounts.map(a => a.currency))].length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
