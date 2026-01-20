import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { toast } from 'sonner';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  CalendarIcon, 
  Download, 
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';

export default function TransactionsPage() {
  const { api } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState(null);
  const [dateTo, setDateTo] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const limit = 20;

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      fetchTransactions();
    }
  }, [selectedAccount, statusFilter, page]);

  const fetchAccounts = async () => {
    try {
      const response = await api.get('/accounts');
      setAccounts(response.data);
      if (response.data.length > 0) {
        setSelectedAccount(response.data[0].id);
      }
    } catch (error) {
      toast.error('Failed to load accounts');
    }
  };

  const fetchTransactions = async () => {
    if (!selectedAccount) return;
    setLoading(true);
    try {
      let url = `/accounts/${selectedAccount}/transactions?skip=${page * limit}&limit=${limit}`;
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }
      if (dateFrom) {
        url += `&from_date=${dateFrom.toISOString()}`;
      }
      if (dateTo) {
        url += `&to_date=${dateTo.toISOString()}`;
      }
      
      const response = await api.get(url);
      setTransactions(response.data);
      setHasMore(response.data.length === limit);
    } catch (error) {
      toast.error('Failed to load transactions');
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

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'badge-completed',
      pending: 'badge-pending',
      processing: 'badge-processing',
      rejected: 'badge-rejected',
      approved: 'badge-completed',
      cancelled: 'badge-rejected'
    };
    return `badge ${styles[status] || 'badge-pending'}`;
  };

  const filteredTransactions = transactions.filter(tx => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        tx.description?.toLowerCase().includes(search) ||
        tx.reference?.toLowerCase().includes(search) ||
        tx.counterparty?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const exportTransactions = () => {
    // Create CSV content
    const headers = ['Date', 'Description', 'Reference', 'Type', 'Amount', 'Currency', 'Status'];
    const rows = filteredTransactions.map(tx => [
      new Date(tx.created_at).toLocaleDateString(),
      tx.description || '',
      tx.reference,
      tx.transaction_type,
      tx.amount,
      tx.currency,
      tx.status
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Transactions exported');
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="transactions-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white">Transaction History</h1>
          <p className="text-slate-400 mt-1">View and export your transaction records</p>
        </div>
        <Button 
          onClick={exportTransactions}
          className="bg-cyan-500 hover:bg-cyan-600"
          disabled={filteredTransactions.length === 0}
          data-testid="export-btn"
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger className="bg-navy-950/50 border-white/10 text-white" data-testid="account-filter">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent className="bg-navy-900 border-white/10">
                  {accounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id} className="text-white hover:bg-white/10">
                      {acc.account_type} •••• {acc.account_number.slice(-4)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-navy-950/50 border-white/10 text-white"
                data-testid="search-input"
              />
            </div>

            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-navy-950/50 border-white/10 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-navy-900 border-white/10">
                  <SelectItem value="all" className="text-white hover:bg-white/10">All Status</SelectItem>
                  <SelectItem value="completed" className="text-white hover:bg-white/10">Completed</SelectItem>
                  <SelectItem value="pending" className="text-white hover:bg-white/10">Pending</SelectItem>
                  <SelectItem value="processing" className="text-white hover:bg-white/10">Processing</SelectItem>
                  <SelectItem value="rejected" className="text-white hover:bg-white/10">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, 'MMM d, yyyy') : 'From Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-navy-900 border-white/10" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  className="rounded-md border-white/10"
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, 'MMM d, yyyy') : 'To Date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-navy-900 border-white/10" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  className="rounded-md border-white/10"
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card className="glass-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-20">
              <Filter className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Reference</th>
                    <th>Type</th>
                    <th className="text-right">Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx, index) => (
                    <tr key={tx.id} style={{ animationDelay: `${index * 50}ms` }}>
                      <td className="text-slate-400">
                        {new Date(tx.created_at).toLocaleDateString()}
                        <br />
                        <span className="text-xs">{new Date(tx.created_at).toLocaleTimeString()}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            tx.amount > 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'
                          }`}>
                            {tx.amount > 0 ? (
                              <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 text-red-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-white">{tx.description || 'Transaction'}</p>
                            <p className="text-slate-500 text-sm">{tx.counterparty}</p>
                          </div>
                        </div>
                      </td>
                      <td className="font-mono text-sm text-slate-400">{tx.reference}</td>
                      <td className="text-slate-400 capitalize">{tx.transaction_type.replace('_', ' ')}</td>
                      <td className={`table-amount ${tx.amount > 0 ? 'amount-positive' : 'amount-negative'}`}>
                        {tx.amount > 0 ? '+' : '-'}{formatCurrency(tx.amount, tx.currency)}
                      </td>
                      <td>
                        <span className={getStatusBadge(tx.status)}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {filteredTransactions.length > 0 && (
            <div className="flex items-center justify-between p-4 border-t border-white/5">
              <p className="text-slate-400 text-sm">
                Showing {page * limit + 1} - {page * limit + filteredTransactions.length} transactions
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="border-white/10 text-white hover:bg-white/5"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={!hasMore}
                  className="border-white/10 text-white hover:bg-white/5"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
