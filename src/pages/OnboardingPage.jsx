import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  GraduationCap,
  HandHeart,
  Lightbulb,
  PartyPopper,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Navigate, useNavigate } from 'react-router-dom'
import { Avatar } from '../components/common/Avatar'
import { Button } from '../components/common/Button'
import { Input, Select, Textarea } from '../components/common/Field'
import { FullPageLoader } from '../components/common/FullPageLoader'
import { Logo } from '../components/common/Logo'
import { ProgressBar } from '../components/common/ProgressBar'
import { SkillForm } from '../components/skills/SkillForm'
import { SkillPill } from '../components/skills/SkillPill'
import { useAuth } from '../hooks/useAuth'
import { DEPARTMENTS, YEARS } from '../lib/constants'
import { friendlyError } from '../lib/errors'
import { profileSchema } from '../lib/validators'
import { updateProfile, uploadAvatar } from '../services/profileService'
import { createSkill, deleteSkill, listMySkills } from '../services/skillService'

const STEPS = [
  { key: 'basics', title: 'Tell us about you', icon: GraduationCap },
  { key: 'avatar', title: 'Add a photo', icon: Camera },
  { key: 'offer', title: 'Skills you offer', icon: HandHeart },
  { key: 'need', title: 'Skills you need', icon: Lightbulb },
  { key: 'done', title: 'You are all set', icon: PartyPopper },
]

export default function OnboardingPage() {
  const { user, profile, loading, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [skills, setSkills] = useState([])
  const [uploading, setUploading] = useState(false)
  const [finishing, setFinishing] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(profileSchema) })

  useEffect(() => {
    if (!profile) return
    reset({
      full_name: profile.full_name ?? '',
      department: DEPARTMENTS.includes(profile.department) ? profile.department : '',
      year: YEARS.includes(profile.year) ? profile.year : '',
      bio: profile.bio ?? '',
    })
  }, [profile, reset])

  useEffect(() => {
    if (!user?.id) return
    listMySkills(user.id).then(setSkills).catch(() => setSkills([]))
  }, [user?.id])

  if (loading) return <FullPageLoader />
  if (profile?.onboarding_completed) return <Navigate to="/dashboard" replace />

  const offered = skills.filter((skill) => skill.type === 'offer')
  const needed = skills.filter((skill) => skill.type === 'need')
  const current = STEPS[step]

  const saveBasics = async (values) => {
    try {
      await updateProfile(user.id, { ...values, bio: values.bio || null })
      await refreshProfile()
      setStep(1)
    } catch (error) {
      toast.error(friendlyError(error))
    }
  }

  const handleAvatar = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await uploadAvatar(user.id, file)
      await refreshProfile()
      toast.success('Photo uploaded')
    } catch (error) {
      toast.error(friendlyError(error))
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const addSkill = async (values) => {
    const created = await createSkill(user.id, values)
    setSkills((current) => [created, ...current])
    toast.success('Skill added')
  }

  const removeSkill = async (skill) => {
    try {
      await deleteSkill(skill.id)
      setSkills((current) => current.filter((item) => item.id !== skill.id))
    } catch (error) {
      toast.error(friendlyError(error))
    }
  }

  const finish = async () => {
    setFinishing(true)
    try {
      await updateProfile(user.id, { onboarding_completed: true })
      await refreshProfile()
      toast.success('You are all set! Start exploring skills now.')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      toast.error(friendlyError(error))
    } finally {
      setFinishing(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="mx-auto max-w-2xl">
        <div className="flex justify-center">
          <Logo to="/onboarding" />
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
          <ProgressBar
            value={((step + 1) / STEPS.length) * 100}
            label={`Step ${step + 1} of ${STEPS.length}`}
          />

          <div className="mt-6 flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/60 dark:text-brand-200">
              <current.icon className="size-5" aria-hidden="true" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">{current.title}</h1>
          </div>

          <div className="mt-6">
            {current.key === 'basics' && (
              <form onSubmit={handleSubmit(saveBasics)} className="space-y-4" noValidate>
                <Input label="Full name" error={errors.full_name?.message} {...register('full_name')} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Select
                    label="Department"
                    placeholder="Select department"
                    options={DEPARTMENTS}
                    error={errors.department?.message}
                    {...register('department')}
                  />
                  <Select
                    label="Year of study"
                    placeholder="Select year"
                    options={YEARS}
                    error={errors.year?.message}
                    {...register('year')}
                  />
                </div>
                <Textarea
                  label="Short bio"
                  hint="Optional, but profiles with a bio get more requests."
                  error={errors.bio?.message}
                  {...register('bio')}
                />
                <div className="flex justify-end">
                  <Button type="submit" loading={isSubmitting} icon={ArrowRight}>
                    Continue
                  </Button>
                </div>
              </form>
            )}

            {current.key === 'avatar' && (
              <div className="space-y-6 text-center">
                <Avatar url={profile?.avatar_url} name={profile?.full_name} size="xl" className="mx-auto" />
                <div>
                  <label
                    htmlFor="avatar-upload"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700"
                  >
                    <Camera className="size-4" aria-hidden="true" />
                    {uploading ? 'Uploading…' : 'Choose a photo'}
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/jpeg,image/png"
                    className="sr-only"
                    onChange={handleAvatar}
                    disabled={uploading}
                  />
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    JPEG or PNG, up to 2MB. You can skip this and add one later.
                  </p>
                </div>
              </div>
            )}

            {(current.key === 'offer' || current.key === 'need') && (
              <div className="space-y-5">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {current.key === 'offer'
                    ? 'Add at least one skill you can teach or help with.'
                    : 'Add at least one skill you would like to learn.'}
                </p>
                <div className="space-y-3">
                  {(current.key === 'offer' ? offered : needed).map((skill) => (
                    <SkillPill key={skill.id} skill={skill} onDelete={removeSkill} />
                  ))}
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
                  <SkillForm
                    key={current.key}
                    type={current.key}
                    onSubmit={addSkill}
                    submitLabel="Add skill"
                  />
                </div>
              </div>
            )}

            {current.key === 'done' && (
              <div className="space-y-4 text-center">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Your profile is ready. We will use your {needed.length} requested skill
                  {needed.length === 1 ? '' : 's'} to rank matches on the Discover page.
                </p>
                <Button size="lg" className="w-full" loading={finishing} icon={Check} onClick={finish}>
                  Start exploring SkillLink
                </Button>
              </div>
            )}
          </div>

          {current.key !== 'basics' && current.key !== 'done' && (
            <div className="mt-8 flex items-center justify-between">
              <Button variant="ghost" icon={ArrowLeft} onClick={() => setStep((value) => value - 1)}>
                Back
              </Button>
              <div className="flex items-center gap-2">
                {current.key === 'avatar' && (
                  <Button variant="ghost" onClick={() => setStep(2)}>
                    Skip
                  </Button>
                )}
                <Button
                  icon={ArrowRight}
                  disabled={
                    (current.key === 'offer' && offered.length === 0) ||
                    (current.key === 'need' && needed.length === 0)
                  }
                  onClick={() => setStep((value) => value + 1)}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
