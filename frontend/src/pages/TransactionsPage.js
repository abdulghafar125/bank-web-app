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
  ChevronRight,
  FileText,
  FileSpreadsheet,
  Printer
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      processing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
      approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.pending}`;
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

  const exportToCSV = () => {
    const headers = ['Date', 'Time', 'Description', 'Reference', 'Type', 'Counterparty', 'Amount', 'Currency', 'Status'];
    const rows = filteredTransactions.map(tx => {
      const { date, time } = formatDate(tx.created_at);
      return [
        date,
        time,
        tx.description || '',
        tx.reference,
        tx.transaction_type,
        tx.counterparty || '',
        tx.amount,
        tx.currency,
        tx.status
      ];
    });
    
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prominence_bank_statement_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Statement exported as CSV');
  };

  const printStatement = () => {
    const account = accounts.find(a => a.id === selectedAccount);
    const printContent = `
      <html>
        <head>
          <title>Prominence Bank Statement</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
            .header { border-bottom: 2px solid #00a8e8; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #0a1628; }
            .account-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #0a1628; color: white; padding: 12px; text-align: left; }
            td { padding: 12px; border-bottom: 1px solid #e0e0e0; }
            .amount-positive { color: #10b981; }
            .amount-negative { color: #ef4444; }
            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">PROMINENCE BANK</div>
            <p>Account Statement</p>
          </div>
          <div class="account-info">
            <p><strong>Account:</strong> ${account?.account_type.toUpperCase()} - ${account?.account_number}</p>
            <p><strong>Currency:</strong> ${account?.currency}</p>
            <p><strong>Statement Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Reference</th>
                <th style="text-align: right">Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredTransactions.map(tx => {
                const { date } = formatDate(tx.created_at);
                return `
                  <tr>
                    <td>${date}</td>
                    <td>${tx.description || tx.transaction_type}</td>
                    <td>${tx.reference}</td>
                    <td style="text-align: right" class="${tx.amount > 0 ? 'amount-positive' : 'amount-negative'}">
                      ${tx.amount > 0 ? '+' : ''}${formatCurrency(tx.amount, tx.currency)}
                    </td>
                    <td>${tx.status}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>Prominence Bank - Smart Banking</p>
            <p>This is a computer-generated statement and does not require a signature.</p>
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const selectedAccountData = accounts.find(a => a.id === selectedAccount);

  return (
    <div className="space-y-6 animate-fade-in" data-testid="transactions-page">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-white">Transaction History</h1>
          <p className="text-slate-400 mt-1">View, search, and export your transaction records</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={printStatement}
            variant="outline"
            className="border-white/10 text-white hover:bg-white/5"
            disabled={filteredTransactions.length === 0}
          >
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button 
            onClick={exportToCSV}
            className="bg-cyan-500 hover:bg-cyan-600"
            disabled={filteredTransactions.length === 0}
            data-testid="export-btn"
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Account Selector & Summary */}
      {selectedAccountData && (
        <Card className="bg-gradient-to-r from-navy-900 to-navy-800 border-white/10">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Select value={selectedAccount} onValueChange={(val) => { setSelectedAccount(val); setPage(0); }}>
                  <SelectTrigger className="w-64 bg-navy-950/50 border-white/10 text-white" data-testid="account-filter">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent className="bg-navy-900 border-white/10">
                    {accounts.map(acc => (
                      <SelectItem key={acc.id} value={acc.id} className="text-white hover:bg-white/10">
                        {acc.account_type.toUpperCase()} •••• {acc.account_number.slice(-4)} ({acc.currency})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <p className="text-slate-500">Available Balance</p>
                  <p className="text-xl font-heading font-bold text-white">
                    {formatCurrency(selectedAccountData.available_balance, selectedAccountData.currency)}
                  </p>
                </div>
                {selectedAccountData.transit_balance > 0 && (
                  <div>
                    <p className="text-slate-500">In Transit</p>
                    <p className="text-lg font-heading font-bold text-yellow-400">
                      {formatCurrency(selectedAccountData.transit_balance, selectedAccountData.currency)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Transactions List */}
      <Card className="glass-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-20">
              <FileText className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No transactions found</p>
              <p className="text-slate-500 text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left p-4 text-slate-500 font-medium text-sm">Date</th>
                      <th className="text-left p-4 text-slate-500 font-medium text-sm">Description</th>
                      <th className="text-left p-4 text-slate-500 font-medium text-sm">Reference</th>
                      <th className="text-right p-4 text-slate-500 font-medium text-sm">Amount</th>
                      <th className="text-center p-4 text-slate-500 font-medium text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx, index) => {
                      const { date, time } = formatDate(tx.created_at);
                      return (
                        <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors" style={{ animationDelay: `${index * 30}ms` }}>
                          <td className="p-4">
                            <p className="text-white">{date}</p>
                            <p className="text-slate-500 text-sm">{time}</p>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.amount > 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                                {tx.amount > 0 ? <ArrowDownLeft className="h-4 w-4 text-emerald-400" /> : <ArrowUpRight className="h-4 w-4 text-red-400" />}
                              </div>
                              <div>
                                <p className="text-white">{tx.description || tx.transaction_type.replace('_', ' ')}</p>
                                {tx.counterparty && <p className="text-slate-500 text-sm">{tx.counterparty}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="text-slate-400 font-mono text-sm">{tx.reference}</p>
                          </td>
                          <td className="p-4 text-right">
                            <p className={`font-heading font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-white'}`}>
                              {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount, tx.currency)}
                            </p>
                          </td>
                          <td className="p-4 text-center">
                            <span className={getStatusBadge(tx.status)}>{tx.status}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile List */}
              <div className="md:hidden divide-y divide-white/5">
                {filteredTransactions.map((tx, index) => {
                  const { date, time } = formatDate(tx.created_at);
                  return (
                    <div key={tx.id} className="p-4" style={{ animationDelay: `${index * 30}ms` }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.amount > 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                            {tx.amount > 0 ? <ArrowDownLeft className="h-5 w-5 text-emerald-400" /> : <ArrowUpRight className="h-5 w-5 text-red-400" />}
                          </div>
                          <div>
                            <p className="text-white font-medium">{tx.description || tx.transaction_type.replace('_', ' ')}</p>
                            <p className="text-slate-500 text-sm">{date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-heading font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-white'}`}>
                            {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount, tx.currency)}
                          </p>
                          <span className={getStatusBadge(tx.status)}>{tx.status}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
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
