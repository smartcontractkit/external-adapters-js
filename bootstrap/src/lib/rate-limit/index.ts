import hash from 'object-hash'
import { Store } from 'redux'
import { AdapterRequest, Middleware } from '@chainlink/types'
import { WARMUP_REQUEST_ID } from '../cache-warmer/config'
import { requestObserved } from './actions'
import {
  Heartbeat,
  Heartbeats,
  IntervalNames,
  Intervals,
  RootState,
  selectObserved,
} from './reducer'
import * as config from './config'

export * as reducer from './reducer'
export * as actions from './actions'

export const computeThroughput = (
  state: Heartbeats,
  interval: IntervalNames,
  id: string,
): number => {
  // All observed in interval
  const observedRequests = selectObserved(state, interval)
  const throughput = observedRequests.length + 1
  const cost = getAverageCost(observedRequests) || 1
  // All of type observed in interval
  const observedRequestsOfType = selectObserved(state, interval, id)
  const throughputOfType = observedRequestsOfType.length + 1
  const costOfType = getAverageCost(observedRequestsOfType) || 1
  // Compute max throughput by weight
  const weight = (throughputOfType * costOfType) / (throughput * cost)
  return maxThroughput(weight)
}

const getAverageCost = (requests: Heartbeat[]): number => {
  if (!requests || requests.length === 0) return 0
  return requests.reduce((totalCost, h) => totalCost + h.cost, 0) / requests.length
}

const maxThroughput = (weight: number): number => {
  const maxAllowedCapacity = 0.9 * config.get().totalCapacity // Interval.Minute
  return weight * maxAllowedCapacity
}

/**
 * Returns hash of the input request payload excluding some volatile paths
 *
 * @param request payload
 */
const makeId = (request: AdapterRequest): string => hash(request, config.get().hashOpts)

/**
 * Calculate maxAge to keep the item cached so we allow the specified throughput.
 *
 * @param throughput number of allowed requests in interval
 * @param interval time window in ms
 */
const maxAgeFor = (throughput: number, interval: number) =>
  throughput <= 0 ? interval : Math.floor(interval / throughput)

export const withRateLimit = (store: Store<RootState>): Middleware => async (execute) => async (
  input,
) => {
  const state = store.getState()
  const { heartbeats } = state
  const requestTypeId = makeId(input)
  const maxThroughput = computeThroughput(heartbeats, IntervalNames.MINUTE, requestTypeId)
  const maxAge = maxAgeFor(maxThroughput, Intervals[IntervalNames.MINUTE])
  const result = await execute({ ...input, data: { ...input.data, maxAge } })
  if (input.id !== WARMUP_REQUEST_ID)
    store.dispatch(requestObserved(makeId(input), result.data.cost))
  return result
}
