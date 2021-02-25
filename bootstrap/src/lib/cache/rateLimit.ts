import { logger } from '@chainlink/external-adapter'
import * as local from './local'
import * as redis from './redis'
import { DEFAULT_CACHE_MAX_AGE } from './redis'

const MAX_AGE_ALLOWED = 1000 * 60 * 2

type RateLimitOptions = {
  groupMaxAge: number
  groupId: string
  id: string
  totalCapacity: number
}

interface RateLimit {
  isEnabled: () => boolean
  getParticipantMaxAge: (participantId: string) => number | boolean
  incrementTotalHeartbeat: () => number | boolean
  incrementParticipantHeartbeat: (participantId: string) => number | boolean
}

type Heartbeat = {
  heartbeat: number
  lastSeen: number
}

const totalHeartbeat = new Map()
let participantHeartbeats: Map<string, Heartbeat> = new Map()

export const makeRateLimit = (
  options: RateLimitOptions,
  cache: local.LocalLRUCache | redis.RedisCache,
): RateLimit => {
  const minHeartbeat = 0
  const safeCapacity = options.totalCapacity * 0.9

  const _isEnabled = (): boolean => {
    return !!options.groupId && !!options.totalCapacity && !(cache instanceof local.LocalLRUCache)
  }

  // Weight normalizes the relevance the participant is having in the adapter
  const _getWeight = (participantHeartbeat: number, totalHeartbeat: number): number => {
    // Avoid having Infinity weight
    if (participantHeartbeat === 0) {
      participantHeartbeat = 1
    }
    if (totalHeartbeat === 0) {
      totalHeartbeat = 1
    }
    return (participantHeartbeat - minHeartbeat) / (totalHeartbeat - minHeartbeat)
  }

  const _getParticipantEvenCapacity = () => {
    const totalParticipants = participantHeartbeats.size || 1
    return safeCapacity / totalParticipants
  }

  const _getParticipantMaxAge = (participantId: string): number => {
    const SEC_IN_MIN = 60
    const MS_IN_SEC = 1000

    const participantHeartbeat = _getCurrentParticipantHeartbeat(participantId)
    const totalHeartbeat = _getCurrentHeartbeat()
    const participantWeight = _getWeight(participantHeartbeat, totalHeartbeat)
    const allowedReqPerMin = _getParticipantEvenCapacity()
    // const allowedReqPerMin = safeCapacity * participantWeight

    let maxAge = Math.round(MS_IN_SEC / (allowedReqPerMin / SEC_IN_MIN))
    if (maxAge < DEFAULT_CACHE_MAX_AGE) {
      maxAge = DEFAULT_CACHE_MAX_AGE
    } else if (maxAge >= MAX_AGE_ALLOWED) {
      maxAge = MAX_AGE_ALLOWED
    }
    return maxAge
  }

  // hash(API_KEY):uuid()
  const _getHeartbeatKey = () => {
    return `${options.groupId}:${options.id}`
  }

  const _getCurrentHeartbeat = (): number => {
    return Number(totalHeartbeat.get(_getHeartbeatKey())) || 0
  }

  const _incrementTotalHeartbeat = (): number => {
    const heartbeat = _getCurrentHeartbeat()
    totalHeartbeat.set(_getHeartbeatKey(), heartbeat + 1)
    return heartbeat + 1
  }

  const _getCurrentParticipantHeartbeat = (key: string): number => {
    return Number(participantHeartbeats.get(key)?.heartbeat) || 0
  }

  const _removedExpiredHeartbeats = (
    heartbeats: Map<string, Heartbeat>,
  ): Map<string, Heartbeat> => {
    const heartbeatsCopy = new Map(heartbeats)
    const now = new Date().getTime()
    for (const [id, heartbeat] of heartbeats) {
      if (now - heartbeat.lastSeen > options.groupMaxAge) {
        heartbeatsCopy.delete(id)
        logger.debug(`Cache: Participant ${id} has expired. Removing`)
      }
    }
    return heartbeatsCopy
  }

  const _withExpiration = (fn: any) => (...args: any) => {
    const updatedParticipantHearbeats = _removedExpiredHeartbeats(participantHeartbeats)
    participantHeartbeats = updatedParticipantHearbeats
    return fn(...args)
  }

  const _incrementParticipantHeartbeat = (participantId: string): number => {
    const heartbeat = _getCurrentParticipantHeartbeat(participantId)
    participantHeartbeats.set(participantId, {
      heartbeat: heartbeat + 1,
      lastSeen: new Date().getTime(),
    })
    return heartbeat + 1
  }

  const _ifEnabled = (fn: (...args: any[]) => any) => (_isEnabled() ? fn : () => false)
  return {
    isEnabled: _isEnabled,
    getParticipantMaxAge: _ifEnabled(_getParticipantMaxAge),
    incrementTotalHeartbeat: _ifEnabled(_withExpiration(_incrementTotalHeartbeat)),
    incrementParticipantHeartbeat: _ifEnabled(_withExpiration(_incrementParticipantHeartbeat)),
  }
}
