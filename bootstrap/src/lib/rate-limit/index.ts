import hash from 'object-hash'
import { Store } from 'redux'
import { AdapterRequest, Middleware } from '@chainlink/types'
import { WARMUP_REQUEST_ID } from '../cache-warmer/config'
import { successfulRequestObserved, requestObserved, responseObserved } from './actions'
import {
  Heartbeat,
  Heartbeats,
  IntervalNames,
  Intervals,
  RootState,
  selectObserved,
} from './reducer'
import * as config from './config'
import { logger } from '@chainlink/external-adapter'

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
  // All of type observed in interval
  const observedRequestsOfType = selectObserved(state, interval, id)
  const throughputOfType = observedRequestsOfType.length + 1
  const costOfType = getAverageCost(observedRequestsOfType) || 1
  // Compute max throughput by weight
  const weight = throughputOfType / throughput
  // const capacityLeft = getRemainingCapacity(state, interval, costOfType)
  // return maxThroughputWithLeftCapacity(weight, capacityLeft)
  return maxThroughput(weight, costOfType)
}

const getAverageCost = (requests: Heartbeat[]): number => {
  if (!requests || requests.length === 0) return 0
  return requests.reduce((totalCost, h) => totalCost + h.cost, 0) / requests.length
}

const getRemainingCapacity = (state: Heartbeats, interval: IntervalNames, cost: number): number => {
  const safeCapacity = 0.9 * (config.get().totalCapacity / cost)
  const observedRequests = selectObserved(state, interval)
  const remainingCapacity = safeCapacity - observedRequests.length
  if (remainingCapacity <= 0) {
    logger.error('Rate Limit: Data Provider tokens not available')
    return 1
  }
  if (remainingCapacity <= 0.1 * safeCapacity) {
    logger.warn('Rate Limit: Data Provider tokens about to run out')
  }
  return safeCapacity - observedRequests.length
}

const maxThroughputWithLeftCapacity = (weight: number, capacity: number): number => {
  return weight * capacity
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
  const state = store.getState()
  const { heartbeats } = state
  const requestTypeId = makeId(input)
  store.dispatch(requestObserved(requestTypeId, input))

  const maxThroughput = computeThroughput(heartbeats, IntervalNames.HOUR, requestTypeId)
  const maxAge = maxAgeFor(maxThroughput, Intervals[IntervalNames.MINUTE])
  const start = process.hrtime()
  try {
    const result: any = await execute({
      ...input,
      data: { ...input.data, rateLimitMaxAge: maxAge },
    })
    const { metrics, ...adapterResult } = result
    store.dispatch(
      responseObserved(
        requestTypeId,
        result,
        true,
        maxAge,
        process.hrtime(start),
        result.data.cost,
        metrics,
      ),
    )
    if (input.id !== WARMUP_REQUEST_ID) {
      store.dispatch(successfulRequestObserved(requestTypeId, result.data.cost))
    }
    return adapterResult
  } catch (e) {
    store.dispatch(responseObserved(requestTypeId, e, false, maxAge, process.hrtime(start)))
    throw e
  }
}
