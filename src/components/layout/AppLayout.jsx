import clsx from 'clsx'
import {
  Compass,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Repeat2,
  Shield,
  Sun,
  User,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'
import { Avatar } from '../common/Avatar'
import { Logo } from '../common/Logo'
import { NotificationsPopover } from './NotificationsPopover'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/discover', label: 'Discover', icon: Compass },
  { to: '/sessions', label: 'Sessions', icon: Repeat2 },
  { to: '/chat', label: 'Messages', icon: MessageSquare },
  { to: '/profile', label: 'Profile', icon: User },
]

export function AppLayout() {
  const { profile, signOut, isAdmin } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const items = isAdmin ? [...NAV_ITEMS, { to: '/admin', label: 'Admin', icon: Shield }] : NAV_ITEMS

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch {
      toast.error('Could not sign you out. Please try again.')
    }
  }

  const navLinkClasses = ({ isActive }) =>
    clsx(
      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
      isActive
        ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
    )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
              onClick={() => setMobileOpen((value) => !value)}
              aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
            <Logo />
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </button>
            <NotificationsPopover />
            <div className="ml-1 flex items-center gap-2 border-l border-slate-200 pl-2 dark:border-slate-800">
              <Avatar url={profile?.avatar_url} name={profile?.full_name} size="sm" />
              <span className="hidden text-sm font-medium text-slate-700 sm:block dark:text-slate-200">
                {profile?.full_name || 'Student'}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                aria-label="Sign out"
                className="rounded-xl p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950"
              >
                <LogOut className="size-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
        <nav
          aria-label="Main"
          className={clsx(
            'w-60 shrink-0 space-y-1 lg:block',
            mobileOpen
              ? 'fixed inset-x-4 top-20 z-30 block rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900'
              : 'hidden',
          )}
        >
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClasses}>
              <item.icon className="size-4.5" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main id="main-content" className="min-w-0 flex-1 animate-fade-in pb-16">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
