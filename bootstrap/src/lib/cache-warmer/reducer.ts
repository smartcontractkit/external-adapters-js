import { AdapterRequest, Execute } from '@chainlink/types'
import { combineReducers, createReducer } from '@reduxjs/toolkit'
import * as actions from './actions'
import { getRequestKey } from './util'

/**
 * Metadata about a request
 */
export interface RequestData {
  /**
   * The original request data
   */
  info: AdapterRequest
  /**
   * The wrapped execute function that was used to service the request
   */
  executeFn: Execute
  /**
   * The time this request arrived in unix time
   */
  arrived: number
  /**
   * Whether this request has been processed by our warmer handler or not
   */
  processed: boolean
  /**
   * The number of times this particular request has gone through
   */
  count: number
  /**
   * The current error of this request, if any
   */
  error: Error | null
}

export interface RequestState {
  [requestKey: string]: RequestData
}

export const requestReducer = createReducer<RequestState>({}, (builder) => {
  builder.addCase(actions.warmupRequestRecieved, (state, action) => {
    const key = getRequestKey(action.payload)
    const currentCount = state[key]?.count ?? 0

    state[key] = {
      info: action.payload,
      executeFn: action.payload.executeFn,
      arrived: Date.now(),
      count: currentCount + 1,
      processed: false,
      error: null,
    }
  })

  builder.addCase(actions.warmupRequestFulfilled, (state, action) => {
    state[action.payload.key].processed = true
  })

  builder.addCase(actions.warmupRequestFailed, (state, action) => {
    state[action.payload.key].processed = true
    state[action.payload.key].error = action.payload.error
  })
})

export interface ResponseData {
  /**
   * Whether this response has been processed by our warmer handler or not
   */
  processed: boolean
  /**
   * Current error for warmup response, if any
   */
  error: Error | null
  /**
   * The number of times we've sent a warmup response for this key
   */
  count: number
}
export interface ResponseState {
  [key: string]: ResponseData
}

export const responseReducer = createReducer<ResponseState>({}, (builder) => {
  builder.addCase(actions.warmupResponseRequested, (state, action) => {
    state[action.payload.key] = { processed: false, error: null, count: 0 }
  })

  builder.addCase(actions.warmupResponseFulfilled, (state, action) => {
    state[action.payload.key] = {
      processed: true,
      error: null,
      count: state[action.payload.key].count + 1,
    }
  })

  builder.addCase(actions.warmupResponseFailed, (state, action) => {
    state[action.payload.key] = {
      processed: true,
      error: action.payload.error,
      count: state[action.payload.key].count + 1,
    }
  })
})

export const rootReducer = combineReducers({
  request: requestReducer,
  response: responseReducer,
})

export type RootState = ReturnType<typeof rootReducer>
