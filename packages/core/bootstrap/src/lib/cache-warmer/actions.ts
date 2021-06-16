import { AdapterRequest, AdapterResponse, Execute } from '@chainlink/types'
import { createAction } from '@reduxjs/toolkit'

export interface WarmupExecutePayload extends AdapterRequest {
  /**
   * The Execute function of the adapter. Used when polling for new data.
   */
  executeFn: Execute
  /**
   * The response returned from requesting data from a provider
   */
  result: AdapterResponse
}
export const warmupExecute = createAction<WarmupExecutePayload>('WARMUP/EXECUTE')

export interface WarmupSubscribedPayload extends WarmupExecutePayload {
  /**
   * Override the key to used when storing the subscription
   * Batch warmers will use a key without the data property
   */
  key?: string
  /**
   * If a subscription is being warmed by a batch warmer
   * This will hold the subscription key of the parent
   */
  parent?: string
  /**
   * If a subscription is being warmed by a parent batch request
   * This will hold the key of the request data to join
   */
  batchKey?: string
  /**
   * If a subscription is a batch warmer that is warming multiple other requests
   * This will hold a map of the children subscription key to the last time it was seen
   */
  childLastSeenById?: { [childKey: string]: number }
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
  childLastSeenById: { [childKey: string]: number }
  batchKey: string
}
interface WarmupLeaveGroupPayload {
  parent: string
  childLastSeenById: { [childKey: string]: number }
  batchKey: string
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
