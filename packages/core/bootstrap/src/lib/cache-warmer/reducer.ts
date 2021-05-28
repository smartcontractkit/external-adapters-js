import { AdapterRequest, Execute } from '@chainlink/types'
import { combineReducers, createReducer } from '@reduxjs/toolkit'
import { logger } from '../external-adapter'
import * as actions from './actions'
import { getSubscriptionKey } from './util'

/**
 * Metadata about a request
 */
export interface SubscriptionData {
  /**
   * The original request data that triggered this subscription
   */
  origin: AdapterRequest
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
  /**
   * If a subscription is being warmed by a parent batch request
   * This will hold the subscription key of the parent
   */
  parent?: string
  /**
   * If a subscription is warming multiple other requests
   * This will hold a map of the subscription key to the last time it was seen
   */
  children?: { [childKey: string]: number }
}

export interface SubscriptionState {
  [requestKey: string]: SubscriptionData
}

export const subscriptionsReducer = createReducer<SubscriptionState>({}, (builder) => {
  builder.addCase(actions.warmupSubscribed, (state, action) => {
    const key = getSubscriptionKey(action.payload)
    state[key] = {
      origin: action.payload,
      executeFn: action.payload.executeFn,
      startedAt: Date.now(),
      isDuplicate: !!state[key],
      parent: action.payload.parent || state[key]?.parent,
      children: action.payload.children,
    }
  })

  builder.addCase(actions.warmupUnsubscribed, (state, action) => {
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

export const warmupReducer = createReducer<RequestState>({}, (builder) => {
  builder.addCase(actions.warmupRequested, (state, action) => {
    if (!state[action.payload.key]) {
      logger.info('[warmupReducer] Creating subscription', {
        warmupSubscriptionKey: action.payload.key,
      })
      state[action.payload.key] = { error: null, successCount: 0, errorCount: 0 }
    }
  })

  builder.addCase(actions.warmupFulfilled, (state, action) => {
    const { key } = action.payload
    const subscription = state[key]
    if (!subscription) {
      logger.error(
        '[warmupReducer] Attempted to fulfill warmup request for a non-existing subscription',
        { warmupSubscriptionKey: key },
      )
      return state
    }
    subscription.successCount++
    subscription.error = null
    subscription.errorCount = 0
    return state
  })

  builder.addCase(actions.warmupFailed, (state, action) => {
    const { key } = action.payload
    const subscription = state[key]
    if (!subscription) {
      logger.error(
        '[warmupReducer] Attempted to fulfill warmup request for a non-existing subscription',
        { warmupSubscriptionKey: key },
      )
      return state
    }
    subscription.error = action.payload.error
    subscription.errorCount++
    subscription.successCount = 0
    return state
  })

  builder.addCase(actions.warmupUnsubscribed, (state, action) => {
    logger.info('[warmupReducer] Deleting subscription', {
      warmupSubscriptionKey: action.payload.key,
    })
    delete state[action.payload.key]
  })

  builder.addCase(actions.warmupStopped, (state, action) => {
    logger.info('[warmupReducer] Stopping subscription', {
      warmupSubscriptionKey: action.payload.key,
    })
    delete state[action.payload.key]
  })
})

export const rootReducer = combineReducers({
  subscriptions: subscriptionsReducer,
  warmups: warmupReducer,
})
export type RootState = ReturnType<typeof rootReducer>
