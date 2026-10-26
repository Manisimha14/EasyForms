import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Banner } from '../../components/ui/Banner';
import { UserPlus, Eye, EyeOff, Check, X, ArrowRight } from 'lucide-react';
import { LIMITS } from '../../lib/constants';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Live password validation rules
  const hasMinLength = password.length >= LIMITS.PASSWORD_MIN && password.length <= LIMITS.PASSWORD_MAX;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasLetter && hasNumber;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!isPasswordValid) {
      setError('Password must meet all complexity requirements.');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        email: email.trim(),
        password,
        name: name.trim() || undefined,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err.code === 'CONFLICT') {
        setError('This email address is already registered.');
      } else if (err.code === 'VALIDATION_ERROR' && err.details?.length) {
        const errors = {};
        err.details.forEach((d) => {
          errors[d.path] = d.message;
        });
        setFieldErrors(errors);
      } else {
        setError(err.message || 'Unable to register. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-2xl p-8 shadow-card">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center text-white font-bold text-xl mb-4 shadow-sm">
            EF
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Create an account
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Build, publish and analyse forms in minutes
          </p>
        </div>

        {error && (
          <Banner type="error" className="mb-6">
            {error}{' '}
            {error.includes('already registered') && (
              <Link to="/login" className="font-semibold underline ml-1">
                Log in here
              </Link>
            )}
          </Banner>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name (optional)"
            id="name"
            name="name"
            placeholder="Jane Doe"
            maxLength={LIMITS.NAME_MAX}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={fieldErrors.name}
          />

          <Input
            label="Email address"
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
          />

          <div className="space-y-1.5">
            <div className="relative">
              <Input
                label="Password"
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                placeholder="Choose a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={fieldErrors.password}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Live Password Checklist */}
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                {hasMinLength ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                ) : (
                  <X className="w-3.5 h-3.5 text-slate-300 stroke-[2]" />
                )}
                <span className={hasMinLength ? 'text-emerald-700 font-medium' : ''}>
                  8–64 characters long
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {hasLetter ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                ) : (
                  <X className="w-3.5 h-3.5 text-slate-300 stroke-[2]" />
                )}
                <span className={hasLetter ? 'text-emerald-700 font-medium' : ''}>
                  Contains at least one letter
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {hasNumber ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                ) : (
                  <X className="w-3.5 h-3.5 text-slate-300 stroke-[2]" />
                )}
                <span className={hasNumber ? 'text-emerald-700 font-medium' : ''}>
                  Contains at least one number
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-normal pt-1">
            Note: Password reset self-service is not available in this version.
          </p>

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            isLoading={isLoading}
            icon={UserPlus}
          >
            Create account
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-sm text-slate-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-primary-600 hover:text-primary-700 hover:underline inline-flex items-center gap-1"
            >
              Sign in <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
