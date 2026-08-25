import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle, ArrowLeft, Mail } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../components/common/Button'
import { Input } from '../components/common/Field'
import { FullPageLoader } from '../components/common/FullPageLoader'
import { Logo } from '../components/common/Logo'
import { useAuth } from '../hooks/useAuth'
import { friendlyError } from '../lib/errors'
import { isSupabaseConfigured } from '../lib/supabaseClient'
import { signInSchema, signUpSchema } from '../lib/validators'

const MODES = {
  signin: { title: 'Welcome back', cta: 'Sign in', schema: signInSchema },
  signup: { title: 'Create your account', cta: 'Create account', schema: signUpSchema },
  reset: { title: 'Reset your password', cta: 'Send reset link', schema: signInSchema.pick({ email: true }) },
}

export default function LoginPage() {
  const { user, loading, signIn, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState('signin')
  const navigate = useNavigate()
  const location = useLocation()

  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(MODES[mode].schema) })

  if (loading) return <FullPageLoader />
  if (user) return <Navigate to={location.state?.from?.pathname ?? '/dashboard'} replace />

  const switchMode = (next) => {
    setMode(next)
    resetForm()
  }

  const onSubmit = async (values) => {
    try {
      if (mode === 'signin') {
        await signIn(values)
        toast.success('Signed in')
        navigate('/dashboard', { replace: true })
      } else if (mode === 'signup') {
        const data = await signUp(values)
        if (data.session) {
          toast.success('Account created! Let us set up your profile.')
          navigate('/onboarding', { replace: true })
        } else {
          toast.success('Check your inbox to confirm your email address.')
          switchMode('signin')
        }
      } else {
        await resetPassword(values.email)
        toast.success('If that email exists, a reset link is on its way.')
        switchMode('signin')
      }
    } catch (error) {
      toast.error(friendlyError(error))
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-gradient-to-br from-brand-600 via-brand-700 to-accent-600 p-12 text-white lg:flex">
        <Logo to="/" />
        <div>
          <h2 className="max-w-md text-4xl font-bold leading-tight">
            Learn. Share. Grow together.
          </h2>
          <p className="mt-4 max-w-md text-brand-50">
            Offer what you know, request what you need, and let SkillLink match you with the right
            student on campus.
          </p>
        </div>
        <p className="text-sm text-brand-100">Intelligent Campus Skill Exchange Platform</p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden">
            <Logo to="/" />
          </div>

          {!isSupabaseConfigured && (
            <div className="mt-6 flex gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">
              <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
              <p>
                Supabase is not configured. Copy <code>.env.example</code> to <code>.env</code> and add
                your project URL and anon key.
              </p>
            </div>
          )}

          <h1 className="mt-8 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {MODES[mode].title}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {mode === 'signup'
              ? 'Join the campus skill exchange in under a minute.'
              : mode === 'reset'
                ? 'We will email you a secure link to choose a new password.'
                : 'Sign in to pick up where you left off.'}
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
            {mode === 'signup' && (
              <Input
                label="Full name"
                autoComplete="name"
                placeholder="Ada Lovelace"
                error={errors.fullName?.message}
                {...register('fullName')}
              />
            )}
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@campus.edu"
              error={errors.email?.message}
              {...register('email')}
            />
            {mode !== 'reset' && (
              <Input
                label="Password"
                type="password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                placeholder="At least 6 characters"
                error={errors.password?.message}
                {...register('password')}
              />
            )}

            <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
              {MODES[mode].cta}
            </Button>
          </form>

          <div className="mt-6 space-y-2 text-sm">
            {mode === 'signin' && (
              <>
                <button
                  type="button"
                  onClick={() => switchMode('reset')}
                  className="inline-flex items-center gap-1.5 font-medium text-brand-600 hover:underline dark:text-brand-400"
                >
                  <Mail className="size-4" aria-hidden="true" /> Forgot your password?
                </button>
                <p className="text-slate-500 dark:text-slate-400">
                  New to SkillLink?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
                  >
                    Create an account
                  </button>
                </p>
              </>
            )}
            {mode !== 'signin' && (
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="inline-flex items-center gap-1.5 font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                <ArrowLeft className="size-4" aria-hidden="true" /> Back to sign in
              </button>
            )}
          </div>

          <p className="mt-10 text-center text-xs text-slate-400">
            <Link to="/" className="hover:underline">
              Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
