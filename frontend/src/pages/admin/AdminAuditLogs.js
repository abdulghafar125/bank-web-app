import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { ScrollArea } from '../../components/ui/scroll-area';
import { toast } from 'sonner';
import { Search, Clock, User, FileText, Loader2, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

export default function AdminAuditLogs() {
  const { api } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const limit = 50;

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let url = `/admin/audit-logs?skip=${page * limit}&limit=${limit}`;
      if (actionFilter !== 'all') {
        url += `&action=${actionFilter}`;
      }
      const response = await api.get(url);
      setLogs(response.data);
      setHasMore(response.data.length === limit);
    } catch (error) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        log.action.toLowerCase().includes(search) ||
        log.user_id.toLowerCase().includes(search) ||
        JSON.stringify(log.details).toLowerCase().includes(search)
      );
    }
    return true;
  });

  const getActionColor = (action) => {
    if (action.includes('created') || action.includes('registered')) return 'text-emerald-400';
    if (action.includes('updated') || action.includes('transfer')) return 'text-cyan-400';
    if (action.includes('deleted') || action.includes('redacted')) return 'text-red-400';
    if (action.includes('login')) return 'text-blue-400';
    return 'text-slate-400';
  };

  const getActionBadge = (action) => {
    if (action.includes('created') || action.includes('registered')) return 'badge-completed';
    if (action.includes('deleted') || action.includes('redacted')) return 'badge-rejected';
    if (action.includes('login')) return 'badge-processing';
    return 'badge-pending';
  };

  const actionTypes = [
    'all',
    'user_registered',
    'login_successful',
    'login_otp_requested',
    'customer_created_by_admin',
    'customer_updated',
    'account_created',
    'internal_transfer',
    'external_transfer_initiated',
    'transfer_status_updated',
    'beneficiary_created',
    'beneficiary_deleted',
    'instrument_created',
    'instrument_deleted',
    'transaction_redacted',
    'settings_updated',
    'funding_instructions_updated'
  ];

  return (
    <div className="space-y-6 animate-fade-in" data-testid="admin-audit-logs-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white">Audit Logs</h1>
          <p className="text-slate-400 mt-1">Track all system activities and changes</p>
        </div>
        <Button onClick={fetchLogs} variant="outline" className="border-white/10 text-white hover:bg-white/5">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-navy-950/50 border-white/10 text-white"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-64 bg-navy-950/50 border-white/10 text-white">
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent className="bg-navy-900 border-white/10 max-h-60">
                {actionTypes.map(action => (
                  <SelectItem key={action} value={action} className="text-white hover:bg-white/10">
                    {action === 'all' ? 'All Actions' : action.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="glass-card">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-20">
              <FileText className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>User ID</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, index) => (
                    <tr key={log.id} style={{ animationDelay: `${index * 30}ms` }}>
                      <td className="text-slate-400">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <div>
                            <p>{new Date(log.timestamp).toLocaleDateString()}</p>
                            <p className="text-xs">{new Date(log.timestamp).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getActionBadge(log.action)}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-500" />
                          <span className="text-white font-mono text-sm">
                            {log.user_id.substring(0, 8)}...
                          </span>
                        </div>
                      </td>
                      <td>
                        <ScrollArea className="max-w-md">
                          <pre className="text-xs text-slate-400 whitespace-pre-wrap">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </ScrollArea>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {filteredLogs.length > 0 && (
            <div className="flex items-center justify-between p-4 border-t border-white/5">
              <p className="text-slate-400 text-sm">
                Showing {page * limit + 1} - {page * limit + filteredLogs.length} logs
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
