import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../components/ui/input-otp';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { toast } from 'sonner';
import { ArrowUpRight, ArrowRightLeft, Loader2, Shield, CheckCircle } from 'lucide-react';

export default function TransfersPage() {
  const { api, user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [pendingTransfer, setPendingTransfer] = useState(null);
  const [success, setSuccess] = useState(false);

  // Internal transfer form
  const [internalForm, setInternalForm] = useState({
    from_account_id: '',
    to_account_id: '',
    amount: '',
    currency: 'USD',
    description: ''
  });

  // External transfer form
  const [externalForm, setExternalForm] = useState({
    from_account_id: '',
    beneficiary_id: '',
    amount: '',
    currency: 'USD',
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [accountsRes, beneficiariesRes] = await Promise.all([
        api.get('/accounts'),
        api.get('/beneficiaries')
      ]);
      setAccounts(accountsRes.data);
      setBeneficiaries(beneficiariesRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const handleInternalTransfer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/transfers/internal', {
        ...internalForm,
        amount: parseFloat(internalForm.amount)
      });
      setSuccess(true);
      toast.success('Transfer completed successfully');
      setInternalForm({
        from_account_id: '',
        to_account_id: '',
        amount: '',
        currency: 'USD',
        description: ''
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Transfer failed');
    } finally {
      setSubmitting(false);
    }
  };

  const initiateExternalTransfer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Request OTP first
      await api.post('/auth/request-otp', {
        email: user.email,
        purpose: 'transfer'
      });
      setPendingTransfer(externalForm);
      setShowOTPModal(true);
      toast.success('OTP sent to your email');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExternalTransfer = async () => {
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/transfers/external', {
        ...pendingTransfer,
        amount: parseFloat(pendingTransfer.amount),
        otp: otp
      });
      setSuccess(true);
      setShowOTPModal(false);
      setOtp('');
      toast.success('Wire transfer request submitted');
      setExternalForm({
        from_account_id: '',
        beneficiary_id: '',
        amount: '',
        currency: 'USD',
        description: ''
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Transfer failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center h-96 animate-fade-in">
        <Card className="glass-card max-w-md w-full text-center p-8">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-white mb-2">Transfer Initiated</h2>
          <p className="text-slate-400 mb-6">
            Your transfer has been submitted successfully. You can track its status in your transaction history.
          </p>
          <Button 
            onClick={() => setSuccess(false)}
            className="bg-cyan-500 hover:bg-cyan-600"
          >
            Make Another Transfer
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="transfers-page">
      <div>
        <h1 className="text-3xl font-heading font-bold text-white">Transfers</h1>
        <p className="text-slate-400 mt-1">Send money internally or to external accounts</p>
      </div>

      <Tabs defaultValue="internal" className="w-full">
        <TabsList className="bg-navy-900/50 border border-white/5">
          <TabsTrigger value="internal" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Internal Transfer
          </TabsTrigger>
          <TabsTrigger value="external" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <ArrowUpRight className="mr-2 h-4 w-4" />
            External Wire
          </TabsTrigger>
        </TabsList>

        <TabsContent value="internal" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white">Internal Transfer</CardTitle>
              <p className="text-slate-400 text-sm">Transfer between your accounts or to other Prominence Bank customers</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInternalTransfer} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-300">From Account</Label>
                    <Select 
                      value={internalForm.from_account_id} 
                      onValueChange={(value) => setInternalForm({...internalForm, from_account_id: value})}
                    >
                      <SelectTrigger className="bg-navy-950/50 border-white/10 text-white" data-testid="from-account-select">
                        <SelectValue placeholder="Select source account" />
                      </SelectTrigger>
                      <SelectContent className="bg-navy-900 border-white/10">
                        {accounts.map(acc => (
                          <SelectItem key={acc.id} value={acc.id} className="text-white hover:bg-white/10">
                            {acc.account_type} •••• {acc.account_number.slice(-4)} - {formatCurrency(acc.available_balance, acc.currency)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">To Account</Label>
                    <Select 
                      value={internalForm.to_account_id} 
                      onValueChange={(value) => setInternalForm({...internalForm, to_account_id: value})}
                    >
                      <SelectTrigger className="bg-navy-950/50 border-white/10 text-white" data-testid="to-account-select">
                        <SelectValue placeholder="Select destination account" />
                      </SelectTrigger>
                      <SelectContent className="bg-navy-900 border-white/10">
                        {accounts.filter(acc => acc.id !== internalForm.from_account_id).map(acc => (
                          <SelectItem key={acc.id} value={acc.id} className="text-white hover:bg-white/10">
                            {acc.account_type} •••• {acc.account_number.slice(-4)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={internalForm.amount}
                      onChange={(e) => setInternalForm({...internalForm, amount: e.target.value})}
                      className="bg-navy-950/50 border-white/10 text-white text-lg font-mono"
                      required
                      data-testid="amount-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Currency</Label>
                    <Select 
                      value={internalForm.currency} 
                      onValueChange={(value) => setInternalForm({...internalForm, currency: value})}
                    >
                      <SelectTrigger className="bg-navy-950/50 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-navy-900 border-white/10">
                        <SelectItem value="USD" className="text-white hover:bg-white/10">USD</SelectItem>
                        <SelectItem value="EUR" className="text-white hover:bg-white/10">EUR</SelectItem>
                        <SelectItem value="GBP" className="text-white hover:bg-white/10">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Description (Optional)</Label>
                  <Input
                    placeholder="Payment reference or note"
                    value={internalForm.description}
                    onChange={(e) => setInternalForm({...internalForm, description: e.target.value})}
                    className="bg-navy-950/50 border-white/10 text-white"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-cyan-500 hover:bg-cyan-600 glow-cyan py-3"
                  disabled={submitting || !internalForm.from_account_id || !internalForm.to_account_id || !internalForm.amount}
                  data-testid="internal-transfer-btn"
                >
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Transfer Now'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="external" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white">External Wire Transfer</CardTitle>
              <p className="text-slate-400 text-sm">Send money to external bank accounts (requires OTP verification)</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={initiateExternalTransfer} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-300">From Account</Label>
                    <Select 
                      value={externalForm.from_account_id} 
                      onValueChange={(value) => setExternalForm({...externalForm, from_account_id: value})}
                    >
                      <SelectTrigger className="bg-navy-950/50 border-white/10 text-white" data-testid="external-from-account">
                        <SelectValue placeholder="Select source account" />
                      </SelectTrigger>
                      <SelectContent className="bg-navy-900 border-white/10">
                        {accounts.map(acc => (
                          <SelectItem key={acc.id} value={acc.id} className="text-white hover:bg-white/10">
                            {acc.account_type} •••• {acc.account_number.slice(-4)} - {formatCurrency(acc.available_balance, acc.currency)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Beneficiary</Label>
                    <Select 
                      value={externalForm.beneficiary_id} 
                      onValueChange={(value) => setExternalForm({...externalForm, beneficiary_id: value})}
                    >
                      <SelectTrigger className="bg-navy-950/50 border-white/10 text-white" data-testid="beneficiary-select">
                        <SelectValue placeholder="Select beneficiary" />
                      </SelectTrigger>
                      <SelectContent className="bg-navy-900 border-white/10">
                        {beneficiaries.map(ben => (
                          <SelectItem key={ben.id} value={ben.id} className="text-white hover:bg-white/10">
                            {ben.name} - {ben.bank_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={externalForm.amount}
                      onChange={(e) => setExternalForm({...externalForm, amount: e.target.value})}
                      className="bg-navy-950/50 border-white/10 text-white text-lg font-mono"
                      required
                      data-testid="external-amount-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Currency</Label>
                    <Select 
                      value={externalForm.currency} 
                      onValueChange={(value) => setExternalForm({...externalForm, currency: value})}
                    >
                      <SelectTrigger className="bg-navy-950/50 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-navy-900 border-white/10">
                        <SelectItem value="USD" className="text-white hover:bg-white/10">USD</SelectItem>
                        <SelectItem value="EUR" className="text-white hover:bg-white/10">EUR</SelectItem>
                        <SelectItem value="GBP" className="text-white hover:bg-white/10">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">Description (Optional)</Label>
                  <Input
                    placeholder="Payment reference or note"
                    value={externalForm.description}
                    onChange={(e) => setExternalForm({...externalForm, description: e.target.value})}
                    className="bg-navy-950/50 border-white/10 text-white"
                  />
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-yellow-400 text-sm flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    External wire transfers require OTP verification and may take 3-5 business days to process.
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-cyan-500 hover:bg-cyan-600 glow-cyan py-3"
                  disabled={submitting || !externalForm.from_account_id || !externalForm.beneficiary_id || !externalForm.amount}
                  data-testid="external-transfer-btn"
                >
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Continue with OTP Verification'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* OTP Modal */}
      <Dialog open={showOTPModal} onOpenChange={setShowOTPModal}>
        <DialogContent className="bg-navy-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading">Verify Transfer</DialogTitle>
            <DialogDescription className="text-slate-400">
              Enter the 6-digit OTP sent to your email to confirm this wire transfer.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-cyan-400" />
              </div>
              <p className="text-white font-medium">
                Transfer Amount: {pendingTransfer && formatCurrency(parseFloat(pendingTransfer.amount), pendingTransfer.currency)}
              </p>
            </div>

            <div className="flex justify-center mb-6">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(value) => setOtp(value)}
                data-testid="transfer-otp-input"
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
              onClick={handleExternalTransfer}
              className="w-full bg-cyan-500 hover:bg-cyan-600 glow-cyan"
              disabled={submitting || otp.length !== 6}
              data-testid="confirm-transfer-btn"
            >
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm Transfer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
