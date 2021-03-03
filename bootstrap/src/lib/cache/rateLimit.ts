import { logger } from '@chainlink/external-adapter'

interface RateLimitOptions {
  participantMaxAge: number
  totalCapacity: number
  maxAgeLimits: {
    min: number
    max: number
  }
}

/**
 * RateLimit expose every public method related to Rate Limiting
 */
export interface RateLimit {
  isEnabled: boolean
  getParticipantMaxAge: ((participantId: string) => number) | (() => void)
  incrementParticipantHeartbeat: ((participantId: string, cost?: number) => void) | (() => void)
  newParticipant: ((participantId: string, cost?: number) => void) | (() => void)
  getParticipant: ((participantId: string) => Participant | undefined) | (() => void)
}

/**
 * Participant holds the information from the adapter requesting to this adapter
 *
 * @cost {number} Holds the internal calls the participant makes
 * @heartbeat {number} Incremental counter with every request made by this participant
 * @lastSeen {number} Time (secs) the participant made the last request
 */
interface Participant {
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
  // We use the 90 % of the capacity to always be on the safe side
  const safeCapacity = options.totalCapacity * 0.9
  const participantsOps = makeParticipants(options.participantMaxAge)

  const isEnabled = !!options.totalCapacity
  const noop = (): void => {
    return
  }

  const _getNormalizedReqPerMinFor = (participantId: string): number => {
    // Weight normalizes the relevance the participant is having in the adapter
    const _getWeight = (participantHeartbeat: number): number => {
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
    const participantHeartbeat = participantsOps.getParticipant(participantId)?.heartbeat || 1
    const participantWeight = _getWeight(participantHeartbeat)
    return safeCapacity * participantWeight
  }

  // Gets the allowed request per minute a participant can make.
  // e.g. if the capacity is 10 req/min, and there are 5 participants, each of them would be able to make 2 request per minute
  // Some participants can make internal calls. If one of the 5 participants makes 2 internal requests, he will be able to make 1 request per minute (that is 2 in reality)
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

    const allowedReqPerMin = _getReqPerMinFor(participantId)

    // the max age we set becomes the average age of a request coming in
    // e.g. if we have 5 req per min, then the max age will be 250ms, since that means on average we have a request coming in every 250ms
    // the calculated max age is bounded to the range of [options.maxAgeLimits.min, options.maxAgeLimits.max]
    let maxAge = Math.round(MS_IN_SEC / (allowedReqPerMin / SEC_IN_MIN))
    if (maxAge < options.maxAgeLimits.min) {
      maxAge = options.maxAgeLimits.min
    } else if (maxAge >= options.maxAgeLimits.max) {
      logger.warn(
        `Cache: Max age is hitting the maximum values (${options.maxAgeLimits.max} ms). Too many dependent adapters`,
      )
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

  const _getParticipant = (participantId: string): Participant | undefined => {
    return participantsOps.getParticipant(participantId)
  }

  return {
    isEnabled,
    getParticipantMaxAge: isEnabled ? _getParticipantMaxAge : noop,
    incrementParticipantHeartbeat: isEnabled ? _incrementParticipantHeartbeat : noop,
    newParticipant: isEnabled ? _newParticipant : noop,
    getParticipant: isEnabled ? _getParticipant : noop,
  }
}
