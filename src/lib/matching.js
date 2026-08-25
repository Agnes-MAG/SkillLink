// Tiered matching engine described in the SkillLink business logic spec.
//
//   Tier 1  exact skill-name match
//   Tier 2  same category
//   Tier 3  skill-graph / semantic neighbours
//
// The tiers produce `skillMatchQuality` (0..1) which is then blended with the
// provider's trust signals into a single 0..100 match score.

const DEFAULT_SKILL_GRAPH = {
  react: ['javascript', 'frontend', 'web development', 'typescript', 'next.js'],
  javascript: ['react', 'node.js', 'typescript', 'web development'],
  typescript: ['javascript', 'react', 'node.js'],
  python: ['data science', 'machine learning', 'django', 'automation'],
  'machine learning': ['python', 'data science', 'statistics'],
  'data science': ['python', 'statistics', 'machine learning', 'excel'],
  figma: ['ui design', 'ux design', 'graphic design', 'prototyping'],
  'graphic design': ['figma', 'photoshop', 'illustration', 'branding'],
  'public speaking': ['debate', 'presentation', 'communication'],
  writing: ['copywriting', 'editing', 'research', 'essay writing'],
  spanish: ['french', 'language exchange'],
  guitar: ['music theory', 'piano', 'songwriting'],
}

export const MATCH_WEIGHTS = {
  skill: 0.35,
  rating: 0.2,
  responseTime: 0.15,
  completionRate: 0.15,
  proximity: 0.1,
  recentActivity: 0.05,
}

const normalize = (value) => (value ?? '').toString().trim().toLowerCase()

function buildGraph(relations) {
  if (!relations?.length) return DEFAULT_SKILL_GRAPH
  return relations.reduce((graph, relation) => {
    const key = normalize(relation.skill_name)
    graph[key] = [...(graph[key] ?? []), normalize(relation.related_name)]
    return graph
  }, {})
}

/**
 * Compares one offered skill against every skill the viewer needs.
 * Returns { quality, tier, matchedNeed } where quality is 0..1.
 */
export function skillMatchQuality(offeredSkill, neededSkills, relations) {
  const graph = buildGraph(relations)
  const offeredName = normalize(offeredSkill.name)
  const neighbours = graph[offeredName] ?? []

  let best = { quality: 0, tier: null, matchedNeed: null }

  for (const need of neededSkills ?? []) {
    const needName = normalize(need.name)
    let quality = 0
    let tier = null

    if (needName === offeredName) {
      quality = 1
      tier = 'exact'
    } else if (neighbours.includes(needName) || (graph[needName] ?? []).includes(offeredName)) {
      quality = 0.75
      tier = 'related'
    } else if (need.category === offeredSkill.category) {
      quality = 0.55
      tier = 'category'
    } else if (needName.includes(offeredName) || offeredName.includes(needName)) {
      quality = 0.45
      tier = 'partial'
    }

    if (quality > best.quality) best = { quality, tier, matchedNeed: need }
  }

  return best
}

function recencyScore(lastSeenAt) {
  if (!lastSeenAt) return 0
  const hours = (Date.now() - new Date(lastSeenAt).getTime()) / 3_600_000
  if (hours <= 24) return 1
  if (hours <= 72) return 0.6
  if (hours <= 24 * 14) return 0.3
  return 0
}

function responseTimeScore(provider) {
  // Prefer the measured average; fall back to the coarse response-rate metric.
  if (provider.avg_response_hours == null || provider.avg_response_hours === 0) {
    return (provider.response_rate ?? 0) / 100
  }
  if (provider.avg_response_hours <= 6) return 1
  if (provider.avg_response_hours <= 24) return 0.7
  if (provider.avg_response_hours <= 72) return 0.4
  return 0.15
}

/**
 * Blends skill relevance with the provider's trust signals.
 * @returns {{ score: number, tier: string|null, matchedNeed: object|null, breakdown: object }}
 */
export function scoreMatch({ offeredSkill, provider, viewer, neededSkills, relations }) {
  const { quality, tier, matchedNeed } = skillMatchQuality(offeredSkill, neededSkills, relations)

  const breakdown = {
    skill: quality,
    rating: (provider.rating ?? 0) / 5,
    responseTime: responseTimeScore(provider),
    completionRate: (provider.completion_rate ?? 0) / 100,
    proximity: viewer?.department && viewer.department === provider.department ? 1 : 0,
    recentActivity: recencyScore(provider.last_seen_at),
  }

  const score = Object.entries(MATCH_WEIGHTS).reduce(
    (total, [key, weight]) => total + weight * breakdown[key],
    0,
  )

  return { score: Math.round(score * 100), tier, matchedNeed, breakdown }
}

export function matchLabel(score) {
  if (score > 80) return { label: 'Excellent match', tone: 'excellent' }
  if (score >= 60) return { label: 'Good match', tone: 'good' }
  return { label: 'Possible match', tone: 'possible' }
}
