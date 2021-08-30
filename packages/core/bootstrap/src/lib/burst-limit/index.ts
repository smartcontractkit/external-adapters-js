import { Middleware } from '@chainlink/types'
import { Store } from 'redux'
import {
  BurstLimitState,
  IntervalNames,
  RequestsState,
  selectTotalNumberOfRequestsFor,
} from './reducer'
import * as actions from './actions'
import { WARMUP_BATCH_REQUEST_ID } from '../cache-warmer/config'
import { AdapterError, logger } from '../external-adapter'

export * as actions from './actions'
export * as reducer from './reducer'

const SECOND_LIMIT_RETRIES = 10
const MINUTE_LIMIT_WARMER_BUFFER = 0.9

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const availableSecondLimitCapacity = async (
  store: Store<BurstLimitState>,
  burstCapacity1s: number,
) => {
  for (let retry = SECOND_LIMIT_RETRIES; retry > 0; retry--) {
    const state = store.getState()
    const { requests }: { requests: RequestsState } = state

    const observedRequestsInSecond = selectTotalNumberOfRequestsFor(requests, IntervalNames.SECOND)

    if (observedRequestsInSecond > burstCapacity1s) {
      logger.debug(
        `Per Second Burst rate limit cap of ${burstCapacity1s} reached. ${observedRequestsInSecond} requests sent in the last minute. Waiting 1 second. Retry number: ${retry}`,
      )
      await delay(1000)
    } else return true
  }
  return false
}

export const withBurstLimit =
  (store?: Store<BurstLimitState>): Middleware =>
  async (execute, context) =>
  async (input) => {
    const config = context.rateLimit ?? {}
    if (!store || !config.enabled || (!config.burstCapacity1m && !config.burstCapacity1s))
      return await execute(input, context)

    const state = store.getState()
    const { requests }: { requests: RequestsState } = state

    // Limit by Second
    if (config.burstCapacity1s) {
      const availableCapacity = availableSecondLimitCapacity(store, config.burstCapacity1s)
      if (!availableCapacity) {
        logger.warn(
          `External Adapter backing off. Provider's limit of ${config.burstCapacity1s} requests per second reached.`,
        )
        throw new AdapterError({
          jobRunID: input.id,
          message: 'New request backoff: Second Burst rate limit cap reached.',
          statusCode: 429,
        })
      }
    }

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
          `External Adapter backing off. Provider's limit of ${
            config.burstCapacity1m * MINUTE_LIMIT_WARMER_BUFFER
          } requests per minute reached. ${observedRequestsInMinute} requests sent in the last minute.`,
        )
        throw new AdapterError({
          jobRunID: input.id,
          message: 'New request backoff: Minute Burst rate limit cap reached.',
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
