import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../components/ui/input-otp';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Building2, User, Loader2, Shield } from 'lucide-react';

export default function BeneficiariesPage() {
  const { api, user } = useAuth();
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [otp, setOtp] = useState('');
  const [pendingBeneficiary, setPendingBeneficiary] = useState(null);

  const [form, setForm] = useState({
    name: '',
    bank_name: '',
    account_number: '',
    routing_number: '',
    swift_code: '',
    beneficiary_type: 'external'
  });

  useEffect(() => {
    fetchBeneficiaries();
  }, []);

  const fetchBeneficiaries = async () => {
    try {
      const response = await api.get('/beneficiaries');
      setBeneficiaries(response.data);
    } catch (error) {
      toast.error('Failed to load beneficiaries');
    } finally {
      setLoading(false);
    }
  };

  const initiateAddBeneficiary = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Request OTP first
      await api.post('/auth/request-otp', {
        email: user.email,
        purpose: 'beneficiary'
      });
      setPendingBeneficiary(form);
      setShowAddModal(false);
      setShowOTPModal(true);
      toast.success('OTP sent to your email');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddBeneficiary = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/beneficiaries', {
        ...pendingBeneficiary,
        otp: otp
      });
      setShowOTPModal(false);
      setOtp('');
      setForm({
        name: '',
        bank_name: '',
        account_number: '',
        routing_number: '',
        swift_code: '',
        beneficiary_type: 'external'
      });
      toast.success('Beneficiary added successfully');
      fetchBeneficiaries();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add beneficiary');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this beneficiary?')) return;
    
    try {
      await api.delete(`/beneficiaries/${id}`);
      toast.success('Beneficiary deleted');
      fetchBeneficiaries();
    } catch (error) {
      toast.error('Failed to delete beneficiary');
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
    <div className="space-y-6 animate-fade-in" data-testid="beneficiaries-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white">Beneficiaries</h1>
          <p className="text-slate-400 mt-1">Manage your transfer recipients</p>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="bg-cyan-500 hover:bg-cyan-600 glow-cyan"
          data-testid="add-beneficiary-btn"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Beneficiary
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {beneficiaries.map((ben, index) => (
          <Card 
            key={ben.id} 
            className="glass-card card-hover"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  ben.beneficiary_type === 'internal' ? 'bg-cyan-500/20' : 'bg-purple-500/20'
                }`}>
                  {ben.beneficiary_type === 'internal' ? (
                    <User className="h-6 w-6 text-cyan-400" />
                  ) : (
                    <Building2 className="h-6 w-6 text-purple-400" />
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(ben.id)}
                  className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                  data-testid={`delete-beneficiary-${ben.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <h3 className="text-lg font-semibold text-white mb-1">{ben.name}</h3>
              <p className="text-slate-400 text-sm mb-4">{ben.bank_name || 'Prominence Bank'}</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Account</span>
                  <span className="text-white font-mono">•••• {ben.account_number.slice(-4)}</span>
                </div>
                {ben.swift_code && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">SWIFT</span>
                    <span className="text-white font-mono">{ben.swift_code}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Type</span>
                  <span className={`badge ${ben.beneficiary_type === 'internal' ? 'badge-completed' : 'badge-processing'}`}>
                    {ben.beneficiary_type}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {beneficiaries.length === 0 && (
          <Card className="glass-card col-span-full">
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No beneficiaries added yet</p>
              <Button 
                onClick={() => setShowAddModal(true)}
                className="mt-4 bg-cyan-500 hover:bg-cyan-600"
              >
                Add Your First Beneficiary
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Beneficiary Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-navy-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading">Add Beneficiary</DialogTitle>
            <DialogDescription className="text-slate-400">
              Add a new recipient for your transfers. OTP verification required.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={initiateAddBeneficiary} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Beneficiary Name</Label>
              <Input
                placeholder="Full name or company name"
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                className="bg-navy-950/50 border-white/10 text-white"
                required
                data-testid="beneficiary-name-input"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Type</Label>
              <Select 
                value={form.beneficiary_type} 
                onValueChange={(value) => setForm({...form, beneficiary_type: value})}
              >
                <SelectTrigger className="bg-navy-950/50 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-navy-900 border-white/10">
                  <SelectItem value="internal" className="text-white hover:bg-white/10">Internal (Prominence Bank)</SelectItem>
                  <SelectItem value="external" className="text-white hover:bg-white/10">External (Other Bank)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.beneficiary_type === 'external' && (
              <div className="space-y-2">
                <Label className="text-slate-300">Bank Name</Label>
                <Input
                  placeholder="Bank name"
                  value={form.bank_name}
                  onChange={(e) => setForm({...form, bank_name: e.target.value})}
                  className="bg-navy-950/50 border-white/10 text-white"
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-slate-300">Account Number</Label>
              <Input
                placeholder="Account number"
                value={form.account_number}
                onChange={(e) => setForm({...form, account_number: e.target.value})}
                className="bg-navy-950/50 border-white/10 text-white"
                required
                data-testid="beneficiary-account-input"
              />
            </div>

            {form.beneficiary_type === 'external' && (
              <>
                <div className="space-y-2">
                  <Label className="text-slate-300">Routing Number</Label>
                  <Input
                    placeholder="Routing number (optional)"
                    value={form.routing_number}
                    onChange={(e) => setForm({...form, routing_number: e.target.value})}
                    className="bg-navy-950/50 border-white/10 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">SWIFT Code</Label>
                  <Input
                    placeholder="SWIFT/BIC code"
                    value={form.swift_code}
                    onChange={(e) => setForm({...form, swift_code: e.target.value})}
                    className="bg-navy-950/50 border-white/10 text-white"
                  />
                </div>
              </>
            )}

            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mt-4">
              <p className="text-yellow-400 text-sm flex items-center gap-2">
                <Shield className="h-4 w-4" />
                OTP verification required to add beneficiary
              </p>
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
                data-testid="submit-beneficiary-btn"
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Continue'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* OTP Modal */}
      <Dialog open={showOTPModal} onOpenChange={setShowOTPModal}>
        <DialogContent className="bg-navy-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading">Verify OTP</DialogTitle>
            <DialogDescription className="text-slate-400">
              Enter the 6-digit OTP sent to your email to add this beneficiary.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-cyan-400" />
              </div>
              <p className="text-white font-medium">
                Adding: {pendingBeneficiary?.name}
              </p>
            </div>

            <div className="flex justify-center mb-6">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(value) => setOtp(value)}
                data-testid="beneficiary-otp-input"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className="bg-navy-950/50 border-white/10 text-white text-xl" />
                  <InputOTPSlot index={1} className="bg-navy-950/50 border-white/10 text-white text-xl" />
                  <InputOTPSlot index={2} className="bg-navy-950/50 border-white/10 text-white text-xl" />
                  <InputOTPSlot index={3} className="bg-navy-950/50 border-white/10 text-white text-xl" />
                  <InputOTPSlot index={4} className="bg-navy-950/50 border-white/10 text-white text-xl" />
                  <InputOTPSlot index={5} className="bg-navy-950/50 border-white/10 text-white text-xl" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button 
              onClick={handleAddBeneficiary}
              className="w-full bg-cyan-500 hover:bg-cyan-600 glow-cyan"
              disabled={submitting || otp.length !== 6}
              data-testid="confirm-beneficiary-btn"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm & Add Beneficiary'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
