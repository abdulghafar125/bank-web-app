import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { Plus, FileText, Trash2, Eye, Loader2, DollarSign } from 'lucide-react';

export default function AdminInstruments() {
  const { api } = useAuth();
  const [instruments, setInstruments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '',
    instrument_type: 'KTT',
    content: '',
    amount: '',
    currency: 'USD',
    visibility: 'all'
  });

  useEffect(() => {
    fetchInstruments();
  }, []);

  const fetchInstruments = async () => {
    try {
      const response = await api.get('/admin/instruments');
      setInstruments(response.data);
    } catch (error) {
      toast.error('Failed to load instruments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/admin/instruments', {
        ...form,
        amount: form.amount ? parseFloat(form.amount) : null
      });
      setShowAddModal(false);
      setForm({
        title: '',
        instrument_type: 'KTT',
        content: '',
        amount: '',
        currency: 'USD',
        visibility: 'all'
      });
      toast.success('Instrument created successfully');
      fetchInstruments();
    } catch (error) {
      toast.error('Failed to create instrument');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this instrument?')) return;
    
    try {
      await api.delete(`/admin/instruments/${id}`);
      toast.success('Instrument deleted');
      fetchInstruments();
    } catch (error) {
      toast.error('Failed to delete instrument');
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    if (!amount) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getInstrumentTemplate = (type) => {
    if (type === 'KTT') {
      return `PROMINENCE BANK
SWIFT: PROMGB2L

KEY TESTED TELEX

TO: [BENEFICIARY BANK]
DATE: ${new Date().toLocaleDateString()}
REFERENCE: KTT-${new Date().getFullYear()}-XXX

THIS IS TO CONFIRM THAT WE HOLD ON ACCOUNT OF OUR CLIENT:

ACCOUNT HOLDER: [Client Name]
ACCOUNT NUMBER: [Account Number]
BALANCE: [Amount]

THIS CONFIRMATION IS ISSUED AT THE REQUEST OF OUR ABOVE-MENTIONED CLIENT 
FOR YOUR REFERENCE PURPOSES ONLY.

THIS KEY TESTED TELEX IS SUBJECT TO OUR STANDARD TERMS AND CONDITIONS.

AUTHORIZED SIGNATURES:
_____________________    _____________________
BANK OFFICER             COMPLIANCE OFFICER

PROMINENCE BANK - SMART BANKING`;
    }
    return '';
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="admin-instruments-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white">Bank Instruments</h1>
          <p className="text-slate-400 mt-1">Create and manage banking documents (KTT, CD, etc.)</p>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="bg-cyan-500 hover:bg-cyan-600 glow-cyan"
          data-testid="create-instrument-btn"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Instrument
        </Button>
      </div>

      {/* Instruments Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {instruments.map((inst, index) => (
            <Card 
              key={inst.id} 
              className="glass-card card-hover"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <FileText className="h-6 w-6 text-purple-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedInstrument(inst);
                        setShowViewModal(true);
                      }}
                      className="text-slate-400 hover:text-white hover:bg-white/5"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(inst.id)}
                      className="text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <span className="badge badge-completed">{inst.instrument_type}</span>
                <h3 className="text-lg font-semibold text-white mt-2">{inst.title}</h3>
                
                {inst.amount && (
                  <div className="flex items-center gap-2 mt-3">
                    <DollarSign className="h-4 w-4 text-cyan-400" />
                    <span className="text-xl font-heading font-bold text-white">
                      {formatCurrency(inst.amount, inst.currency)}
                    </span>
                  </div>
                )}
                
                <p className="text-slate-400 text-sm line-clamp-2 mt-3">
                  {inst.content.substring(0, 100)}...
                </p>
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                  <span className="text-slate-500 text-sm">
                    {new Date(inst.created_at).toLocaleDateString()}
                  </span>
                  <span className="badge badge-processing">{inst.visibility}</span>
                </div>
              </CardContent>
            </Card>
          ))}

          {instruments.length === 0 && (
            <Card className="glass-card col-span-full">
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">No instruments created yet</p>
                <Button 
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 bg-cyan-500 hover:bg-cyan-600"
                >
                  Create Your First Instrument
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Create Instrument Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-navy-900 border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading">Create Bank Instrument</DialogTitle>
            <DialogDescription className="text-slate-400">
              Create a new banking document or certificate
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreate} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Type</Label>
                <Select 
                  value={form.instrument_type} 
                  onValueChange={(value) => {
                    setForm({
                      ...form, 
                      instrument_type: value,
                      content: getInstrumentTemplate(value)
                    });
                  }}
                >
                  <SelectTrigger className="bg-navy-950/50 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-navy-900 border-white/10">
                    <SelectItem value="KTT" className="text-white hover:bg-white/10">Key Tested Telex (KTT)</SelectItem>
                    <SelectItem value="CD" className="text-white hover:bg-white/10">Certificate of Deposit</SelectItem>
                    <SelectItem value="endorsement" className="text-white hover:bg-white/10">Bank Endorsement</SelectItem>
                    <SelectItem value="guarantee" className="text-white hover:bg-white/10">Bank Guarantee</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Visibility</Label>
                <Select 
                  value={form.visibility} 
                  onValueChange={(value) => setForm({...form, visibility: value})}
                >
                  <SelectTrigger className="bg-navy-950/50 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-navy-900 border-white/10">
                    <SelectItem value="all" className="text-white hover:bg-white/10">All Clients</SelectItem>
                    <SelectItem value="specific" className="text-white hover:bg-white/10">Specific Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({...form, title: e.target.value})}
                placeholder="e.g., Key Tested Telex - Trade Finance"
                className="bg-navy-950/50 border-white/10 text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Amount (Optional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({...form, amount: e.target.value})}
                  placeholder="0.00"
                  className="bg-navy-950/50 border-white/10 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Currency</Label>
                <Select value={form.currency} onValueChange={(value) => setForm({...form, currency: value})}>
                  <SelectTrigger className="bg-navy-950/50 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-navy-900 border-white/10">
                    <SelectItem value="USD" className="text-white hover:bg-white/10">USD</SelectItem>
                    <SelectItem value="EUR" className="text-white hover:bg-white/10">EUR</SelectItem>
                    <SelectItem value="GBP" className="text-white hover:bg-white/10">GBP</SelectItem>
                    <SelectItem value="CHF" className="text-white hover:bg-white/10">CHF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Document Content</Label>
              <Textarea
                value={form.content}
                onChange={(e) => setForm({...form, content: e.target.value})}
                placeholder="Enter the full document content..."
                className="bg-navy-950/50 border-white/10 text-white min-h-[300px] font-mono text-sm"
                required
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
                disabled={submitting}
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Create Instrument'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Instrument Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="bg-navy-900 border-white/10 text-white max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-purple-400" />
              </div>
              {selectedInstrument?.title}
            </DialogTitle>
          </DialogHeader>
          
          {selectedInstrument && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                <div>
                  <span className="badge badge-completed mr-2">{selectedInstrument.instrument_type}</span>
                  <span className="text-slate-400 text-sm">
                    Created: {new Date(selectedInstrument.created_at).toLocaleDateString()}
                  </span>
                </div>
                {selectedInstrument.amount && (
                  <div className="text-right">
                    <p className="text-slate-400 text-sm">Amount</p>
                    <p className="text-2xl font-heading font-bold text-white">
                      {formatCurrency(selectedInstrument.amount, selectedInstrument.currency)}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="h-[400px] overflow-y-auto rounded-lg bg-navy-950/50 border border-white/5 p-6">
                <pre className="text-slate-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                  {selectedInstrument.content}
                </pre>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  className="border-white/10 text-white hover:bg-white/5"
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
