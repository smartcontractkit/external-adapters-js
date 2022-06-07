import { AdapterRequest } from '@chainlink/types'
import { omit } from 'lodash'
import { AnyAction } from 'redux'
import { combineEpics, createEpicMiddleware, Epic } from 'redux-observable'
import { from, merge, of, partition, race, timer } from 'rxjs'
import {
  catchError,
  delay,
  filter,
  map,
  mapTo,
  mergeMap,
  tap,
  take,
  takeUntil,
  withLatestFrom,
} from 'rxjs/operators'
import { RootState } from '../../..'
import {
  warmupExecute,
  warmupFailed,
  warmupFulfilled,
  warmupJoinGroup,
  warmupLeaveGroup,
  warmupRequested,
  warmupShutdown,
  warmupStopped,
  WarmupStoppedPayload,
  warmupSubscribed,
  warmupSubscribedMultiple,
  warmupSubscriptionTimeoutReset,
  warmupUnsubscribed,
  WarmupUnsubscribedPayload,
} from './actions'
import {
  Config,
  get,
  WARMUP_REQUEST_ID,
  WARMUP_BATCH_REQUEST_ID,
  MINIMUM_WARMUP_INTERVAL,
  WARMUP_POLL_OFFSET,
} from './config'
import { concatenateBatchResults, getSubscriptionKey, splitIntoBatches } from './util'
import { getTTL, getMaxAgeOverride } from '../cache/ttl'
import * as metrics from './metrics'
import { getFeedId } from '../../metrics/util'
import { PayloadAction } from '@reduxjs/toolkit'
import { serverShutdown } from '../../store'

export interface EpicDependencies {
  config: Config
}

export const executeHandler: Epic<AnyAction, AnyAction, RootState, EpicDependencies> = (
  action$,
  state$,
) => {
  const warmupExecute$ = action$.pipe(filter(warmupExecute.match))
  const [batchExecute$, execute$] = partition(
    warmupExecute$,
    (val) => !!val.payload.result?.debug?.batchablePropertyPath,
  )

  const subscribeBatch$ = batchExecute$.pipe(
    withLatestFrom(state$),
    mergeMap(([{ payload }, state]) => {
      const actionsToDispatch: AnyAction[] = []

      const batchablePropertyPath = payload.result?.debug?.batchablePropertyPath

      // We want the key to be consistent. So we omit batchable paths.
      // Otherwise it would change on every new child
      const batchWarmerSubscriptionKey =
        payload.debug?.batchCacheKey ??
        getSubscriptionKey(
          omit(
            payload,
            batchablePropertyPath?.map(({ name }) => `data.${name}`),
          ),
        )

      const existingBatchWarmer = state.cacheWarmer.subscriptions[batchWarmerSubscriptionKey]

      // Start placeholder subscriptions for children
      const childLastSeenById: { [childKey: string]: number } = {}
      // If result was from a batch request
      if (payload.result?.data?.results) {
        const members = []
        for (const [childKey, request] of Object.values<[string, AdapterRequest, number]>(
          payload.result.data.results,
        )) {
          const warmupSubscribedPayloadChild = {
            ...payload,
            ...request,
            parent: batchWarmerSubscriptionKey,
            batchablePropertyPath,
            key: childKey,
          }
          childLastSeenById[childKey] = Date.now()
          members.push(warmupSubscribedPayloadChild)
        }
        actionsToDispatch.push(warmupSubscribedMultiple({ members }))
      } else {
        const warmupSubscribedPayloadChild = {
          ...payload,
          parent: batchWarmerSubscriptionKey,
          batchablePropertyPath,
        }
        const childKey = payload.debug?.cacheKey ?? getSubscriptionKey(warmupSubscribedPayloadChild)
        childLastSeenById[childKey] = Date.now()
        actionsToDispatch.push(warmupSubscribed(warmupSubscribedPayloadChild))
      }

      // If batch warmer already exists join it by adding childLastSeenById to request data
      if (existingBatchWarmer && batchablePropertyPath) {
        actionsToDispatch.push(
          warmupJoinGroup({
            parent: batchWarmerSubscriptionKey,
            childLastSeenById: childLastSeenById,
            batchablePropertyPath,
          }),
        )
      }
      // If batch warmer does not exist, start it
      else {
        // If incoming batchable request parameters aren't an array, transform into one
        let batchWarmerData = {
          ...payload.data,
          resultPath: undefined,
        }
        for (const { name } of batchablePropertyPath || []) {
          if (!Array.isArray(batchWarmerData[name]))
            batchWarmerData = {
              ...batchWarmerData,
              [name]: [batchWarmerData[name]],
            }
        }

        actionsToDispatch.push(
          warmupSubscribed({
            ...payload,
            data: batchWarmerData,
            key: batchWarmerSubscriptionKey,
            childLastSeenById,
            batchablePropertyPath,
          }),
        )
      }

      return from(actionsToDispatch)
    }),
  )

  const subscribeIndividual$ = execute$.pipe(map(({ payload }) => warmupSubscribed(payload)))

  return merge(subscribeBatch$, subscribeIndividual$)
}

export const warmupSubscriber: Epic<AnyAction, AnyAction, any, EpicDependencies> = (
  action$,
  state$,
  { config },
) =>
  action$.pipe(
    filter(warmupSubscribed.match),
    map(({ payload }) => ({
      payload,
      key: payload.key || payload.debug?.cacheKey || getSubscriptionKey(payload),
    })),
    withLatestFrom(state$),
    // check if the subscription already exists, then noop
    filter(([{ payload, key }, state]) => {
      // if a child, register, but don't warm
      if (payload.parent) {
        return false
      }
      // if subscription does not exist, then continue
      // this check doesnt work because state is already set!
      return !state.cacheWarmer.subscriptions[key]?.isDuplicate
    }),
    tap(([{ payload }]) => {
      const labels = {
        isBatched: String(!!payload.childLastSeenById),
      }
      metrics.cache_warmer_count.labels(labels).inc()
    }),
    // on a subscribe action being dispatched, spin up a long lived interval if one doesnt exist yet
    mergeMap(([{ payload, key }]) => {
      // Interval should be set to the warmup interval if configured,
      // otherwise use the TTL from the request.
      const interval = Math.max(
        getMaxAgeOverride(payload) || config.warmupInterval || getTTL(payload),
        MINIMUM_WARMUP_INTERVAL,
      )
      const pollInterval =
        interval > WARMUP_POLL_OFFSET * 2 ? interval - WARMUP_POLL_OFFSET : interval
      return timer(pollInterval, pollInterval).pipe(
        mapTo(warmupRequested({ key })),
        takeUntil(
          action$.pipe(
            filter((action) => serverShutdown.match(action) || warmupShutdown.match(action)),
          ),
        ),
        // unsubscribe our warmup algo when a matching unsubscribe comes in
        takeUntil(
          action$.pipe(
            filter(warmupUnsubscribed.match || warmupStopped.match),
            filter((a: PayloadAction<WarmupUnsubscribedPayload | WarmupStoppedPayload>) => {
              return (
                ('key' in a.payload && a.payload.key === key) ||
                ('keys' in a.payload && a.payload.keys.includes(key))
              )
            }),
            withLatestFrom(state$),
            tap(([{ payload }]) => {
              const labels = {
                isBatched: String(payload.isBatched),
              }
              metrics.cache_warmer_count.labels(labels).dec()
            }),
          ),
        ),
      )
    }),
  )

/**
 * Handle warmup response request events
 */
export const warmupRequestHandler: Epic<AnyAction, AnyAction, any> = (action$, state$) =>
  action$.pipe(
    // this pipeline will execute when we have a request to warm up an adapter
    filter(warmupRequested.match),
    // fetch our required state to make a request to warm up an adapter
    withLatestFrom(state$),
    map(([action, state]) => {
      return {
        requestData: state.cacheWarmer.subscriptions[action.payload.key],
        key: action.payload.key,
        subscriptions: state.cacheWarmer.subscriptions,
      }
    }),
    filter(({ requestData }) => !!requestData),
    // make the request
    mergeMap(({ requestData, key }) =>
      from(
        requestData.batchablePropertyPath
          ? (async () => {
              const batches = splitIntoBatches(requestData)
              const requests = []
              for (const batch of Object.values(batches)) {
                const data = {
                  ...requestData.origin,
                  ...batch,
                }
                requests.push(
                  requestData.executeFn({
                    id: requestData.childLastSeenById ? WARMUP_BATCH_REQUEST_ID : WARMUP_REQUEST_ID,
                    data,
                    debug: { warmer: true },
                  }),
                )
              }
              const responses = await Promise.all(requests)
              let result = null
              for (const resp of responses) {
                result = concatenateBatchResults(result, resp)
              }
              return result
            })()
          : requestData.executeFn({
              id: requestData.childLastSeenById ? WARMUP_BATCH_REQUEST_ID : WARMUP_REQUEST_ID,
              data: { ...requestData.origin },
              debug: { warmer: true },
            }),
      ).pipe(
        mapTo(warmupFulfilled({ key })),
        catchError((error: unknown) =>
          of(
            warmupFailed({
              feedLabel: getFeedId({
                id: requestData.childLastSeenById ? WARMUP_BATCH_REQUEST_ID : WARMUP_REQUEST_ID,
                data: requestData?.origin,
              }),
              error: error as Error,
              key,
            }),
          ),
        ),
      ),
    ),
  )

// we can combine this into one of the above epics if we have performance issues later on
export const warmupUnsubscriber: Epic<AnyAction, AnyAction, any, EpicDependencies> = (
  action$,
  state$,
  { config },
) => {
  const unsubscribeOnFailure$ = action$.pipe(
    filter(warmupFailed.match),
    withLatestFrom(state$),
    filter(
      ([{ payload }, state]) =>
        (state.cacheWarmer.warmups[payload.key]?.errorCount ?? 0 >= config.unhealthyThreshold) &&
        config.unhealthyThreshold !== -1,
    ),
    map(([{ payload }, state]) => {
      const isBatched = !!state.cacheWarmer.subscriptions[payload.key]?.childLastSeenById
      return warmupUnsubscribed({
        key: payload.key,
        isBatched,
        reason: `Errored: ${payload.error.message}`,
      })
    }),
  )

  // emits whenever a subscription event comes in,
  // used as a helper stream for the timeout limit stream
  const keyedSubscription$ = action$.pipe(
    filter(warmupSubscribed.match),
    map(({ payload }) => ({
      payload,
      key: payload.debug?.cacheKey || getSubscriptionKey(payload),
    })),
  )

  const unsubscribeOnTimeout$ = keyedSubscription$.pipe(
    // when a subscription comes in
    withLatestFrom(state$),
    mergeMap(([{ key }, state]) => {
      // we look for matching subscriptions of the same type
      // which deactivates the current timer
      const reset$ = keyedSubscription$.pipe(
        filter(({ key: keyB }) => key === keyB),
        take(1),
        mapTo(warmupSubscriptionTimeoutReset({ key })),
      )
      const isBatched = !!state.cacheWarmer.subscriptions[key]?.childLastSeenById

      // start the current unsubscription timer
      const timeout$ = of(warmupUnsubscribed({ key, isBatched, reason: 'Timeout' })).pipe(
        delay(config.subscriptionTTL),
        takeUntil(
          action$.pipe(
            filter((action) => serverShutdown.match(action) || warmupShutdown.match(action)),
          ),
        ),
      )

      // if a re-subscription comes in before timeout emits, then we emit nothing
      // else we unsubscribe from the current subscription
      return race(reset$, timeout$)
    }),
  )

  const stopOnBatch$ = keyedSubscription$.pipe(
    // when a subscription comes in, if it has children
    filter(({ payload }) => !!payload?.childLastSeenById),
    mergeMap(({ payload }) => [
      warmupStopped({
        keys: Object.keys(payload?.childLastSeenById || {}),
        isBatched: !!payload?.childLastSeenById,
      }),
    ]),
  )

  const unsubscribeOnBatchEmpty$ = action$.pipe(
    filter(warmupLeaveGroup.match),
    withLatestFrom(state$),
    filter(([{ payload }, state]) => {
      for (const { name } of payload.batchablePropertyPath) {
        if (state.cacheWarmer.subscriptions[payload.parent].origin[name].length === 0) return true
      }
      return false
    }),
    map(([{ payload }]) =>
      warmupUnsubscribed({
        key: payload.parent,
        isBatched: true,
        reason: 'Empty Batch Warmer request data',
      }),
    ),
  )

  return merge(unsubscribeOnFailure$, unsubscribeOnTimeout$, stopOnBatch$, unsubscribeOnBatchEmpty$)
}

export const rootEpic = combineEpics(
  executeHandler,
  warmupSubscriber,
  warmupUnsubscriber,
  warmupRequestHandler,
)

export const epicMiddleware = createEpicMiddleware<any, any, any, EpicDependencies>({
  dependencies: { config: get() },
})
