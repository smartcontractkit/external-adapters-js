import type { AdapterContext, AdapterRequest, Middleware } from '../../../types'
import { Store } from 'redux'
import {
  ErrorBackoffState,
  IntervalNames,
  RequestsState,
  selectParticiantsRequestsById,
} from './reducer'
import * as actions from './actions'
import { WARMUP_BATCH_REQUEST_ID } from '../cache-warmer/config'
import { logger } from '../../modules/logger'
import { AdapterBackoffError } from '../../modules/error'
import { makeId } from '../rate-limit'
import { getEnv } from '../../util'

export * as actions from './actions'
export * as reducer from './reducer'

export const withErrorBackoff =
  <R extends AdapterRequest, C extends AdapterContext>(
    store?: Store<ErrorBackoffState>,
  ): Middleware<R, C> =>
  async (execute, context) =>
  async (input) => {
    if (!store) return await execute(input, context)

    // Update time window
    store.dispatch(actions.requestObserved())

    const state = store.getState()
    const { requests }: { requests: RequestsState } = state

    // Limit errors by id to back off from repeated errors
    if (
      input.id !== WARMUP_BATCH_REQUEST_ID // Always allow Batch Warmer requests through
    ) {
      const errorCapacity = parseInt(getEnv('ERROR_CAPACITY') || '2')
      const observedIdRequestsInMinute = selectParticiantsRequestsById(
        requests,
        IntervalNames.MINUTE,
        makeId(input),
      )
      if (observedIdRequestsInMinute.length === errorCapacity) {
        logger.warn(
          `External Adapter backing off errored request. ${errorCapacity} requests have returned errors in the last minute.`,
        )
        throw new AdapterBackoffError({
          jobRunID: input.id,
          message:
            'Errored request backoff: This request has returned too many errors in the past minute.',
          statusCode: 429,
        })
      }
    }

    try {
      return await execute(input, context)
    } catch (error) {
      // Record error
      const requestObservedPayload: actions.RequestObservedPayload = {
        input,
      }
      store.dispatch(actions.requestFailedObserved(requestObservedPayload))
      // Continue throwing
      throw error
    }
  }
