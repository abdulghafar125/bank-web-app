import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from 'sonner';
import { Settings, Mail, FileText, Save, Send, Loader2, CheckCircle, Bitcoin, Wallet } from 'lucide-react';

export default function AdminSettings() {
  const { api } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [smtpSettings, setSmtpSettings] = useState({
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    smtp_from_email: '',
    otp_expiry_minutes: 5,
    max_otp_attempts: 3
  });

  const [fundingContent, setFundingContent] = useState('');
  const [contentVersion, setContentVersion] = useState(1);

  const [cryptoSettings, setCryptoSettings] = useState({
    btc_address: '',
    eth_address: '',
    xlm_address: '',
    bch_address: '',
    usdt_address: '',
    usdt_network: 'ERC20',
    crypto_transfer_fee: 0.001
  });

  useEffect(() => {
    fetchSettings();
    fetchFundingContent();
    fetchCryptoSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/settings');
      if (response.data.smtp) {
        setSmtpSettings(prev => ({
          ...prev,
          ...response.data.smtp
        }));
      }
    } catch (error) {
      console.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchFundingContent = async () => {
    try {
      const response = await api.get('/content/funding-instructions');
      setFundingContent(response.data.content || '');
      setContentVersion(response.data.version || 1);
    } catch (error) {
      console.error('Failed to load funding content');
    }
  };

  const fetchCryptoSettings = async () => {
    try {
      const response = await api.get('/admin/crypto/wallets');
      setCryptoSettings(prev => ({
        ...prev,
        ...response.data
      }));
    } catch (error) {
      console.error('Failed to load crypto settings');
    }
  };

  const handleSaveSmtp = async () => {
    setSaving(true);
    try {
      await api.put('/admin/settings', smtpSettings);
      toast.success('SMTP settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setTesting(true);
    try {
      await api.post('/admin/settings/test-email');
      toast.success('Test email sent successfully');
    } catch (error) {
      toast.error('Failed to send test email');
    } finally {
      setTesting(false);
    }
  };

  const handleSaveFundingContent = async () => {
    setSaving(true);
    try {
      const response = await api.put('/admin/content/funding-instructions', {
        content: fundingContent
      });
      setContentVersion(response.data.version);
      toast.success('Funding instructions updated');
    } catch (error) {
      toast.error('Failed to update content');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCryptoSettings = async () => {
    setSaving(true);
    try {
      await api.put('/admin/crypto/wallets', cryptoSettings);
      toast.success('Crypto wallet settings saved');
    } catch (error) {
      toast.error('Failed to save crypto settings');
    } finally {
      setSaving(false);
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
    <div className="space-y-6 animate-fade-in" data-testid="admin-settings-page">
      <div>
        <h1 className="text-3xl font-heading font-bold text-white">System Settings</h1>
        <p className="text-slate-400 mt-1">Configure SMTP, content, and security policies</p>
      </div>

      <Tabs defaultValue="smtp" className="w-full">
        <TabsList className="bg-navy-900/50 border border-white/5 flex-wrap">
          <TabsTrigger value="smtp" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <Mail className="mr-2 h-4 w-4" />
            SMTP Settings
          </TabsTrigger>
          <TabsTrigger value="crypto" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
            <Bitcoin className="mr-2 h-4 w-4" />
            Crypto Wallets
          </TabsTrigger>
          <TabsTrigger value="content" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
            <FileText className="mr-2 h-4 w-4" />
            Funding Instructions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="smtp" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white">Email (SMTP) Configuration</CardTitle>
              <p className="text-slate-400 text-sm">Configure the bank's email server for OTP delivery</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-300">SMTP Host</Label>
                  <Input
                    value={smtpSettings.smtp_host}
                    onChange={(e) => setSmtpSettings({...smtpSettings, smtp_host: e.target.value})}
                    placeholder="smtp.prominencebank.com"
                    className="bg-navy-950/50 border-white/10 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">SMTP Port</Label>
                  <Input
                    type="number"
                    value={smtpSettings.smtp_port}
                    onChange={(e) => setSmtpSettings({...smtpSettings, smtp_port: parseInt(e.target.value)})}
                    className="bg-navy-950/50 border-white/10 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">SMTP Username</Label>
                  <Input
                    value={smtpSettings.smtp_user}
                    onChange={(e) => setSmtpSettings({...smtpSettings, smtp_user: e.target.value})}
                    placeholder="noreply@prominencebank.com"
                    className="bg-navy-950/50 border-white/10 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">SMTP Password</Label>
                  <Input
                    type="password"
                    value={smtpSettings.smtp_password}
                    onChange={(e) => setSmtpSettings({...smtpSettings, smtp_password: e.target.value})}
                    placeholder="••••••••"
                    className="bg-navy-950/50 border-white/10 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">From Email Address</Label>
                  <Input
                    value={smtpSettings.smtp_from_email}
                    onChange={(e) => setSmtpSettings({...smtpSettings, smtp_from_email: e.target.value})}
                    placeholder="noreply@prominencebank.com"
                    className="bg-navy-950/50 border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="border-t border-white/10 pt-6">
                <h3 className="text-white font-semibold mb-4">OTP Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-300">OTP Expiry (minutes)</Label>
                    <Input
                      type="number"
                      value={smtpSettings.otp_expiry_minutes}
                      onChange={(e) => setSmtpSettings({...smtpSettings, otp_expiry_minutes: parseInt(e.target.value)})}
                      className="bg-navy-950/50 border-white/10 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Max OTP Attempts</Label>
                    <Input
                      type="number"
                      value={smtpSettings.max_otp_attempts}
                      onChange={(e) => setSmtpSettings({...smtpSettings, max_otp_attempts: parseInt(e.target.value)})}
                      className="bg-navy-950/50 border-white/10 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleSaveSmtp}
                  className="bg-cyan-500 hover:bg-cyan-600"
                  disabled={saving}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Settings
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleTestEmail}
                  className="border-white/10 text-white hover:bg-white/5"
                  disabled={testing}
                >
                  {testing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  Send Test Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crypto" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bitcoin className="h-5 w-5 text-orange-400" />
                Crypto Wallet Addresses
              </CardTitle>
              <p className="text-slate-400 text-sm">
                Configure bank receiving wallet addresses for cryptocurrency deposits. These will be displayed to customers in their dashboard.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <span className="w-6 h-6 bg-orange-500/20 rounded flex items-center justify-center text-orange-400 text-xs font-bold">₿</span>
                    Bitcoin (BTC) Address
                  </Label>
                  <Input
                    value={cryptoSettings.btc_address}
                    onChange={(e) => setCryptoSettings({...cryptoSettings, btc_address: e.target.value})}
                    placeholder="bc1q..."
                    className="bg-navy-950/50 border-white/10 text-white font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-500/20 rounded flex items-center justify-center text-blue-400 text-xs font-bold">Ξ</span>
                    Ethereum (ETH) Address
                  </Label>
                  <Input
                    value={cryptoSettings.eth_address}
                    onChange={(e) => setCryptoSettings({...cryptoSettings, eth_address: e.target.value})}
                    placeholder="0x..."
                    className="bg-navy-950/50 border-white/10 text-white font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <span className="w-6 h-6 bg-cyan-500/20 rounded flex items-center justify-center text-cyan-400 text-xs font-bold">*</span>
                    Stellar (XLM) Address
                  </Label>
                  <Input
                    value={cryptoSettings.xlm_address}
                    onChange={(e) => setCryptoSettings({...cryptoSettings, xlm_address: e.target.value})}
                    placeholder="G..."
                    className="bg-navy-950/50 border-white/10 text-white font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <span className="w-6 h-6 bg-green-500/20 rounded flex items-center justify-center text-green-400 text-xs font-bold">B</span>
                    Bitcoin Cash (BCH) Address
                  </Label>
                  <Input
                    value={cryptoSettings.bch_address}
                    onChange={(e) => setCryptoSettings({...cryptoSettings, bch_address: e.target.value})}
                    placeholder="bitcoincash:q..."
                    className="bg-navy-950/50 border-white/10 text-white font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <span className="w-6 h-6 bg-emerald-500/20 rounded flex items-center justify-center text-emerald-400 text-xs font-bold">₮</span>
                    USDT (Tether) Address
                  </Label>
                  <Input
                    value={cryptoSettings.usdt_address}
                    onChange={(e) => setCryptoSettings({...cryptoSettings, usdt_address: e.target.value})}
                    placeholder="0x..."
                    className="bg-navy-950/50 border-white/10 text-white font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">USDT Network</Label>
                  <Select 
                    value={cryptoSettings.usdt_network} 
                    onValueChange={(value) => setCryptoSettings({...cryptoSettings, usdt_network: value})}
                  >
                    <SelectTrigger className="bg-navy-950/50 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ERC20">ERC20 (Ethereum)</SelectItem>
                      <SelectItem value="TRC20">TRC20 (Tron)</SelectItem>
                      <SelectItem value="BEP20">BEP20 (BSC)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t border-white/10 pt-6">
                <h3 className="text-white font-semibold mb-4">Fee Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Crypto Transfer Fee (%)</Label>
                    <Input
                      type="number"
                      step="0.001"
                      value={cryptoSettings.crypto_transfer_fee}
                      onChange={(e) => setCryptoSettings({...cryptoSettings, crypto_transfer_fee: parseFloat(e.target.value)})}
                      className="bg-navy-950/50 border-white/10 text-white"
                    />
                    <p className="text-slate-500 text-xs">Fee applied to crypto deposits</p>
                  </div>
                </div>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                <p className="text-orange-400 text-sm flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Wallet addresses are displayed to customers for deposits. Changes are logged in audit trail.
                </p>
              </div>

              <Button 
                onClick={handleSaveCryptoSettings}
                className="bg-orange-500 hover:bg-orange-600"
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Crypto Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="mt-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>Funding Instructions</span>
                <span className="text-sm font-normal text-slate-400">Version {contentVersion}</span>
              </CardTitle>
              <p className="text-slate-400 text-sm">
                Edit the "How to Fund Your Account" page content. Changes are instant for all clients.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-slate-300">Content (Markdown supported)</Label>
                <Textarea
                  value={fundingContent}
                  onChange={(e) => setFundingContent(e.target.value)}
                  placeholder="Enter funding instructions..."
                  className="bg-navy-950/50 border-white/10 text-white min-h-[400px] font-mono text-sm"
                />
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-400 text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Version history is automatically maintained. Updates are instantly visible to all clients.
                </p>
              </div>

              <Button 
                onClick={handleSaveFundingContent}
                className="bg-cyan-500 hover:bg-cyan-600"
                disabled={saving}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Publish Updates
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
