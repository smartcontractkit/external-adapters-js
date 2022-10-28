import type { AdapterContext, AdapterRequest, Middleware } from '../../../types'
import { Store } from 'redux'
import {
  BurstLimitState,
  IntervalNames,
  RequestsState,
  selectTotalNumberOfRequestsFor,
} from './reducer'
import * as actions from './actions'
import { WARMUP_BATCH_REQUEST_ID } from '../cache-warmer/config'
import { logger } from '../../modules/logger'
import { AdapterBurstLimitError } from '../../modules/error'
import { getEnv, sleep } from '../../util'

export * as actions from './actions'
export * as reducer from './reducer'

export const SECOND_LIMIT_RETRIES = 10
export const MINUTE_LIMIT_WARMER_BUFFER = 0.9

const availableSecondLimitCapacity = async (
  store: Store<BurstLimitState>,
  burstCapacity1s: number,
) => {
  for (let retry = SECOND_LIMIT_RETRIES; retry > 0; retry--) {
    store.dispatch(actions.updateIntervals())
    const state = store.getState()
    const { requests }: { requests: RequestsState } = state

    const observedRequestsInSecond = selectTotalNumberOfRequestsFor(requests, IntervalNames.SECOND)

    if (observedRequestsInSecond > burstCapacity1s) {
      logger.debug(
        `Per Second Burst rate limit cap of ${burstCapacity1s} reached. ${observedRequestsInSecond} requests sent in the last minute. Waiting 1 second. Retry number: ${retry}`,
      )
      await sleep(1000)
    } else return true
  }
  return false
}

/**
  Prevents Adapters from requesting a data provider more times than their *second* and *minute* API limits allow.
*/
export const withBurstLimit =
  <R extends AdapterRequest, C extends AdapterContext>(
    store?: Store<BurstLimitState>,
  ): Middleware<R, C> =>
  async (execute, context) =>
  async (input) => {
    const config = context.limits
    const customCapacitySet = getEnv('RATE_LIMIT_CAPACITY')
    const perSecCapacitySet = getEnv('RATE_LIMIT_CAPACITY_SECOND')
    const perMinuteCapacitySet = getEnv('RATE_LIMIT_CAPACITY_MINUTE')

    if (!store || !config?.enabled || (!config.burstCapacity1m && !config.burstCapacity1s))
      return await execute(input, context)

    store.dispatch(actions.initialRequestObserved())

    const state = store.getState()
    const { requests }: { requests: RequestsState } = state

    // Limit by Minute
    if (config.burstCapacity1m) {
      const observedRequestsInMinute = selectTotalNumberOfRequestsFor(
        requests,
        IntervalNames.MINUTE,
      )

      if (
        input.id !== WARMUP_BATCH_REQUEST_ID && // Always allow Batch Warmer requests through
        observedRequestsInMinute > config.burstCapacity1m * MINUTE_LIMIT_WARMER_BUFFER
        // TODO: determine BATCH_REQUEST_BUFFER dynamically based on (number of batch warmers * 3)
      ) {
        logger.warn(
          `${
            perSecCapacitySet
              ? 'CUSTOM RATE SECOND LIMIT CAPACITY CONFIGURED: '
              : customCapacitySet
              ? 'CUSTOM RATE LIMIT CAPACITY CONFIGURED: '
              : ''
          } External Adapter backing off. Provider's limit of ${
            config.burstCapacity1m * MINUTE_LIMIT_WARMER_BUFFER
          } requests per minute reached. ${observedRequestsInMinute} requests sent in the last minute.`,
        )
        throw new AdapterBurstLimitError({
          jobRunID: input.id,
          message: 'New request backoff: Minute Burst rate limit cap reached.',
          statusCode: 429,
        })
      }
    }

    // Limit by Second
    if (config.burstCapacity1s) {
      const availableCapacity = await availableSecondLimitCapacity(store, config.burstCapacity1s)
      if (!availableCapacity) {
        logger.warn(
          `${
            perMinuteCapacitySet
              ? 'CUSTOM RATE MINUTES LIMIT CAPACITY CONFIGURED'
              : customCapacitySet
              ? 'CUSTOM RATE LIMIT CAPACITY CONFIGURED: '
              : ''
          }External Adapter backing off. Provider's burst limit of ${
            config.burstCapacity1s
          } requests per second reached.`,
        )
        throw new AdapterBurstLimitError({
          jobRunID: input.id,
          message: 'New request backoff: Second Burst rate limit cap reached.',
          statusCode: 429,
        })
      }
    }

    const requestObservedPayload: actions.RequestObservedPayload = {
      input,
    }
    store.dispatch(actions.requestObserved(requestObservedPayload))

    return await execute(input, context)
  }
