import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Search, Edit, Eye, UserX, UserCheck, Loader2 } from 'lucide-react';

export default function AdminCustomers() {
  const { api } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    country: '',
    user_type: 'personal'
  });

  useEffect(() => {
    fetchCustomers();
  }, [statusFilter]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      let url = '/admin/customers?limit=100';
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }
      const response = await api.get(url);
      setCustomers(response.data);
    } catch (error) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/admin/customers', form);
      setShowAddModal(false);
      setForm({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone: '',
        address: '',
        country: '',
        user_type: 'personal'
      });
      toast.success('Customer created successfully');
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create customer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put(`/admin/customers/${selectedCustomer.id}`, {
        status: selectedCustomer.status,
        kyc_status: selectedCustomer.kyc_status,
        notes: selectedCustomer.notes
      });
      setShowEditModal(false);
      toast.success('Customer updated successfully');
      fetchCustomers();
    } catch (error) {
      toast.error('Failed to update customer');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter(c => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        c.email.toLowerCase().includes(search) ||
        c.first_name.toLowerCase().includes(search) ||
        c.last_name.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const getStatusBadge = (status) => {
    const styles = {
      active: 'badge-completed',
      suspended: 'badge-pending',
      frozen: 'badge-rejected',
      closed: 'badge-rejected'
    };
    return `badge ${styles[status] || 'badge-pending'}`;
  };

  const getKycBadge = (status) => {
    const styles = {
      verified: 'badge-completed',
      pending: 'badge-pending',
      rejected: 'badge-rejected'
    };
    return `badge ${styles[status] || 'badge-pending'}`;
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="admin-customers-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white">Customer Management</h1>
          <p className="text-slate-400 mt-1">View and manage customer accounts</p>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="bg-cyan-500 hover:bg-cyan-600 glow-cyan"
          data-testid="create-customer-btn"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Customer
        </Button>
      </div>

      {/* Filters */}
      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-navy-950/50 border-white/10 text-white"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 bg-navy-950/50 border-white/10 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-navy-900 border-white/10">
                <SelectItem value="all" className="text-white hover:bg-white/10">All Status</SelectItem>
                <SelectItem value="active" className="text-white hover:bg-white/10">Active</SelectItem>
                <SelectItem value="suspended" className="text-white hover:bg-white/10">Suspended</SelectItem>
                <SelectItem value="frozen" className="text-white hover:bg-white/10">Frozen</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
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
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>KYC</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer, index) => (
                    <tr key={customer.id} style={{ animationDelay: `${index * 50}ms` }}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-cyan-400">
                              {customer.first_name[0]}{customer.last_name[0]}
                            </span>
                          </div>
                          <span className="text-white">{customer.first_name} {customer.last_name}</span>
                        </div>
                      </td>
                      <td className="text-slate-400">{customer.email}</td>
                      <td className="text-slate-400 capitalize">{customer.user_type}</td>
                      <td><span className={getStatusBadge(customer.status)}>{customer.status}</span></td>
                      <td><span className={getKycBadge(customer.kyc_status)}>{customer.kyc_status}</span></td>
                      <td className="text-slate-400">{new Date(customer.created_at).toLocaleDateString()}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setShowEditModal(true);
                            }}
                            className="text-slate-400 hover:text-white hover:bg-white/5"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Customer Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-navy-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading">Create Customer</DialogTitle>
            <DialogDescription className="text-slate-400">
              Add a new customer to the system
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateCustomer} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">First Name</Label>
                <Input
                  value={form.first_name}
                  onChange={(e) => setForm({...form, first_name: e.target.value})}
                  className="bg-navy-950/50 border-white/10 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Last Name</Label>
                <Input
                  value={form.last_name}
                  onChange={(e) => setForm({...form, last_name: e.target.value})}
                  className="bg-navy-950/50 border-white/10 text-white"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({...form, email: e.target.value})}
                className="bg-navy-950/50 border-white/10 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Password</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({...form, password: e.target.value})}
                className="bg-navy-950/50 border-white/10 text-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({...form, phone: e.target.value})}
                className="bg-navy-950/50 border-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Type</Label>
              <Select value={form.user_type} onValueChange={(value) => setForm({...form, user_type: value})}>
                <SelectTrigger className="bg-navy-950/50 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-navy-900 border-white/10">
                  <SelectItem value="personal" className="text-white hover:bg-white/10">Personal</SelectItem>
                  <SelectItem value="business" className="text-white hover:bg-white/10">Business</SelectItem>
                </SelectContent>
              </Select>
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
                disabled={submitting}
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="bg-navy-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading">Edit Customer</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update customer status and KYC
            </DialogDescription>
          </DialogHeader>
          
          {selectedCustomer && (
            <form onSubmit={handleUpdateCustomer} className="space-y-4 mt-4">
              <div className="p-4 bg-navy-950/50 rounded-lg border border-white/5">
                <p className="text-white font-medium">{selectedCustomer.first_name} {selectedCustomer.last_name}</p>
                <p className="text-slate-400 text-sm">{selectedCustomer.email}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Account Status</Label>
                <Select 
                  value={selectedCustomer.status} 
                  onValueChange={(value) => setSelectedCustomer({...selectedCustomer, status: value})}
                >
                  <SelectTrigger className="bg-navy-950/50 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-navy-900 border-white/10">
                    <SelectItem value="active" className="text-white hover:bg-white/10">Active</SelectItem>
                    <SelectItem value="suspended" className="text-white hover:bg-white/10">Suspended</SelectItem>
                    <SelectItem value="frozen" className="text-white hover:bg-white/10">Frozen</SelectItem>
                    <SelectItem value="closed" className="text-white hover:bg-white/10">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">KYC Status</Label>
                <Select 
                  value={selectedCustomer.kyc_status} 
                  onValueChange={(value) => setSelectedCustomer({...selectedCustomer, kyc_status: value})}
                >
                  <SelectTrigger className="bg-navy-950/50 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-navy-900 border-white/10">
                    <SelectItem value="pending" className="text-white hover:bg-white/10">Pending</SelectItem>
                    <SelectItem value="verified" className="text-white hover:bg-white/10">Verified</SelectItem>
                    <SelectItem value="rejected" className="text-white hover:bg-white/10">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 border-white/10 text-white hover:bg-white/5"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="flex-1 bg-cyan-500 hover:bg-cyan-600"
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Update'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
