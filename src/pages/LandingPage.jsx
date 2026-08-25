import { ArrowRight, Compass, HeartHandshake, ShieldCheck, Sparkles } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { Logo } from '../components/common/Logo'
import { FullPageLoader } from '../components/common/FullPageLoader'
import { useAuth } from '../hooks/useAuth'

const FEATURES = [
  {
    icon: Compass,
    title: 'Intelligent matching',
    description:
      'A tiered engine scores every offer against the skills you need, weighing reputation, responsiveness and department.',
  },
  {
    icon: ShieldCheck,
    title: 'Trust you can see',
    description:
      'Time-decayed ratings, response and completion rates, plus earned badges make reliability obvious before you commit.',
  },
  {
    icon: HeartHandshake,
    title: 'Structured exchanges',
    description:
      'Every swap moves through a clear lifecycle: request, accept, meet, complete, rate. Nothing gets lost in DMs.',
  },
]

export default function LandingPage() {
  const { user, loading } = useAuth()

  if (loading) return <FullPageLoader />
  if (user) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-brand-50/40 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo to="/" />
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          Sign in <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24">
        <section className="py-16 text-center sm:py-24">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3.5 py-1.5 text-xs font-semibold text-brand-700 dark:bg-brand-900 dark:text-brand-100">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Intelligent campus skill exchange
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl dark:text-slate-50">
            Learn. Share. <span className="text-brand-600 dark:text-brand-400">Grow together.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
            SkillLink turns informal campus favours into structured exchanges — matching students who
            need a skill with the students who can teach it.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 sm:w-auto"
            >
              Get started free <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex w-full items-center justify-center rounded-xl bg-white px-6 py-3 text-base font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 sm:w-auto dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700"
            >
              How it works
            </a>
          </div>
        </section>

        <section id="how-it-works" className="grid gap-6 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/60 dark:text-brand-200">
                <feature.icon className="size-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-50">
                {feature.title}
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{feature.description}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  )
}
