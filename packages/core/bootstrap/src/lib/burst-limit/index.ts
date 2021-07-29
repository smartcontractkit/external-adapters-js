import { Middleware } from '@chainlink/types'
import { Store } from 'redux'
import * as rateLimitConfig from '../rate-limit/config'
import {
  BurstLimitState,
  IntervalNames,
  RequestsState,
  selectTotalNumberOfRequestsFor,
} from './reducer'
import * as actions from './actions'
import { WARMUP_BATCH_REQUEST_ID } from '../cache-warmer/config'
import { logger } from '../external-adapter'

export * as actions from './actions'
export * as reducer from './reducer'

export const withBurstLimit = (store?: Store<BurstLimitState>): Middleware => async (
  execute,
  context,
) => async (input) => {
  const config = rateLimitConfig.get(context)
  if (!store || !config.enabled) return await execute(input, context)

  const state = store.getState()
  const { requests }: { requests: RequestsState } = state
  const observedRequestsOfParticipant = selectTotalNumberOfRequestsFor(
    requests,
    IntervalNames.MINUTE,
  )

  if (
    input.id !== WARMUP_BATCH_REQUEST_ID && // Always allow Batch Warmer requests through
    observedRequestsOfParticipant > config.totalCapacity / 2
    // TODO: determine BATCH_REQUEST_BUFFER dynamically based on (number of batch warmers * 3)
  ) {
    logger.error(
      `Burst rate limit cap of ${
        config.totalCapacity / 2
      } reached. ${observedRequestsOfParticipant} requests sent in the last minute.`,
    )
    throw new Error('New request backoff: Burst rate limit cap reached.')
  }

  const requestObservedPayload: actions.RequestObservedPayload = {
    input,
  }
  store.dispatch(actions.requestObserved(requestObservedPayload))

  return await execute(input, context)
}
