import { zodResolver } from '@hookform/resolvers/zod'
import { Camera, HandHeart, Lightbulb, PauseCircle, PlayCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useParams } from 'react-router-dom'
import { Avatar } from '../components/common/Avatar'
import { Badge } from '../components/common/Badge'
import { Button } from '../components/common/Button'
import { Input, Select, Textarea } from '../components/common/Field'
import { PageHeader } from '../components/common/PageHeader'
import { ProgressBar } from '../components/common/ProgressBar'
import { CardSkeleton } from '../components/common/Skeleton'
import { ProfileStats } from '../components/profile/ProfileStats'
import { RatingList } from '../components/profile/RatingList'
import { SkillManager } from '../components/skills/SkillManager'
import { SkillPill } from '../components/skills/SkillPill'
import { useAuth } from '../hooks/useAuth'
import { DEPARTMENTS, YEARS } from '../lib/constants'
import { friendlyError } from '../lib/errors'
import { profileCompletion } from '../lib/profileCompletion'
import { profileSchema } from '../lib/validators'
import { getProfile, updateProfile, uploadAvatar } from '../services/profileService'
import { listRatingsFor } from '../services/sessionService'
import { listSkillsForUser } from '../services/skillService'

export default function ProfilePage() {
  const { userId } = useParams()
  const { user, profile: myProfile, refreshProfile } = useAuth()
  const isOwn = !userId || userId === user?.id

  const [profile, setProfile] = useState(isOwn ? myProfile : null)
  const [skills, setSkills] = useState([])
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const targetId = isOwn ? user?.id : userId

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({ resolver: zodResolver(profileSchema) })

  const load = useCallback(async () => {
    if (!targetId) return
    setLoading(true)
    try {
      const [profileRow, skillRows, ratingRows] = await Promise.all([
        isOwn ? Promise.resolve(myProfile) : getProfile(targetId),
        listSkillsForUser(targetId),
        listRatingsFor(targetId),
      ])
      setProfile(profileRow)
      setSkills(skillRows)
      setRatings(ratingRows)
    } catch (error) {
      toast.error(friendlyError(error))
    } finally {
      setLoading(false)
    }
  }, [targetId, isOwn, myProfile])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!isOwn || !myProfile) return
    reset({
      full_name: myProfile.full_name ?? '',
      department: DEPARTMENTS.includes(myProfile.department) ? myProfile.department : '',
      year: YEARS.includes(myProfile.year) ? myProfile.year : '',
      bio: myProfile.bio ?? '',
    })
  }, [isOwn, myProfile, reset])

  const saveProfile = async (values) => {
    try {
      const updated = await updateProfile(user.id, { ...values, bio: values.bio || null })
      setProfile(updated)
      await refreshProfile()
      toast.success('Profile saved')
    } catch (error) {
      toast.error(friendlyError(error))
    }
  }

  const handleAvatar = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const updated = await uploadAvatar(user.id, file)
      setProfile(updated)
      await refreshProfile()
      toast.success('Photo updated')
    } catch (error) {
      toast.error(friendlyError(error))
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const toggleAvailability = async () => {
    try {
      const updated = await updateProfile(user.id, {
        accepting_requests: !profile.accepting_requests,
      })
      setProfile(updated)
      await refreshProfile()
      toast.success(updated.accepting_requests ? 'You are accepting requests' : 'Requests paused')
    } catch (error) {
      toast.error(friendlyError(error))
    }
  }

  if (loading && !profile) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  const completion = profileCompletion(profile, skills)
  const offered = skills.filter((skill) => skill.type === 'offer')
  const needed = skills.filter((skill) => skill.type === 'need')

  return (
    <div className="space-y-6">
      <PageHeader
        title={isOwn ? 'Your profile' : (profile?.full_name ?? 'Student profile')}
        description={
          isOwn
            ? 'Keep your profile complete so the matching engine can find you the right partners.'
            : `${profile?.department ?? 'Campus'} · ${profile?.year ?? ''} year`
        }
        action={
          isOwn && (
            <Button
              variant="secondary"
              icon={profile?.accepting_requests ? PauseCircle : PlayCircle}
              onClick={toggleAvailability}
            >
              {profile?.accepting_requests ? 'Pause requests' : 'Accept requests'}
            </Button>
          )
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {isOwn ? (
            <form
              onSubmit={handleSubmit(saveProfile)}
              className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
              noValidate
            >
              <div className="flex items-center gap-4">
                <Avatar url={profile?.avatar_url} name={profile?.full_name} size="lg" />
                <div>
                  <label
                    htmlFor="profile-avatar"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700"
                  >
                    <Camera className="size-4" aria-hidden="true" />
                    {uploading ? 'Uploading…' : 'Change photo'}
                  </label>
                  <input
                    id="profile-avatar"
                    type="file"
                    accept="image/jpeg,image/png"
                    className="sr-only"
                    onChange={handleAvatar}
                    disabled={uploading}
                  />
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    JPEG or PNG, max 2MB.
                  </p>
                </div>
              </div>

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
              <Textarea label="Bio" error={errors.bio?.message} {...register('bio')} />

              <div className="flex justify-end">
                <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
                  Save changes
                </Button>
              </div>
            </form>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-4">
                <Avatar url={profile?.avatar_url} name={profile?.full_name} size="lg" />
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                    {profile?.full_name}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {profile?.department} · {profile?.year} year
                  </p>
                  {!profile?.accepting_requests && (
                    <Badge tone="warning" className="mt-2">
                      Not accepting requests
                    </Badge>
                  )}
                </div>
              </div>
              {profile?.bio && (
                <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{profile.bio}</p>
              )}
            </div>
          )}

          {isOwn ? (
            <>
              <SkillManager
                userId={user.id}
                type="offer"
                skills={skills}
                onChange={setSkills}
                emptyIcon={HandHeart}
                emptyTitle="No skills offered yet"
                emptyText="Add what you can teach so other students can find you."
              />
              <SkillManager
                userId={user.id}
                type="need"
                skills={skills}
                onChange={setSkills}
                emptyIcon={Lightbulb}
                emptyTitle="No learning goals yet"
                emptyText="Tell us what you want to learn to personalise your matches."
              />
            </>
          ) : (
            <div className="space-y-5">
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Offers
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {offered.map((skill) => (
                    <SkillPill key={skill.id} skill={skill} />
                  ))}
                </div>
              </section>
              <section>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Wants to learn
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {needed.map((skill) => (
                    <SkillPill key={skill.id} skill={skill} />
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          {isOwn && (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <ProgressBar label="Profile completion" value={completion.score} />
              {completion.missing.length > 0 ? (
                <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                  {completion.missing.map((item) => (
                    <li key={item.key} className="flex items-center gap-2">
                      <span aria-hidden="true" className="size-1.5 rounded-full bg-brand-400" />
                      {item.label}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-emerald-600 dark:text-emerald-400">
                  Your profile is complete. Nice work.
                </p>
              )}
            </div>
          )}

          <ProfileStats profile={profile} />

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Recent reviews
            </h2>
            <RatingList ratings={ratings} />
          </section>
        </aside>
      </div>
    </div>
  )
}
