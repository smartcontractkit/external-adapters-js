import * as local from './local'
import * as redis from './redis'

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
    return (participantHeartbeat - minHeartbeat) / (totalHeartbeat - minHeartbeat)
  }

  const _getParticipantMaxAge = async (participantId: string) => {
    const SEC_IN_MIN = 60
    const MS_IN_SEC = 1000

    const participantHeartbeat = await _getCurrentParticipantHeartbeat(
      _getParticipantKey(participantId),
    )
    const totalHeartbeat = await _getCurrentHeartbeat()
    const participantWeight = _getWeight(participantHeartbeat, totalHeartbeat)
    const allowedReqPerMin = safeCapacity * participantWeight

    return MS_IN_SEC / (allowedReqPerMin / SEC_IN_MIN)
  }

  const _getHeartbeatKey = () => {
    return `${options.groupId}:${options.id}`
  }

  const _getCurrentHeartbeat = async (): Promise<number> => {
    return Number(await cache.get(_getHeartbeatKey())) || 0
  }

  const _incrementTotalHeartbeat = async (): Promise<number> => {
    const heartbeat = await _getCurrentHeartbeat()
    if (!(cache instanceof local.LocalLRUCache)) {
      await cache.update(_getHeartbeatKey(), heartbeat + 1, options.groupMaxAge)
    }
    return heartbeat + 1
  }

  const _getParticipantKey = (keyId: string) => {
    return `${_getHeartbeatKey()}:${keyId}`
  }

  const _getCurrentParticipantHeartbeat = async (key: string): Promise<number> => {
    return Number(await cache.get(key)) || 0
  }

  const _incrementParticipantHeartbeat = async (participantId: string): Promise<number> => {
    const heartbeat = await _getCurrentParticipantHeartbeat(_getParticipantKey(participantId))
    if (!(cache instanceof local.LocalLRUCache)) {
      await cache.update(_getHeartbeatKey(), heartbeat + 1, options.groupMaxAge)
    }
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
