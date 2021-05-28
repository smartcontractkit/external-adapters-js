import { AdapterRequest, Middleware } from '@chainlink/types'
import hash from 'object-hash'
import { Store } from 'redux'
import { successfulRequestObserved } from './actions'
import * as config from './config'
import * as metrics from './metrics'
import {
  Heartbeat,
  Heartbeats,
  IntervalNames,
  Intervals,
  RootState,
  selectParticiantsHeartbeatsFor,
  selectTotalNumberOfHeartbeatsFor,
} from './reducer'
export * as actions from './actions'
export * as reducer from './reducer'

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
  const totalThroughtput = selectTotalNumberOfHeartbeatsFor(state, interval)
  // All of type observed in interval
  const observedRequestsOfParticipant = selectParticiantsHeartbeatsFor(state, interval, id)
  const throughputOfParticipant = observedRequestsOfParticipant.length + 1
  const costOfParticipant = getAverageCost(observedRequestsOfParticipant) || 1
  // Compute max throughput by weight
  const weight = throughputOfParticipant / totalThroughtput

  return maxThroughput(weight, costOfParticipant)
}

const getAverageCost = (requests: Heartbeat[]): number => {
  if (!requests || requests.length === 0) return 0
  return requests.reduce((totalCost, h) => totalCost + h.c, 0) / requests.length
}

const maxThroughput = (weight: number, cost: number): number => {
  const maxAllowedCapacity = 0.9 * (config.get().totalCapacity / cost)
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

export const withRateLimit =
  (store: Store<RootState>): Middleware =>
  async (execute) =>
  async (input) => {
    if (!config.get().enabled) return await execute(input)
    let state = store.getState()
    const { heartbeats } = state
    const requestTypeId = makeId(input)
    const maxThroughput = computeThroughput(heartbeats, IntervalNames.HOUR, requestTypeId)
    const maxAge = maxAgeFor(maxThroughput, Intervals[IntervalNames.MINUTE])
    const result = await execute({ ...input, rateLimitMaxAge: maxAge })

    store.dispatch(successfulRequestObserved(input, result))
    state = store.getState()

    const defaultLabels = {
      feed_id: input.debug?.feedId,
      participant_id: requestTypeId,
      experimental: 'true',
    }
    const cost = parseInt(result.debug?.providerCost)
    metrics.rateLimitCreditsSpentTotal.labels(defaultLabels).inc(isNaN(cost) ? 1 : cost)

    return result
  }
