import { AdapterRequest, Execute } from '@chainlink/types'
import { createAction } from '@reduxjs/toolkit'

export interface WarmupExecutePayload extends AdapterRequest {
  executeFn: Execute
  result: any
}
export const warmupExecute = createAction<WarmupExecutePayload>('WARMUP/EXECUTE')

export interface WarmupSubscribedPayload extends AdapterRequest {
  /**
   * Override the key to used when storing the subscription
   * Batch warmers will use a key without the data property
   */
  key?: string
  /**
   * The Execute function of the adapter. Used when polling for new data.
   */
  executeFn: Execute
  /**
   * If a subscription is being warmed by a batch warmer
   * This will hold the subscription key of the parent
   */
  parent?: string
  /**
   * If a subscription is a batch warmer that is warming multiple other requests
   * This will hold a map of the children subscription key to the last time it was seen
   */
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
interface WarmupJoinGroupPayload {
  parent: string
  children: { [childKey: string]: number }
  batchable: string
}
interface WarmupLeaveGroupPayload {
  parent: string
  children: { [childKey: string]: number }
}

export const warmupSubscribed = createAction<WarmupSubscribedPayload>('WARMUP/SUBSCRIBED')
export const warmupSubscriptionTimeoutReset = createAction<WarmupSubscriptionTimeoutResetPayload>(
  'WARMUP/SUBSCRIPTION_TIMEOUT_RESET',
)
export const warmupUnsubscribed = createAction<WarmupUnsubscribedPayload>('WARMUP/UNSUBSCRIBED')
export const warmupStopped = createAction<WarmupStoppedPayload>('WARMUP/STOPPED')
export const warmupJoinGroup = createAction<WarmupJoinGroupPayload>('WARMUP/JOIN_GROUP')
export const warmupLeaveGroup = createAction<WarmupLeaveGroupPayload>('WARMUP/LEAVE_GROUP')

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
