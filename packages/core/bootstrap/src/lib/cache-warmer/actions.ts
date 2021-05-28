import { AdapterRequest, Execute } from '@chainlink/types'
import { createAction } from '@reduxjs/toolkit'

export interface WarmupSubscribedPayload extends AdapterRequest {
  executeFn: Execute
  parent?: string
  children?: { [childKey: string]: number }
}
interface WarmupUnsubscribedPayload {
  key: string
}
interface WarmupStoppedPayload {
  key: string
}
interface WarmupSubscriptionTimeoutResetPayload {
  key: string
}

export const warmupSubscribed = createAction<WarmupSubscribedPayload>('WARMUP/SUBSCRIBED')
export const warmupSubscriptionTimeoutReset = createAction<WarmupSubscriptionTimeoutResetPayload>(
  'WARMUP/SUBSCRIPTION_TIMEOUT_RESET',
)
export const warmupUnsubscribed = createAction<WarmupUnsubscribedPayload>('WARMUP/UNSUBSCRIBED')
export const warmupStopped = createAction<WarmupStoppedPayload>('WARMUP/STOPPED')

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
export const warmupRequested = createAction<WarmupRequestedPayload>('WARMUP/REQUESTED')
export const warmupFulfilled = createAction<WarmupFulfilledPayload>('WARMUP/FULFILLED')
export const warmupFailed = createAction<WarmupFailedPayload>('WARMUP/FAILED')
