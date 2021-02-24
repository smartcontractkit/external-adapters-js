import { AdapterRequest, Execute } from '@chainlink/types'
import { combineReducers, createReducer } from '@reduxjs/toolkit'
import * as actions from './actions'
import { getSubscriptionKey } from './util'

/**
 * Metadata about a request
 */
export interface SubscriptionData {
  /**
   * The original request data that triggered this subscription
   */
  info: AdapterRequest
  /**
   * The wrapped execute function that was used to service the request
   */
  executeFn: Execute
  /**
   * The time this subscription started in unix time
   */
  startedAt: number
  /**
   * Boolean trigger to prevent multiple subscriptions on the same key
   * We need this because checking state for this within an epic doesnt work,
   * the reducers are always executed before epics are
   */
  isDuplicate: boolean
}

export interface SubscriptionState {
  [requestKey: string]: SubscriptionData
}

export const subscriptionsReducer = createReducer<SubscriptionState>({}, (builder) => {
  builder.addCase(actions.warmupRequestSubscribed, (state, action) => {
    state[getSubscriptionKey(action.payload)] = {
      info: action.payload,
      executeFn: action.payload.executeFn,
      startedAt: Date.now(),
      isDuplicate: !!state[getSubscriptionKey(action.payload)],
    }
  })

  builder.addCase(actions.warmupRequestUnsubscribed, (state, action) => {
    delete state[action.payload.key]
  })
})

export interface RequestData {
  /**
   * Current error for warmup request, if any
   */
  error: Error | null
  /**
   * The consecutive number of times we've had successful warmups
   */
  successCount: number
  /**
   * The consecutive number of times we've had errors trying to send a warmup request
   */
  errorCount: number
}
export interface RequestState {
  [key: string]: RequestData
}

export const requestReducer = createReducer<RequestState>({}, (builder) => {
  builder.addCase(actions.warmupRequestRequested, (state, action) => {
    if (!state[action.payload.key]) {
      state[action.payload.key] = { error: null, successCount: 0, errorCount: 0 }
    }
  })

  builder.addCase(actions.warmupRequestFulfilled, (state, action) => {
    state[action.payload.key].successCount++
    state[action.payload.key].error = null
    state[action.payload.key].errorCount = 0
  })

  builder.addCase(actions.warmupRequestFailed, (state, action) => {
    state[action.payload.key].error = action.payload.error
    state[action.payload.key].errorCount++
    state[action.payload.key].successCount = 0
  })

  builder.addCase(actions.warmupRequestUnsubscribed, (state, action) => {
    delete state[action.payload.key]
  })
})

export const rootReducer = combineReducers({
  subscriptions: subscriptionsReducer,
  response: requestReducer,
})

export type RootState = ReturnType<typeof rootReducer>
