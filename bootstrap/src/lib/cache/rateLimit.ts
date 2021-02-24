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
  getParticipantMaxAge: (a: string) => Promise<number> | boolean
  incrementTotalHeartbeat: () => Promise<number> | boolean
  incrementParticipantHeartbeat: (a: string) => Promise<number> | boolean
}

const totalHeartbeat = new Map()
const participantHeartbeats = new Map()

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
    const totalParticipants = Array.from(participantHeartbeats.keys()).length || 1
    return safeCapacity / totalParticipants
  }

  const _getParticipantMaxAge = async (participantId: string) => {
    const SEC_IN_MIN = 60
    const MS_IN_SEC = 1000

    const participantHeartbeat = await _getCurrentParticipantHeartbeat(
      _getParticipantKey(participantId),
    )
    const totalHeartbeat = await _getCurrentHeartbeat()
    const participantWeight = _getWeight(participantHeartbeat, totalHeartbeat)
    // const allowedReqPerMin = _getParticipantEvenCapacity()
    const allowedReqPerMin = safeCapacity * participantWeight

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

  const _getCurrentHeartbeat = async (): Promise<number> => {
    return Number(totalHeartbeat.get(_getHeartbeatKey())) || 0
  }

  const _incrementTotalHeartbeat = async (): Promise<number> => {
    const heartbeat = await _getCurrentHeartbeat()
    totalHeartbeat.set(_getHeartbeatKey(), heartbeat + 1)
    // if (!(cache instanceof local.LocalLRUCache)) {
    //   await cache.update(_getHeartbeatKey(), heartbeat + 1, options.groupMaxAge)
    // }
    return heartbeat + 1
  }

  // hash(API_KEY):uuid():CACHE_KEY_GROUP:hash(requestData)
  const _getParticipantKey = (keyId: string) => {
    return `${_getHeartbeatKey()}:${keyId}`
  }

  const _getCurrentParticipantHeartbeat = async (key: string): Promise<number> => {
    return Number(participantHeartbeats.get(key)) || 0
  }

  const _incrementParticipantHeartbeat = async (participantId: string): Promise<number> => {
    const heartbeat = await _getCurrentParticipantHeartbeat(_getParticipantKey(participantId))
    participantHeartbeats.set(_getParticipantKey(participantId), heartbeat + 1)
    // if (!(cache instanceof local.LocalLRUCache)) {
    //   await cache.update(_getParticipantKey(participantId), heartbeat + 1, options.groupMaxAge)
    // }
    return heartbeat + 1
  }

  const _ifEnabled = (fn: (...args: any[]) => Promise<any>) => (_isEnabled() ? fn : () => false)
  return {
    isEnabled: _isEnabled,
    getParticipantMaxAge: _ifEnabled(_getParticipantMaxAge),
    incrementTotalHeartbeat: _ifEnabled(_incrementTotalHeartbeat),
    incrementParticipantHeartbeat: _ifEnabled(_incrementParticipantHeartbeat),
  }
}
