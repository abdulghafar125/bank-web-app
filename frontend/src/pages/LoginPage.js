import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../components/ui/input-otp';
import { toast } from 'sonner';
import { Mail, Lock, ArrowRight, Shield, Loader2, Eye, EyeOff, Fingerprint } from 'lucide-react';

export default function LoginPage() {
  const [step, setStep] = useState('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen flex" data-testid="login-page">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-cyan-500/5 rounded-full blur-2xl" />
          {/* Decorative circles pattern */}
          <div className="absolute top-20 right-20 w-4 h-4 bg-cyan-500/30 rounded-full" />
          <div className="absolute top-32 right-32 w-2 h-2 bg-cyan-500/20 rounded-full" />
          <div className="absolute bottom-40 left-20 w-3 h-3 bg-cyan-500/25 rounded-full" />
          <div className="absolute bottom-60 left-40 w-2 h-2 bg-cyan-500/15 rounded-full" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 lg:px-20">
          <img 
            src="https://customer-assets.emergentagent.com/job_04a84262-127c-46bf-90fb-19ace47e860b/artifacts/h938t30r_logo-2.png" 
            alt="Prominence Bank" 
            className="h-16 w-auto mb-8"
          />
          <h1 className="text-4xl lg:text-5xl font-heading font-bold text-white leading-tight mb-6">
            Smart Banking<br />
            <span className="text-cyan-400">Made Simple</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-md">
            Experience secure, modern banking with Prominence Bank. 
            Your financial future starts here.
          </p>
          
          <div className="mt-12 flex items-center gap-8">
            <div>
              <p className="text-3xl font-heading font-bold text-white">20+</p>
              <p className="text-slate-500 text-sm">Currencies</p>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div>
              <p className="text-3xl font-heading font-bold text-white">24/7</p>
              <p className="text-slate-500 text-sm">Support</p>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div>
              <p className="text-3xl font-heading font-bold text-white">100%</p>
              <p className="text-slate-500 text-sm">Secure</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-navy-950">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img 
              src="https://customer-assets.emergentagent.com/job_04a84262-127c-46bf-90fb-19ace47e860b/artifacts/h938t30r_logo-2.png" 
              alt="Prominence Bank" 
              className="h-12 mx-auto mb-4"
            />
          </div>

          <div className="bg-navy-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            {step === 'credentials' ? (
              <>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-heading font-bold text-white">Welcome Back</h2>
                  <p className="text-slate-400 mt-2">Sign in to your account</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300 text-sm font-medium">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-11 h-12 bg-navy-950/50 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500 rounded-xl"
                        required
                        data-testid="email-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-300 text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-11 pr-11 h-12 bg-navy-950/50 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-500 rounded-xl"
                        required
                        data-testid="password-input"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-end">
                    <a href="#" className="text-sm text-cyan-400 hover:text-cyan-300">
                      Forgot password?
                    </a>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 transition-all hover:shadow-cyan-500/40"
                    disabled={loading}
                    data-testid="login-button"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-slate-500 text-sm">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-medium">
                      Contact us
                    </Link>
                  </p>
                </div>

                {/* Demo Credentials */}
                <div className="mt-6 p-4 bg-navy-950/50 rounded-xl border border-white/5">
                  <p className="text-slate-400 text-xs text-center mb-2">Demo Credentials</p>
                  <div className="flex gap-4 text-xs">
                    <div className="flex-1">
                      <p className="text-slate-500">Client:</p>
                      <p className="text-white font-mono">client@example.com</p>
                      <p className="text-slate-500">client123</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-500">Admin:</p>
                      <p className="text-white font-mono">admin@prominencebank.com</p>
                      <p className="text-slate-500">admin123</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-cyan-500/20">
                    <Fingerprint className="h-10 w-10 text-cyan-400" />
                  </div>
                  <h2 className="text-2xl font-heading font-bold text-white">Verify Your Identity</h2>
                  <p className="text-slate-400 mt-2">Enter the 6-digit code sent to</p>
                  <p className="text-cyan-400 font-medium">{email}</p>
                </div>

                <form onSubmit={handleVerifyOTP} className="space-y-6">
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={(value) => setOtp(value)}
                      data-testid="otp-input"
                    >
                      <InputOTPGroup className="gap-2">
                        <InputOTPSlot index={0} className="w-12 h-14 bg-navy-950/50 border-white/10 text-white text-xl rounded-xl" />
                        <InputOTPSlot index={1} className="w-12 h-14 bg-navy-950/50 border-white/10 text-white text-xl rounded-xl" />
                        <InputOTPSlot index={2} className="w-12 h-14 bg-navy-950/50 border-white/10 text-white text-xl rounded-xl" />
                        <InputOTPSlot index={3} className="w-12 h-14 bg-navy-950/50 border-white/10 text-white text-xl rounded-xl" />
                        <InputOTPSlot index={4} className="w-12 h-14 bg-navy-950/50 border-white/10 text-white text-xl rounded-xl" />
                        <InputOTPSlot index={5} className="w-12 h-14 bg-navy-950/50 border-white/10 text-white text-xl rounded-xl" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-3 text-center">
                    <p className="text-cyan-400 text-sm">Demo Mode: Use OTP <span className="font-mono font-bold">123456</span></p>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25"
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

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setStep('credentials')}
                      className="text-slate-400 hover:text-white text-sm transition-colors"
                    >
                      ← Back to login
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>

          <p className="text-center text-slate-500 text-xs mt-6">
            Protected by Prominence Bank Security • © 2025
          </p>
        </div>
      </div>
    </div>
  );
}
