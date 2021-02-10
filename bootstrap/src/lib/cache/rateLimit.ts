import * as local from './local'
import * as redis from './redis'

type RateLimitParticipant = {
  // for this this type of req, how many underlying requests to provider
  cost: number
  // importance of this type of req
  weight: number
}

type RateLimitGroup = {
  totalCapacity: number
  participants: { [key: string]: RateLimitParticipant }
}

type RateLimitOptions = {
  groupMaxAge: number
  groupId: string
  participantId: string
  totalCapacity: number
}

const DEFAULT_RATE_WEIGHT = 1
const DEFAULT_RATE_COST = 1

export const makeRateLimit = (
  options: RateLimitOptions,
  cache: local.LocalLRUCache | redis.RedisCache,
) => {
  const _isEnabled = (): boolean => {
    return !!options.groupId && !!options.totalCapacity && !(cache instanceof local.LocalLRUCache)
  }

  const _getRateLimitGroup = async (): Promise<RateLimitGroup> => {
    const result: any = (await cache.get(options.groupId)) || {}
    const _getMinimumCapacity = (current: number, upcoming: number) => {
      if (!current) return upcoming
      return Math.min(current, upcoming)
    }
    return {
      totalCapacity: _getMinimumCapacity(result.totalCapacity, options.totalCapacity),
      participants: result.participants || {},
    }
  }

  const _updateRateLimitGroup = async (
    cost = DEFAULT_RATE_COST,
    weight = DEFAULT_RATE_WEIGHT,
  ): Promise<RateLimitGroup | undefined> => {
    const rateLimitGroup = await _getRateLimitGroup()
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
      await cache.setKeepingMaxAge(options.groupId, newGroup, options.groupMaxAge)
    }
    return newGroup
  }

  const _getParticipantMaxAge = async () => {
    const participantId = options.participantId
    const rlGroup = await _getRateLimitGroup()
    if (!rlGroup) return

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
    getRateLimitGroup: _ifEnabled(_getRateLimitGroup),
    updateRateLimitGroup: _ifEnabled(_updateRateLimitGroup),
    getParticipantMaxAge: _ifEnabled(_getParticipantMaxAge),
  }
}
