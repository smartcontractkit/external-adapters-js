import { AdapterRequest, Execute } from '@chainlink/types'
import { createAction } from '@reduxjs/toolkit'

interface WarmupRequestRequestedPayload extends AdapterRequest {
  executeFn: Execute
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
 * These set of events are emitted when a request is received on a adapter
 */
export const warmupRequestRecieved = createAction<WarmupRequestRequestedPayload>(
  'WARMUP_REQUEST_RECIEVED',
)
export const warmupRequestFulfilled = createAction<WarmupRequestFulfilledPayload>(
  'WARMUP_REQUEST_FULFILLED',
)
export const warmupRequestFailed = createAction<WarmupRequestFailedPayload>('WARMUP_REQUEST_FAILED')

interface WarmupResponseRequestedPayload {
  /**
   * State lookup key so that the warmup response handler can find the slice of data it needs
   * to warmup the cold EA
   */
  key: string
}
interface WarmupResponseFulfilledPayload {
  /**
   * State lookup key
   */
  key: string
}
interface WarmupResponseFailedPayload {
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
export const warmupResponseRequested = createAction<WarmupResponseRequestedPayload>(
  'WARMUP_RESPONSE_REQUESTED',
)
export const warmupResponseFulfilled = createAction<WarmupResponseFulfilledPayload>(
  'WARMUP_RESPONSE_FULFILLED',
)
export const warmupResponseFailed = createAction<WarmupResponseFailedPayload>(
  'WARMUP_RESPONSE_FAILED',
)
