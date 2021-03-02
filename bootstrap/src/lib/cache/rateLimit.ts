import { logger } from '@chainlink/external-adapter'
import { DEFAULT_CACHE_MAX_AGE } from './redis'

const MAX_AGE_ALLOWED = 1000 * 60 * 2

type RateLimitOptions = {
  groupMaxAge: number
  groupId: string
  id: string
  totalCapacity: number
}

export interface RateLimit {
  isEnabled: () => boolean
  getParticipantMaxAge: (participantId: string) => number | false
  incrementParticipantHeartbeat: (participantId: string, cost?: number) => number | false
}

type Participant = {
  cost: number
  heartbeat: number
  lastSeen: number
}

const totalHeartbeat = new Map()
let participants: Map<string, Participant> = new Map()

export const makeRateLimit = (options: RateLimitOptions): RateLimit => {
  const minHeartbeat = 0
  const safeCapacity = options.totalCapacity * 0.9

  const _isEnabled = (): boolean => {
    return !!options.groupId && !!options.totalCapacity
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

  const _getParticipant = (participantId: string): Participant => {
    return (
      participants.get(participantId) || { cost: 1, heartbeat: 0, lastSeen: new Date().getTime() }
    )
  }

  const _getParticipantEvenCapacity = (participantId: string) => {
    const totalParticipants = participants.size || 1
    return safeCapacity / totalParticipants / _getParticipant(participantId).cost
  }

  const _getParticipantMaxAge = (participantId: string): number => {
    const SEC_IN_MIN = 60
    const MS_IN_SEC = 1000

    // Precise Capacity
    // const participantHeartbeat = _getParticipant(participantId).heartbeat
    // const totalHeartbeat = _getCurrentHeartbeat()
    // const participantWeight = _getWeight(participantHeartbeat, totalHeartbeat)
    // const allowedReqPerMin = safeCapacity * participantWeight

    const allowedReqPerMin = _getParticipantEvenCapacity(participantId)
    console.log('PARTICIPANT CAPACITY: ', allowedReqPerMin)

    let maxAge = Math.round(MS_IN_SEC / (allowedReqPerMin / SEC_IN_MIN))
    if (maxAge < DEFAULT_CACHE_MAX_AGE) {
      maxAge = DEFAULT_CACHE_MAX_AGE
    } else if (maxAge >= MAX_AGE_ALLOWED) {
      maxAge = MAX_AGE_ALLOWED
    }
    return maxAge
  }

  const _getUpdatedParticipant = (participantId: string, cost?: number): Participant => {
    const participant = _getParticipant(participantId)
    return {
      cost: cost || participant.cost,
      heartbeat: participant.heartbeat + 1,
      lastSeen: new Date().getTime(),
    }
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

  const _incrementParticipantHeartbeat = (participantId: string, cost?: number): number => {
    _incrementTotalHeartbeat()
    const updatedParticipant = _getUpdatedParticipant(participantId, cost)
    participants.set(participantId, updatedParticipant)
    console.log(participants)

    return updatedParticipant.heartbeat
  }

  const _getNonExpiredParticipants = (
    heartbeats: Map<string, Participant>,
  ): Map<string, Participant> => {
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
    const updatedParticipantHearbeats = _getNonExpiredParticipants(participants)
    participants = updatedParticipantHearbeats
    return fn(...args)
  }

  const _ifEnabled = (fn: (...args: any[]) => any) => (_isEnabled() ? fn : () => false)
  return {
    isEnabled: _isEnabled,
    getParticipantMaxAge: _ifEnabled(_getParticipantMaxAge),
    incrementParticipantHeartbeat: _ifEnabled(_withExpiration(_incrementParticipantHeartbeat)),
  }
}
