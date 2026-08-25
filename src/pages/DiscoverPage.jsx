import { Search, SlidersHorizontal, Telescope } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { EmptyState } from '../components/common/EmptyState'
import { Input, Select } from '../components/common/Field'
import { PageHeader } from '../components/common/PageHeader'
import { CardSkeleton } from '../components/common/Skeleton'
import { RequestModal } from '../components/discover/RequestModal'
import { SkillCard } from '../components/discover/SkillCard'
import { useAuth } from '../hooks/useAuth'
import { SKILL_CATEGORIES } from '../lib/constants'
import { friendlyError } from '../lib/errors'
import { scoreMatch } from '../lib/matching'
import { listMySkills, listOfferedSkills, listSkillRelations } from '../services/skillService'

const SORTS = ['Best match', 'Highest rated', 'Fastest response', 'Newest']

export default function DiscoverPage() {
  const { user, profile } = useAuth()
  const [skills, setSkills] = useState([])
  const [relations, setRelations] = useState([])
  const [myNeeds, setMyNeeds] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState(SORTS[0])
  const [onlyMatches, setOnlyMatches] = useState(false)
  const [active, setActive] = useState(null)

  const load = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const [offered, relationRows, mine] = await Promise.all([
        listOfferedSkills({ excludeUserId: user.id, category, search }),
        listSkillRelations(),
        listMySkills(user.id),
      ])
      setSkills(offered)
      setRelations(relationRows)
      setMyNeeds(mine.filter((skill) => skill.type === 'need'))
    } catch (error) {
      toast.error(friendlyError(error))
    } finally {
      setLoading(false)
    }
  }, [user?.id, category, search])

  useEffect(() => {
    const timer = setTimeout(load, search ? 350 : 0)
    return () => clearTimeout(timer)
  }, [load, search])

  const matches = useMemo(() => {
    const scored = skills.map((skill) => ({
      skill,
      ...scoreMatch({
        offeredSkill: skill,
        provider: skill.owner,
        viewer: profile,
        neededSkills: myNeeds,
        relations,
      }),
    }))

    const filtered = onlyMatches ? scored.filter((match) => match.tier) : scored

    const sorters = {
      'Best match': (a, b) => b.score - a.score,
      'Highest rated': (a, b) => (b.skill.owner?.rating ?? 0) - (a.skill.owner?.rating ?? 0),
      'Fastest response': (a, b) =>
        (a.skill.owner?.avg_response_hours ?? 999) - (b.skill.owner?.avg_response_hours ?? 999),
      Newest: (a, b) => new Date(b.skill.created_at) - new Date(a.skill.created_at),
    }

    return [...filtered].sort(sorters[sort])
  }, [skills, profile, myNeeds, relations, onlyMatches, sort])

  return (
    <div>
      <PageHeader
        title="Discover skills"
        description={
          myNeeds.length
            ? `Ranked against the ${myNeeds.length} skill${myNeeds.length === 1 ? '' : 's'} you want to learn.`
            : 'Add skills you need on your profile to unlock personalised match scores.'
        }
      />

      <div className="mb-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4 dark:border-slate-800 dark:bg-slate-900">
        <Input
          label="Search"
          placeholder="React, essay writing, guitar…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Select
          label="Category"
          placeholder="All categories"
          options={SKILL_CATEGORIES}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        />
        <Select
          label="Sort by"
          options={SORTS}
          value={sort}
          onChange={(event) => setSort(event.target.value)}
        />
        <label className="flex items-end gap-2 pb-2.5 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={onlyMatches}
            onChange={(event) => setOnlyMatches(event.target.checked)}
            className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          Only skills I need
        </label>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : matches.length === 0 ? (
        <EmptyState
          icon={search || category || onlyMatches ? SlidersHorizontal : Telescope}
          title="No skills found"
          description={
            onlyMatches
              ? 'No one is offering the skills you listed yet. Try turning off the filter.'
              : 'Try a different search term or category. New offers appear here as students join.'
          }
        />
      ) : (
        <>
          <p className="mb-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Search className="size-4" aria-hidden="true" />
            {matches.length} skill{matches.length === 1 ? '' : 's'} available
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {matches.map((match) => (
              <SkillCard key={match.skill.id} match={match} onRequest={setActive} />
            ))}
          </div>
        </>
      )}

      <RequestModal
        match={active}
        requesterId={user?.id}
        onClose={() => setActive(null)}
      />
    </div>
  )
}
