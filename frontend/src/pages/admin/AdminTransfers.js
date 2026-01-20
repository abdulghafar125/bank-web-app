import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, Loader2, RefreshCw } from 'lucide-react';

export default function AdminTransfers() {
  const { api } = useAuth();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTransfers();
  }, [statusFilter]);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      let url = '/admin/transfers?limit=100';
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }
      const response = await api.get(url);
      setTransfers(response.data);
    } catch (error) {
      toast.error('Failed to load transfers');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) {
      toast.error('Please select a status');
      return;
    }
    setSubmitting(true);
    try {
      await api.put(`/admin/transfers/${selectedTransfer.id}`, {
        status: newStatus
      });
      setShowUpdateModal(false);
      toast.success('Transfer status updated');
      fetchTransfers();
    } catch (error) {
      toast.error('Failed to update transfer');
    } finally {
      setSubmitting(false);
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
      approved: 'badge-completed',
      rejected: 'badge-rejected',
      cancelled: 'badge-rejected'
    };
    return `badge ${styles[status] || 'badge-pending'}`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-emerald-400" />;
      case 'rejected':
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="admin-transfers-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white">Transfer Management</h1>
          <p className="text-slate-400 mt-1">Process and manage wire transfers</p>
        </div>
        <Button onClick={fetchTransfers} variant="outline" className="border-white/10 text-white hover:bg-white/5">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-navy-950/50 border-white/10 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-navy-900 border-white/10">
                <SelectItem value="all" className="text-white hover:bg-white/10">All Status</SelectItem>
                <SelectItem value="pending" className="text-white hover:bg-white/10">Pending</SelectItem>
                <SelectItem value="processing" className="text-white hover:bg-white/10">Processing</SelectItem>
                <SelectItem value="completed" className="text-white hover:bg-white/10">Completed</SelectItem>
                <SelectItem value="rejected" className="text-white hover:bg-white/10">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transfers Table */}
      <Card className="glass-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
            </div>
          ) : transfers.length === 0 ? (
            <div className="text-center py-20">
              <Clock className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No transfers found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Reference</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th className="text-right">Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((tx, index) => (
                    <tr key={tx.id} style={{ animationDelay: `${index * 50}ms` }}>
                      <td className="text-slate-400">
                        {new Date(tx.created_at).toLocaleDateString()}
                        <br />
                        <span className="text-xs">{new Date(tx.created_at).toLocaleTimeString()}</span>
                      </td>
                      <td className="font-mono text-sm text-slate-400">{tx.reference}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          {tx.amount > 0 ? (
                            <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4 text-red-400" />
                          )}
                          <span className="text-slate-400 capitalize">{tx.transaction_type.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td>
                        <p className="text-white">{tx.description || 'N/A'}</p>
                        <p className="text-slate-500 text-sm">{tx.counterparty}</p>
                      </td>
                      <td className={`table-amount ${tx.amount > 0 ? 'amount-positive' : 'amount-negative'}`}>
                        {formatCurrency(tx.amount, tx.currency)}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(tx.status)}
                          <span className={getStatusBadge(tx.status)}>{tx.status}</span>
                        </div>
                      </td>
                      <td>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTransfer(tx);
                            setNewStatus(tx.status);
                            setShowUpdateModal(true);
                          }}
                          className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                          data-testid={`update-transfer-${tx.id}`}
                        >
                          Update Status
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Status Modal */}
      <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
        <DialogContent className="bg-navy-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading">Update Transfer Status</DialogTitle>
            <DialogDescription className="text-slate-400">
              Change the status of this transfer
            </DialogDescription>
          </DialogHeader>
          
          {selectedTransfer && (
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-navy-950/50 rounded-lg border border-white/5">
                <p className="text-slate-400 text-sm">Reference</p>
                <p className="text-white font-mono">{selectedTransfer.reference}</p>
                <p className="text-slate-400 text-sm mt-2">Amount</p>
                <p className="text-2xl font-heading font-bold text-white">
                  {formatCurrency(selectedTransfer.amount, selectedTransfer.currency)}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-slate-300 text-sm font-medium">New Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="bg-navy-950/50 border-white/10 text-white">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-navy-900 border-white/10">
                    <SelectItem value="pending" className="text-white hover:bg-white/10">Pending</SelectItem>
                    <SelectItem value="processing" className="text-white hover:bg-white/10">Processing</SelectItem>
                    <SelectItem value="approved" className="text-white hover:bg-white/10">Approved</SelectItem>
                    <SelectItem value="completed" className="text-white hover:bg-white/10">Completed</SelectItem>
                    <SelectItem value="rejected" className="text-white hover:bg-white/10">Rejected</SelectItem>
                    <SelectItem value="cancelled" className="text-white hover:bg-white/10">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setShowUpdateModal(false)}
                  className="flex-1 border-white/10 text-white hover:bg-white/5"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateStatus}
                  className="flex-1 bg-cyan-500 hover:bg-cyan-600"
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Update Status'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
