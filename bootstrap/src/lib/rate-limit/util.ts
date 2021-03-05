import { AdapterRequest } from '@chainlink/types'
import hash from 'object-hash'
import { getConfig } from './config'
import { Heartbeat } from './reducer'

const config = getConfig()
export const getParticipantId = (request: AdapterRequest): string => {
  return hash(request, config.hashOpts)
}

const getWeight = (totalRequests: number, participantRequests: number): number => {
  const minHeartbeat = 0
  // Avoid having Infinity weight
  if (totalRequests === 0) {
    totalRequests = 1
  }
  if (participantRequests === 0) {
    participantRequests = 1
  }
  return (participantRequests - minHeartbeat) / (totalRequests - minHeartbeat)
}

export const getParticipantCost = (participantRequests: Heartbeat[]): number => {
  if (participantRequests.length === 0) return 1
  return (
    participantRequests.reduce((totalCost, h) => totalCost + h.cost, 0) / participantRequests.length
  )
}

export const getMaxReqAllowed = (
  totalRequests: number,
  participantRequests: number,
  cost: number,
): number => {
  const weight = getWeight(totalRequests, participantRequests)
  const safeCapacity = 0.9 * (config.totalCapacity / cost)
  return weight * safeCapacity
}
