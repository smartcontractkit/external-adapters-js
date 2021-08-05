import { AdapterRequest, Execute } from '@chainlink/types'
import { combineReducers, createReducer } from '@reduxjs/toolkit'
import { logger } from '../external-adapter'
import * as actions from './actions'
import { getSubscriptionKey } from './util'

export interface BatchableProperty {
  name: string,
  limit?: number
}

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
   * If a subscription is being warmed by a parent batch request
   * This will hold the key of the request data to join
   */
  batchablePropertyPath?: BatchableProperty[]
  /**
   * If a subscription is warming multiple other requests
   * This will hold a map of the subscription key to the last time it was seen
   */
  childLastSeenById?: { [childKey: string]: number }
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
      batchablePropertyPath: payload.batchablePropertyPath || state[key]?.batchablePropertyPath,
      childLastSeenById: payload?.childLastSeenById,
    }
  })

  builder.addCase(actions.warmupUnsubscribed, (state, action) => {
    const subscription = state[action.payload.key]
    if (subscription) {
      delete state[action.payload.key]

      if (!subscription.childLastSeenById) {
        return
      }
      const children = Object.keys(subscription.childLastSeenById)
      for (const childKey of children) {
        delete state[childKey]
      }
    }
  })

  builder.addCase(actions.warmupJoinGroup, (state, { payload }) => {
    const batchWarmer = state[payload.parent]

    batchWarmer.childLastSeenById = {
      ...batchWarmer.childLastSeenById,
      ...payload.childLastSeenById,
    }
    for (const childKey in payload.childLastSeenById) {
      const childRequestData = state[childKey]?.origin
      if (childRequestData) {
        for (const { name } of payload.batchablePropertyPath) {
          const uniqueBatchableValue = new Set(batchWarmer.origin[name])
          uniqueBatchableValue.add(childRequestData[name] || childRequestData.data[name])
          batchWarmer.origin[name] = [...uniqueBatchableValue]
        }
      }
    }
  })

  builder.addCase(actions.warmupLeaveGroup, (state, { payload }) => {
    const batchWarmer = state[payload.parent]

    const childIdsToRemove = Object.keys(payload.childLastSeenById)

    const remainingChildIds = Object.keys(batchWarmer.childLastSeenById || {}).filter(
      (childId) => !childIdsToRemove.includes(childId),
    )

    // The request data for a batch request should only contain unique values
    const requestDataWithUniqueValues = Object.fromEntries<Set<string>>(
      payload.batchablePropertyPath.map(({ name }) => [name, new Set()]),
    )

    // Rebuild the request data without the removed children's data
    const batchRequestData = remainingChildIds.reduce((acc, childId) => {
      for (const { name } of payload.batchablePropertyPath) {
        acc[name].add(state[childId].origin[name])
      }
      return acc
    }, requestDataWithUniqueValues)

    // Transform the sets back into arrays
    const batchableRequestData = Object.fromEntries(
      Object.entries(batchRequestData).map(([path, map]) => [path, [...map]]),
    )

    batchWarmer.origin = {
      ...batchWarmer.origin,
      ...batchableRequestData,
    }

    for (const childKey in payload.childLastSeenById) {
      if (batchWarmer?.childLastSeenById?.[childKey])
        delete batchWarmer.childLastSeenById?.[childKey]
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
