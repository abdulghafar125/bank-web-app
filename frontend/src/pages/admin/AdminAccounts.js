import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Search, Wallet, Loader2 } from 'lucide-react';

export default function AdminAccounts() {
  const { api } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    user_id: '',
    account_type: 'checking',
    currency: 'USD',
    initial_balance: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [accountsRes, customersRes] = await Promise.all([
        api.get('/admin/accounts?limit=100'),
        api.get('/admin/customers?limit=100')
      ]);
      setAccounts(accountsRes.data);
      setCustomers(customersRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/admin/accounts', {
        ...form,
        initial_balance: parseFloat(form.initial_balance) || 0
      });
      setShowAddModal(false);
      setForm({
        user_id: '',
        account_type: 'checking',
        currency: 'USD',
        initial_balance: ''
      });
      toast.success('Account created successfully');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create account');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const filteredAccounts = accounts.filter(acc => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        acc.account_number.toLowerCase().includes(search) ||
        acc.account_type.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const getAccountTypeColor = (type) => {
    switch (type) {
      case 'checking':
        return 'badge-completed';
      case 'savings':
        return 'badge-processing';
      case 'ktt':
        return 'badge-pending';
      default:
        return 'badge-pending';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="admin-accounts-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white">Account Management</h1>
          <p className="text-slate-400 mt-1">Create and manage customer accounts</p>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="bg-cyan-500 hover:bg-cyan-600 glow-cyan"
          data-testid="create-account-btn"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Account
        </Button>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search by account number or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-navy-950/50 border-white/10 text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Accounts Table */}
      <Card className="glass-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Account Number</th>
                    <th>Type</th>
                    <th>Currency</th>
                    <th className="text-right">Available</th>
                    <th className="text-right">Transit</th>
                    <th className="text-right">Held</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAccounts.map((acc, index) => (
                    <tr key={acc.id} style={{ animationDelay: `${index * 50}ms` }}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                            <Wallet className="h-4 w-4 text-cyan-400" />
                          </div>
                          <span className="text-white font-mono">{acc.account_number}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getAccountTypeColor(acc.account_type)}`}>
                          {acc.account_type}
                        </span>
                      </td>
                      <td className="text-slate-400">{acc.currency}</td>
                      <td className="table-amount amount-positive">
                        {formatCurrency(acc.available_balance, acc.currency)}
                      </td>
                      <td className="table-amount text-yellow-400">
                        {formatCurrency(acc.transit_balance, acc.currency)}
                      </td>
                      <td className="table-amount text-orange-400">
                        {formatCurrency(acc.held_balance, acc.currency)}
                      </td>
                      <td>
                        <span className={`badge ${acc.status === 'active' ? 'badge-completed' : 'badge-rejected'}`}>
                          {acc.status}
                        </span>
                      </td>
                      <td className="text-slate-400">
                        {new Date(acc.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Account Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-navy-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading">Create Account</DialogTitle>
            <DialogDescription className="text-slate-400">
              Create a new bank account for a customer
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateAccount} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Customer</Label>
              <Select 
                value={form.user_id} 
                onValueChange={(value) => setForm({...form, user_id: value})}
              >
                <SelectTrigger className="bg-navy-950/50 border-white/10 text-white">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent className="bg-navy-900 border-white/10 max-h-60">
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id} className="text-white hover:bg-white/10">
                      {c.first_name} {c.last_name} ({c.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Account Type</Label>
              <Select 
                value={form.account_type} 
                onValueChange={(value) => setForm({...form, account_type: value})}
              >
                <SelectTrigger className="bg-navy-950/50 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-navy-900 border-white/10">
                  <SelectItem value="checking" className="text-white hover:bg-white/10">Checking</SelectItem>
                  <SelectItem value="savings" className="text-white hover:bg-white/10">Savings</SelectItem>
                  <SelectItem value="ktt" className="text-white hover:bg-white/10">KTT Account</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Currency</Label>
              <Select 
                value={form.currency} 
                onValueChange={(value) => setForm({...form, currency: value})}
              >
                <SelectTrigger className="bg-navy-950/50 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-navy-900 border-white/10">
                  <SelectItem value="USD" className="text-white hover:bg-white/10">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR" className="text-white hover:bg-white/10">EUR - Euro</SelectItem>
                  <SelectItem value="GBP" className="text-white hover:bg-white/10">GBP - British Pound</SelectItem>
                  <SelectItem value="CHF" className="text-white hover:bg-white/10">CHF - Swiss Franc</SelectItem>
                  <SelectItem value="JPY" className="text-white hover:bg-white/10">JPY - Japanese Yen</SelectItem>
                  <SelectItem value="AUD" className="text-white hover:bg-white/10">AUD - Australian Dollar</SelectItem>
                  <SelectItem value="CAD" className="text-white hover:bg-white/10">CAD - Canadian Dollar</SelectItem>
                  <SelectItem value="SGD" className="text-white hover:bg-white/10">SGD - Singapore Dollar</SelectItem>
                  <SelectItem value="HKD" className="text-white hover:bg-white/10">HKD - Hong Kong Dollar</SelectItem>
                  <SelectItem value="AED" className="text-white hover:bg-white/10">AED - UAE Dirham</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Initial Balance</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.initial_balance}
                onChange={(e) => setForm({...form, initial_balance: e.target.value})}
                placeholder="0.00"
                className="bg-navy-950/50 border-white/10 text-white"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="button"
                variant="outline"
                onClick={() => setShowAddModal(false)}
                className="flex-1 border-white/10 text-white hover:bg-white/5"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="flex-1 bg-cyan-500 hover:bg-cyan-600"
                disabled={submitting || !form.user_id}
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Account'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
