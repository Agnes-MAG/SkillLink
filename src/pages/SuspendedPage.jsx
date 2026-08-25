import { ShieldAlert } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/common/Button'
import { useAuth } from '../hooks/useAuth'

export default function SuspendedPage() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-6 dark:bg-slate-950">
      <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300">
          <ShieldAlert className="size-7" aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-xl font-bold text-slate-900 dark:text-slate-50">
          Your account is suspended
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Suspensions happen automatically after repeated low ratings, or when an administrator
          reviews reported activity. Contact the SkillLink admin team to appeal.
        </p>
        <Button
          className="mt-6 w-full"
          variant="secondary"
          onClick={async () => {
            await signOut()
            navigate('/login', { replace: true })
          }}
        >
          Sign out
        </Button>
      </div>
    </div>
  )
}
