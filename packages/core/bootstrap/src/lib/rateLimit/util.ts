import { AdapterRequest } from '@chainlink/types'
import hash from 'object-hash'
import { getConfig } from './config'
import { Heartbeat } from './reducer'

const config = getConfig()
export const getParticipantId = (request: AdapterRequest): string => {
  return hash(request, config.hashOpts)
}

const getWeight = (totalRequests: Heartbeat[], participantRequests: Heartbeat[]): number => {
  const minHeartbeat = 0
  // Avoid having Infinity weight
  const participantReqNumber = participantRequests.length === 0 ? 1 : participantRequests.length
  const totalReqNumber = totalRequests.length === 0 ? 1 : totalRequests.length
  return (participantReqNumber - minHeartbeat) / (totalReqNumber - minHeartbeat)
}

const getParticipantCost = (participantRequests: Heartbeat[]): number => {
  if (participantRequests.length === 0) return 1
  return (
    participantRequests.reduce((totalCost, h) => totalCost + h.cost, 0) / participantRequests.length
  )
}

export const getMaxReqAllowed = (
  totalRequests: Heartbeat[],
  participantRequests: Heartbeat[],
): number => {
  const weight = getWeight(totalRequests, participantRequests)
  const averageCost = getParticipantCost(participantRequests)
  const safeCapacity = 0.9 * (config.totalCapacity / averageCost)
  return weight * safeCapacity
}
