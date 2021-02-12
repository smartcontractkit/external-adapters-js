import * as local from './local'
import * as redis from './redis'
import hash from 'object-hash'

export const RATE_CAPACITY_ENV = 'RATE_LIMIT_CAPACITY'

type RateLimitParticipant = {
  // for this this type of req, how many underlying requests to provider
  cost: number
  // importance of this type of req
  weight: number
}

export type RateLimitGroup = {
  totalCapacity: number
  participants: { [key: string]: RateLimitParticipant }
}

type RateLimitOptions = {
  groupMaxAge: number
  participantId: string
  groupsIds: string[]
  capacities: {
    [key: string]: number
  }
}

const DEFAULT_RATE_WEIGHT = 1
const DEFAULT_RATE_COST = 1

const getMatchEnvVars = (regex: string): string[] => {
  return Object.entries(process.env)
    .filter(([name]) => name.match(regex))
    .map(([_, value]) => value as string)
}

const getMatchPrefixes = (regex: string): string[] => {
  return Object.entries(process.env)
    .filter(([name]) => name.match(regex))
    .map(([name]) => name.split(regex)[0])
}

export const getGroupsIds = (prefixId = 'API_KEY'): string[] => {
  const multiple = getMatchEnvVars(prefixId)
  if (multiple.length === 0) {
    return [process.env.API_KEY || ''].map((v) => hash(v))
  }
  return multiple.map((v) => hash(v))
}

export const getCapacities = (prefixId = 'API_KEY'): { [key: string]: number } => {
  const prefixes = getMatchPrefixes(prefixId)
  return Object.fromEntries(
    prefixes.map((prefix) => {
      return [
        hash(process.env[`${prefix}${prefixId}`]),
        parseInt(process.env[`${prefix}${RATE_CAPACITY_ENV}`] || ''),
      ]
    }),
  )
}

export const makeRateLimit = (
  options: RateLimitOptions,
  cache: local.LocalLRUCache | redis.RedisCache,
) => {
  console.log(options)

  const _isEnabled = (): boolean => {
    return (
      options.groupsIds.length > 0 &&
      Object.values(options.capacities).every((c) => !!c) &&
      !(cache instanceof local.LocalLRUCache)
    )
  }

  const _getRateLimitGroup = async (groupId: string): Promise<RateLimitGroup> => {
    const result: any = (await cache.get(groupId)) || {}
    const _getMinimumCapacity = (current: number, upcoming: number) => {
      if (!current) return upcoming
      return Math.min(current, upcoming)
    }
    return {
      totalCapacity: _getMinimumCapacity(result.totalCapacity, options.capacities[groupId]),
      participants: result.participants || {},
    }
  }

  const _updateRateLimitGroup = async (
    groupId: string,
    cost: number,
    weight: number,
  ): Promise<RateLimitGroup | undefined> => {
    const rateLimitGroup = await _getRateLimitGroup(groupId)
    const newGroup = {
      totalCapacity: rateLimitGroup.totalCapacity,
      participants: {
        ...rateLimitGroup.participants,
        [options.participantId]: {
          cost,
          weight,
        },
      },
    }
    if (!(cache instanceof local.LocalLRUCache)) {
      try {
        await cache.setKeepingMaxAge(groupId, newGroup, options.groupMaxAge)
      } catch (e) {
        console.log(e)
      }
    }
    return newGroup
  }

  const _updateRateLimitGroups = async (cost = DEFAULT_RATE_COST, weight = DEFAULT_RATE_WEIGHT) => {
    return await options.groupsIds.map(
      async (groupId) => await _updateRateLimitGroup(groupId, cost, weight),
    )
  }

  const _getGroupsParticipantMaxAge = async () => {
    const maxAges = await Promise.all(
      options.groupsIds.map(async (groupId) => {
        const group = await _getRateLimitGroup(groupId)
        return await _getParticipantMaxAge(group, options.participantId)
      }),
    )
    return Math.max(...maxAges)
  }

  const _getParticipantMaxAge = async (
    rlGroup: RateLimitGroup,
    participantId: string,
  ): Promise<number> => {
    const SEC_IN_MIN = 60
    const MS_IN_SEC = 1000

    // to be on the safe side, we don't use max capacity
    const _safeCapacity = (num: number) => num * 0.9
    // capacity for participant depends on its weight vs group weight
    const _capacityFor = (participant: RateLimitParticipant) => {
      const groupWeight = Object.values(rlGroup.participants).reduce(
        (acc, val) => acc + val.weight,
        0,
      )
      return (_safeCapacity(rlGroup.totalCapacity) * participant.weight) / groupWeight
    }
    // how often should we cache requests to be under capacity limit
    const _maxAgeFor = (participant: RateLimitParticipant) => {
      const capacity = _capacityFor(participant)
      const rps = capacity / SEC_IN_MIN / participant.cost
      return Math.round(MS_IN_SEC / rps)
    }
    const participantsMaxAge = Object.fromEntries(
      Object.entries(rlGroup.participants).map(([id, _]) => [
        id,
        _maxAgeFor(rlGroup.participants[id]),
      ]),
    )
    return participantsMaxAge[participantId]
  }

  const _ifEnabled = (fn: (...args: any[]) => Promise<any>) => (_isEnabled() ? fn : () => false)
  return {
    isEnabled: _isEnabled,
    getRateLimitGroup: _ifEnabled(_getRateLimitGroup),
    updateRateLimitGroups: _ifEnabled(_updateRateLimitGroups),
    getMaxAge: _ifEnabled(_getGroupsParticipantMaxAge),
  }
}
