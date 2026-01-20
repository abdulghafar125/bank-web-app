import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../components/ui/input-otp';
import { toast } from 'sonner';
import { Mail, Lock, ArrowRight, Shield, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [step, setStep] = useState('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, verifyOTP } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.requires_otp) {
        setStep('otp');
        toast.success('OTP sent to your email');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const result = await verifyOTP(email, otp);
      toast.success('Login successful');
      if (result.user.role === 'admin' || result.user.role === 'super_admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" data-testid="login-page">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>
      
      <div className="login-card relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <img 
            src="https://customer-assets.emergentagent.com/job_04a84262-127c-46bf-90fb-19ace47e860b/artifacts/h938t30r_logo-2.png" 
            alt="Prominence Bank" 
            className="h-16 mx-auto mb-4"
          />
          <h1 className="text-2xl font-heading font-bold text-white">Welcome Back</h1>
          <p className="text-slate-400 mt-2">Sign in to your account</p>
        </div>

        {step === 'credentials' ? (
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-navy-950/50 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500"
                  required
                  data-testid="email-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-navy-950/50 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500"
                  required
                  data-testid="password-input"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 glow-cyan"
              disabled={loading}
              data-testid="login-button"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Continue
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>

            <div className="text-center text-sm text-slate-400">
              <Link to="/register" className="text-cyan-400 hover:text-cyan-300">
                Don't have an account? Register
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-cyan-400" />
              </div>
              <p className="text-slate-300 mb-2">Enter the 6-digit code sent to</p>
              <p className="text-cyan-400 font-medium">{email}</p>
            </div>

            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={(value) => setOtp(value)}
                data-testid="otp-input"
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

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-center">
              <p className="text-blue-400 text-sm">Demo Mode: Use OTP <span className="font-mono font-bold">123456</span></p>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 glow-cyan"
              disabled={loading || otp.length !== 6}
              data-testid="verify-otp-button"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Verify & Sign In
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>

            <button
              type="button"
              onClick={() => setStep('credentials')}
              className="w-full text-slate-400 hover:text-white text-sm"
            >
              ← Back to login
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-white/10 text-center text-xs text-slate-500">
          <p>Protected by Prominence Bank Security</p>
          <p className="mt-1">© 2025 Prominence Bank. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
