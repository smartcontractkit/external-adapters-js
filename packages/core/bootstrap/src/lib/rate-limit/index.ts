import hash from 'object-hash'
import { logger } from '../external-adapter'
import { Store } from 'redux'
import { AdapterRequest, Middleware } from '@chainlink/types'
import { successfulRequestObserved } from './actions'
import {
  Heartbeat,
  Heartbeats,
  IntervalNames,
  Intervals,
  RootState,
  selectObserved,
} from './reducer'
import * as config from './config'
import * as metrics from './metrics'
export * as reducer from './reducer'
export * as actions from './actions'

/**
 * Calculates how much capacity a participant deserves based on its weight on the adapter
 * @param state Redux Heartbeats state
 * @param interval Time window size to get heartbeats
 * @param id Participant ID to get participants heartbeats
 */
export const computeThroughput = (
  state: Heartbeats,
  interval: IntervalNames,
  id: string,
): number => {
  // All observed in interval
  const observedRequests = selectObserved(state, interval).filter((h) => !h.isWarmup)
  const throughput = observedRequests.length + 1
  // All of type observed in interval
  const observedRequestsOfType = selectObserved(state, interval, id).filter((h) => !h.isWarmup)
  const throughputOfType = observedRequestsOfType.length + 1
  const costOfType = getAverageCost(observedRequestsOfType) || 1
  // Compute max throughput by weight
  const weight = throughputOfType / throughput
  return maxThroughput(weight, costOfType)
}

const getAverageCost = (requests: Heartbeat[]): number => {
  if (!requests || requests.length === 0) return 0
  return requests.reduce((totalCost, h) => totalCost + h.cost, 0) / requests.length
}

const logRemainingCapacity = (state: Heartbeats, interval: IntervalNames): void => {
  const dataProviderRequests = selectObserved(state, interval).filter((h) => !h.isCacheHit)
  const cost = getAverageCost(dataProviderRequests) || 1
  const capacity = config.get().totalCapacity
  const totalReq = dataProviderRequests.length * cost
  const remainingCapacity = capacity - totalReq
  const message = `Rate Limit: ${totalReq} requests made in the last minute. Capacity of ${capacity} requests/min is set`
  if (remainingCapacity <= 0) {
    logger.error(message)
    return
  }
  if (remainingCapacity <= 0.1 * capacity) {
    logger.warn(message)
    return
  }
}

const maxThroughput = (weight: number, cost: number): number => {
  const maxAllowedCapacity = 0.9 * (config.get().totalCapacity / cost) // Interval.Minute
  return weight * maxAllowedCapacity
}

/**
 * Returns hash of the input request payload excluding some volatile paths
 *
 * @param request payload
 */
export const makeId = (request: AdapterRequest): string => hash(request, config.get().hashOpts)

/**
 * Calculate maxAge to keep the item cached so we allow the specified throughput.
 *
 * @param throughput number of allowed requests in interval
 * @param interval time window in ms
 */
export const maxAgeFor = (throughput: number, interval: number) =>
  throughput <= 0 ? interval : Math.floor(interval / throughput)

export const withRateLimit = (store: Store<RootState>): Middleware => async (execute) => async (
  input,
) => {
  if (!config.get().totalCapacity) return await execute(input)
  let state = store.getState()
  const { heartbeats } = state
  const requestTypeId = makeId(input)
  const maxThroughput = computeThroughput(heartbeats, IntervalNames.HOUR, requestTypeId)
  const maxAge = maxAgeFor(maxThroughput, Intervals[IntervalNames.MINUTE])
  const result = await execute({ ...input, data: { ...input.data, rateLimitMaxAge: maxAge } })

  store.dispatch(successfulRequestObserved(input, result))
  state = store.getState()
  logRemainingCapacity(state.heartbeats, IntervalNames.MINUTE)

  const defaultLabels = {
    job_run_id: input.id,
    participant_id: requestTypeId,
    experimental: 'true',
  }
  let cost = Number(result.debug?.providerCost)
  if (isNaN(cost)) {
    cost = 1
  }
  metrics.rateLimitCreditsSpentTotal.labels(defaultLabels).inc(cost)

  return result
}
