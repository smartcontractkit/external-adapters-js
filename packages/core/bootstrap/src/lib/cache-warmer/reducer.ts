import { AdapterRequest, Execute } from '@chainlink/types'
import { combineReducers, createReducer } from '@reduxjs/toolkit'
import { logger } from '../external-adapter'
import * as actions from './actions'
import { getSubscriptionKey } from './util'
import { merge, uniq } from 'lodash'

export interface BatchableProperty {
  name: string
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

  builder.addCase(actions.warmupSubscribedMultiple, (state, { payload }) => {
    for (const member of payload.members) {
      const key = member.key || getSubscriptionKey(member)
      state[key] = {
        origin: member.data,
        executeFn: member.executeFn,
        startedAt: state[key]?.startedAt ?? Date.now(),
        isDuplicate: !!state[key],
        parent: member.parent || state[key]?.parent,
        batchablePropertyPath: member.batchablePropertyPath || state[key]?.batchablePropertyPath,
        childLastSeenById: member?.childLastSeenById,
      }
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
        // Join request data
        for (const { name } of payload.batchablePropertyPath) {
          const uniqueBatchableValue = new Set(batchWarmer.origin[name])
          uniqueBatchableValue.add(childRequestData[name] || childRequestData.data[name])
          batchWarmer.origin[name] = [...uniqueBatchableValue]
        }

        // Join overrides
        if (batchWarmer.origin.overrides || childRequestData.overrides)
          batchWarmer.origin.overrides = merge(
            batchWarmer.origin.overrides,
            childRequestData.overrides,
          )
        if (batchWarmer.origin.tokenOverrides || childRequestData.tokenOverrides)
          batchWarmer.origin.tokenOverrides = merge(
            batchWarmer.origin.tokenOverrides,
            childRequestData.tokenOverrides,
          )
        if (batchWarmer.origin.includes || childRequestData.includes)
          batchWarmer.origin.includes = uniq([
            ...(batchWarmer.origin.includes || []),
            ...(childRequestData.includes || []),
          ])
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

    // Rebuild the overrides
    const overrides = remainingChildIds.reduce<{
      overrides?: Record<string, string>
      tokenOverrides?: Record<string, string>
      includes?: string[]
    }>((acc, childId) => {
      const childOriginData = state[childId].origin
      if (childOriginData.overrides)
        acc.overrides = merge(acc.overrides || {}, childOriginData.overrides)
      if (childOriginData.tokenOverrides)
        acc.tokenOverrides = merge(acc.tokenOverrides || {}, childOriginData.tokenOverrides)
      if (childOriginData.includes)
        acc.includes = uniq([...(acc.includes || []), ...childOriginData.includes])
      return acc
    }, {})

    batchWarmer.origin = {
      ...batchWarmer.origin,
      ...batchableRequestData,
      ...overrides,
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
    const { key, feedLabel: id, error } = action.payload
    const subscription = state[key]
    if (!subscription) {
      logger.error(
        '[warmupReducer] Attempted to fulfill warmup request for a non-existing subscription',
        { warmupSubscriptionKey: key },
      )
      return state
    }
    logger.error(`[${id}] Cache Warmer failed`, { error: error?.message })
    subscription.error = action.payload.error
    subscription.errorCount++
    subscription.successCount = 0
    return state
  })

  builder.addCase(actions.warmupUnsubscribed, (state, action) => {
    const { key, reason } = action.payload
    logger.info('[warmupReducer] Deleting subscription. ', { reason })
    delete state[key]
  })

  builder.addCase(actions.warmupStopped, (state, action) => {
    logger.info('[warmupReducer] Stopping subscriptions', {
      warmupSubscriptionKey: action.payload.keys,
    })
    for (const key in action.payload.keys) {
      delete state[key]
    }
  })
})

export const rootReducer = combineReducers({
  subscriptions: subscriptionsReducer,
  warmups: warmupReducer,
})

export type CacheWarmerState = ReturnType<typeof rootReducer>
