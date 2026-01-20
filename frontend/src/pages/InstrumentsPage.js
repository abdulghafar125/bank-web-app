import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { ScrollArea } from '../components/ui/scroll-area';
import { toast } from 'sonner';
import { FileText, Eye, Download, Loader2, DollarSign } from 'lucide-react';

export default function InstrumentsPage() {
  const { api } = useAuth();
  const [instruments, setInstruments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstrument, setSelectedInstrument] = useState(null);

  useEffect(() => {
    fetchInstruments();
  }, []);

  const fetchInstruments = async () => {
    try {
      const response = await api.get('/instruments');
      setInstruments(response.data);
    } catch (error) {
      toast.error('Failed to load instruments');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    if (!amount) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getInstrumentIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'ktt':
        return 'bg-purple-500/20 text-purple-400';
      case 'cd':
        return 'bg-emerald-500/20 text-emerald-400';
      case 'endorsement':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-cyan-500/20 text-cyan-400';
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
    <div className="space-y-6 animate-fade-in" data-testid="instruments-page">
      <div>
        <h1 className="text-3xl font-heading font-bold text-white">Bank Instruments</h1>
        <p className="text-slate-400 mt-1">View your banking documents and certificates</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {instruments.map((inst, index) => (
          <Card 
            key={inst.id} 
            className="glass-card card-hover cursor-pointer"
            onClick={() => setSelectedInstrument(inst)}
            style={{ animationDelay: `${index * 100}ms` }}
            data-testid={`instrument-card-${inst.id}`}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getInstrumentIcon(inst.instrument_type)}`}>
                  <FileText className="h-6 w-6" />
                </div>
                <span className="badge badge-completed">{inst.instrument_type}</span>
              </div>
              
              <h3 className="text-lg font-semibold text-white mb-2">{inst.title}</h3>
              
              {inst.amount && (
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="h-4 w-4 text-cyan-400" />
                  <span className="text-xl font-heading font-bold text-white">
                    {formatCurrency(inst.amount, inst.currency)}
                  </span>
                </div>
              )}
              
              <p className="text-slate-400 text-sm line-clamp-2 mb-4">
                {inst.content.substring(0, 100)}...
              </p>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">
                  {new Date(inst.created_at).toLocaleDateString()}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {instruments.length === 0 && (
          <Card className="glass-card col-span-full">
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No instruments available</p>
              <p className="text-slate-500 text-sm mt-2">
                Bank instruments like KTT will appear here when issued
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Instrument Detail Modal */}
      <Dialog open={!!selectedInstrument} onOpenChange={() => setSelectedInstrument(null)}>
        <DialogContent className="bg-navy-900 border-white/10 text-white max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedInstrument && getInstrumentIcon(selectedInstrument.instrument_type)}`}>
                <FileText className="h-5 w-5" />
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
                    Issued: {new Date(selectedInstrument.created_at).toLocaleDateString()}
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
              
              <ScrollArea className="h-[400px] rounded-lg bg-navy-950/50 border border-white/5 p-6">
                <pre className="text-slate-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                  {selectedInstrument.content}
                </pre>
              </ScrollArea>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  className="border-white/10 text-white hover:bg-white/5"
                  onClick={() => setSelectedInstrument(null)}
                >
                  Close
                </Button>
                <Button className="bg-cyan-500 hover:bg-cyan-600">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
