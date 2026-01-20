import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { ScrollArea } from '../components/ui/scroll-area';
import { toast } from 'sonner';
import { Plus, MessageSquare, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function TicketsPage() {
  const { api } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    subject: '',
    message: '',
    category: 'general'
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await api.get('/tickets');
      setTickets(response.data);
    } catch (error) {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/tickets', form);
      setShowAddModal(false);
      setForm({ subject: '', message: '', category: 'general' });
      toast.success('Ticket created successfully');
      fetchTickets();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      case 'in_progress':
        return <AlertCircle className="h-4 w-4 text-blue-400" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-emerald-400" />;
      default:
        return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      open: 'badge-pending',
      in_progress: 'badge-processing',
      resolved: 'badge-completed',
      closed: 'badge-rejected'
    };
    return `badge ${styles[status] || 'badge-pending'}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="tickets-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-white">Support Tickets</h1>
          <p className="text-slate-400 mt-1">Get help from our support team</p>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="bg-cyan-500 hover:bg-cyan-600 glow-cyan"
          data-testid="create-ticket-btn"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Ticket
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tickets.map((ticket, index) => (
          <Card 
            key={ticket.id} 
            className="glass-card card-hover cursor-pointer"
            onClick={() => setSelectedTicket(ticket)}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{ticket.subject}</h3>
                    <p className="text-slate-400 text-sm mt-1 line-clamp-2">{ticket.message}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-slate-500 text-sm">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-slate-500 text-sm capitalize">
                        {ticket.category}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(ticket.status)}
                  <span className={getStatusBadge(ticket.status)}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {tickets.length === 0 && (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No support tickets</p>
              <p className="text-slate-500 text-sm mt-2">
                Create a ticket if you need assistance
              </p>
              <Button 
                onClick={() => setShowAddModal(true)}
                className="mt-4 bg-cyan-500 hover:bg-cyan-600"
              >
                Create Your First Ticket
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Ticket Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-navy-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading">Create Support Ticket</DialogTitle>
            <DialogDescription className="text-slate-400">
              Describe your issue and our team will respond shortly.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Category</Label>
              <Select 
                value={form.category} 
                onValueChange={(value) => setForm({...form, category: value})}
              >
                <SelectTrigger className="bg-navy-950/50 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-navy-900 border-white/10">
                  <SelectItem value="general" className="text-white hover:bg-white/10">General Inquiry</SelectItem>
                  <SelectItem value="account" className="text-white hover:bg-white/10">Account Issue</SelectItem>
                  <SelectItem value="transfer" className="text-white hover:bg-white/10">Transfer Issue</SelectItem>
                  <SelectItem value="technical" className="text-white hover:bg-white/10">Technical Support</SelectItem>
                  <SelectItem value="security" className="text-white hover:bg-white/10">Security Concern</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Subject</Label>
              <Input
                placeholder="Brief description of your issue"
                value={form.subject}
                onChange={(e) => setForm({...form, subject: e.target.value})}
                className="bg-navy-950/50 border-white/10 text-white"
                required
                data-testid="ticket-subject-input"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Message</Label>
              <Textarea
                placeholder="Provide details about your issue..."
                value={form.message}
                onChange={(e) => setForm({...form, message: e.target.value})}
                className="bg-navy-950/50 border-white/10 text-white min-h-[120px]"
                required
                data-testid="ticket-message-input"
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
                data-testid="submit-ticket-btn"
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Submit Ticket'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ticket Detail Modal */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="bg-navy-900 border-white/10 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-heading">{selectedTicket?.subject}</DialogTitle>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  {getStatusIcon(selectedTicket.status)}
                  <span className={getStatusBadge(selectedTicket.status)}>
                    {selectedTicket.status.replace('_', ' ')}
                  </span>
                  <span className="text-slate-500 text-sm ml-4 capitalize">
                    {selectedTicket.category}
                  </span>
                </div>
                <span className="text-slate-400 text-sm">
                  {new Date(selectedTicket.created_at).toLocaleString()}
                </span>
              </div>
              
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  <div className="bg-navy-950/50 rounded-lg p-4 border border-white/5">
                    <p className="text-slate-300 whitespace-pre-wrap">{selectedTicket.message}</p>
                  </div>

                  {selectedTicket.responses && selectedTicket.responses.map((response, i) => (
                    <div 
                      key={i} 
                      className={`rounded-lg p-4 border ${
                        response.from === 'admin' 
                          ? 'bg-cyan-500/10 border-cyan-500/20' 
                          : 'bg-navy-950/50 border-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">
                          {response.from === 'admin' ? 'Support Team' : 'You'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(response.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-300">{response.message}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="mt-6">
                <Button
                  variant="outline"
                  className="w-full border-white/10 text-white hover:bg-white/5"
                  onClick={() => setSelectedTicket(null)}
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
