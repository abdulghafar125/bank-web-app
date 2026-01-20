import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ScrollArea } from '../components/ui/scroll-area';
import { toast } from 'sonner';
import { FileText, Loader2 } from 'lucide-react';

export default function FundingPage() {
  const { api } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await api.get('/content/funding-instructions');
      setContent(response.data.content || 'No content available');
    } catch (error) {
      toast.error('Failed to load content');
    } finally {
      setLoading(false);
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
    <div className="space-y-6 animate-fade-in" data-testid="funding-page">
      <div>
        <h1 className="text-3xl font-heading font-bold text-white">How to Fund Your Account</h1>
        <p className="text-slate-400 mt-1">Instructions for depositing funds into your Prominence Bank account</p>
      </div>

      <Card className="glass-card">
        <CardHeader className="border-b border-white/5">
          <CardTitle className="text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
              <FileText className="h-5 w-5 text-cyan-400" />
            </div>
            Wire Transfer Instructions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ScrollArea className="h-[600px] pr-4">
            <div className="prose prose-invert max-w-none">
              <div className="text-slate-300 leading-relaxed whitespace-pre-wrap font-mono text-sm">
                {content.split('\n').map((line, i) => {
                  if (line.startsWith('# ')) {
                    return <h1 key={i} className="text-2xl font-heading font-bold text-white mt-6 mb-4">{line.slice(2)}</h1>;
                  }
                  if (line.startsWith('## ')) {
                    return <h2 key={i} className="text-xl font-heading font-semibold text-white mt-6 mb-3">{line.slice(3)}</h2>;
                  }
                  if (line.startsWith('### ')) {
                    return <h3 key={i} className="text-lg font-heading font-medium text-cyan-400 mt-4 mb-2">{line.slice(4)}</h3>;
                  }
                  if (line.startsWith('- ')) {
                    return <p key={i} className="text-slate-300 ml-4 my-1">• {line.slice(2)}</p>;
                  }
                  if (line.trim() === '') {
                    return <br key={i} />;
                  }
                  return <p key={i} className="text-slate-300 my-2">{line}</p>;
                })}
              </div>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardContent className="pt-6">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-yellow-400 text-sm">
              <strong>Important:</strong> For transfers over $100,000, please contact your account manager for special instructions and verification procedures.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
