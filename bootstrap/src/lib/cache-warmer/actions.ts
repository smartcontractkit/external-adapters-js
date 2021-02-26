import { AdapterRequest, Execute } from '@chainlink/types'
import { createAction } from '@reduxjs/toolkit'

interface WarmupSubscribedPayload extends AdapterRequest {
  executeFn: Execute
}
interface WarmupUnsubscribedPayload {
  key: string
}
interface WarmupSubscriptionTimeoutResetPayload {
  key: string
}

export const warmupSubscribed = createAction<WarmupSubscribedPayload>('WARMUP_SUBSCRIBED')
export const warmupSubscriptionTimeoutReset = createAction<WarmupSubscriptionTimeoutResetPayload>(
  'WARMUP_SUBSCRIPTION_TIMEOUT_RESET',
)
export const warmupUnsubscribed = createAction<WarmupUnsubscribedPayload>('WARMUP_UNSUBSCRIBED')

interface WarmupRequestedPayload {
  /**
   * State lookup key so that the warmup handler can find the slice of data it needs
   * to warmup the cold EA
   */
  key: string
}
interface WarmupFulfilledPayload {
  /**
   * State lookup key
   */
  key: string
}
interface WarmupFailedPayload {
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
export const warmupRequested = createAction<WarmupRequestedPayload>('WARMUP_REQUESTED')
export const warmupFulfilled = createAction<WarmupFulfilledPayload>('WARMUP_FULFILLED')
export const warmupFailed = createAction<WarmupFailedPayload>('WARMUP_FAILED')
