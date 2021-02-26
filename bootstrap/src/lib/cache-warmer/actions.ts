import { AdapterRequest, Execute } from '@chainlink/types'
import { createAction } from '@reduxjs/toolkit'

interface WarmupRequestSubscribedPayload extends AdapterRequest {
  executeFn: Execute
}
interface WarmupRequestUnsubscribedPayload {
  key: string
}
interface WarmupRequestSubscriptionTimeoutResetPayload {
  key: string
}

export const warmupRequestSubscribed = createAction<WarmupRequestSubscribedPayload>(
  'WARMUP_REQUEST_SUBSCRIBED',
)
export const warmupRequestSubscriptionTimeoutReset = createAction<WarmupRequestSubscriptionTimeoutResetPayload>(
  'WARMUP_REQUEST_SUBSCRIPTION_TIMEOUT_RESET',
)
export const warmupRequestUnsubscribed = createAction<WarmupRequestUnsubscribedPayload>(
  'WARMUP_REQUEST_UNSUBSCRIBED',
)

interface WarmupRequestRequestedPayload {
  /**
   * State lookup key so that the warmup request handler can find the slice of data it needs
   * to warmup the cold EA
   */
  key: string
}
interface WarmupRequestFulfilledPayload {
  /**
   * State lookup key
   */
  key: string
}
interface WarmupRequestFailedPayload {
  /**
   * State lookup key
   */
  key: string
  error: Error
}
/**
 * These set of events are emitted when our warmup handler requests the EA itself to warm up
 * the cache for a particular key
 */
export const warmupRequestRequested = createAction<WarmupRequestRequestedPayload>(
  'WARMUP_REQUEST_REQUESTED',
)
export const warmupRequestFulfilled = createAction<WarmupRequestFulfilledPayload>(
  'WARMUP_REQUEST_FULFILLED',
)
export const warmupRequestFailed = createAction<WarmupRequestFailedPayload>('WARMUP_REQUEST_FAILED')
