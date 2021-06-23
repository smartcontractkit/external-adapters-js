import { AdapterRequest, Execute } from '@chainlink/types'
import { combineReducers, createReducer } from '@reduxjs/toolkit'
import { union } from 'lodash'
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
  origin: AdapterRequest['data']
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
  builder.addCase(actions.warmupSubscribed, (state, { payload }) => {
    const key = payload.key || getSubscriptionKey(payload)

    state[key] = {
      origin: payload.data,
      executeFn: payload.executeFn,
      startedAt: state[key]?.startedAt ?? Date.now(),
      isDuplicate: !!state[key],
      parent: payload.parent || state[key]?.parent,
      children: payload.children,
    }
  })

  builder.addCase(actions.warmupUnsubscribed, (state, action) => {
    delete state[action.payload.key]
  })

  builder.addCase(actions.warmupJoinGroup, (state, { payload }) => {
    const childOrigins = Object.keys(payload.children).map(
      (child) => (state[child].origin.data as any)[payload.batchable],
    )
    state[payload.parent] = {
      ...state[payload.parent],
      children: {
        ...state[payload.parent].children,
        ...payload.children,
      },
      origin: {
        ...state[payload.parent].origin,
        data: {
          ...(state[payload.parent].origin.data as any),
          [payload.batchable]: union(
            (state[payload.parent].origin.data as any)[payload.batchable],
            childOrigins,
          ),
        },
      },
    }
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

export type CacheWarmerState = ReturnType<typeof rootReducer>
