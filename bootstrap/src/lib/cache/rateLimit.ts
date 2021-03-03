import { logger } from '@chainlink/external-adapter'

type RateLimitOptions = {
  participantMaxAge: number
  groupId: string
  totalCapacity: number
  maxAgeLimits: {
    min: number
    max: number
  }
}

export interface RateLimit {
  isEnabled: boolean
  getParticipantMaxAge: ((participantId: string) => number) | (() => void)
  incrementParticipantHeartbeat: ((participantId: string, cost?: number) => void) | (() => void)
  newParticipant: ((participantId: string, cost?: number) => void) | (() => void)
}

type Participant = {
  cost: number
  heartbeat: number
  lastSeen: number
}

let participants: Map<string, Participant> = new Map()

const makeParticipants = (participantMaxAge: number) => {
  const DEFAULT_COST = 1

  const getParticipant = (participantId: string): Participant | undefined => {
    return participants.get(participantId)
  }

  const createParticipant = (participantId: string, cost?: number): Participant => {
    let currentParticipant = getParticipant(participantId)
    // If the participant exists, we don't create a new one. It updates the cost in case it exists
    if (currentParticipant) {
      if (cost && cost !== currentParticipant.cost) {
        currentParticipant = {
          cost: cost,
          heartbeat: currentParticipant.heartbeat,
          lastSeen: currentParticipant.lastSeen,
        }
        participants.set(participantId, currentParticipant)
      }
      return currentParticipant
    }

    const participant = { cost: cost || DEFAULT_COST, heartbeat: 0, lastSeen: Date.now() }
    participants.set(participantId, participant)
    return participant
  }

  const increaseParticipantHeartbeat = (participantId: string) => {
    const participant = getParticipant(participantId) || createParticipant(participantId)
    participants.set(participantId, {
      cost: participant.cost,
      heartbeat: participant.heartbeat + 1,
      lastSeen: Date.now(),
    })
  }

  const getTotalParticipants = (): number => {
    return participants.size
  }

  const refreshParticipants = () => {
    const participantsCopy = new Map(participants)
    const now = Date.now()
    for (const [id, heartbeat] of participants) {
      if (now - heartbeat.lastSeen > participantMaxAge) {
        participantsCopy.delete(id)
        logger.debug(`Cache: Participant ${id} has expired. Removing`)
      }
    }
    participants = participantsCopy
  }

  return {
    getParticipant,
    increaseParticipantHeartbeat,
    createParticipant,
    getTotalParticipants,
    refreshParticipants,
  }
}

let totalHeartbeat = 0

export const makeRateLimit = (options: RateLimitOptions): RateLimit => {
  const safeCapacity = options.totalCapacity * 0.9
  const participantsOps = makeParticipants(options.participantMaxAge)

  const isEnabled = !!(options.groupId && options.totalCapacity)
  const noop = (): void => {
    return
  }

  // Weight normalizes the relevance the participant is having in the adapter
  const _getWeight = (participantHeartbeat: number, totalHeartbeat: number): number => {
    const minHeartbeat = 0
    // Avoid having Infinity weight
    if (participantHeartbeat === 0) {
      participantHeartbeat = 1
    }
    if (totalHeartbeat === 0) {
      totalHeartbeat = 1
    }
    return (participantHeartbeat - minHeartbeat) / (totalHeartbeat - minHeartbeat)
  }

  const _getReqPerMinFor = (participantId: string): number => {
    const totalParticipants = participantsOps.getTotalParticipants() || 1
    const safeCapacityPerParticipant = safeCapacity / totalParticipants
    const requestRatePerMinForParticipant =
      safeCapacityPerParticipant / (participantsOps.getParticipant(participantId)?.cost || 1)
    return requestRatePerMinForParticipant
  }

  const _getParticipantMaxAge = (participantId: string): number => {
    const SEC_IN_MIN = 60
    const MS_IN_SEC = 1000

    // Precise Capacity
    // const participantHeartbeat = participantsOps.getParticipant(participantId)?.heartbeat || 1
    // const participantWeight = _getWeight(participantHeartbeat, totalHeartbeat)
    // const allowedReqPerMin = safeCapacity * participantWeight

    const allowedReqPerMin = _getReqPerMinFor(participantId)

    let maxAge = Math.round(MS_IN_SEC / (allowedReqPerMin / SEC_IN_MIN))
    if (maxAge < options.maxAgeLimits.min) {
      maxAge = options.maxAgeLimits.min
    } else if (maxAge >= options.maxAgeLimits.max) {
      logger.warn(`Cache: Max age is hitting the maximum values. Too many dependent adapters`)
      maxAge = options.maxAgeLimits.max
    }
    return maxAge
  }

  const _incrementParticipantHeartbeat = (participantId: string) => {
    totalHeartbeat++
    participantsOps.refreshParticipants()
    participantsOps.increaseParticipantHeartbeat(participantId)
  }

  const _newParticipant = (participantId: string, cost?: number) => {
    participantsOps.createParticipant(participantId, cost)
  }

  return {
    isEnabled,
    getParticipantMaxAge: isEnabled ? _getParticipantMaxAge : noop,
    incrementParticipantHeartbeat: isEnabled ? _incrementParticipantHeartbeat : noop,
    newParticipant: isEnabled ? _newParticipant : noop,
  }
}
